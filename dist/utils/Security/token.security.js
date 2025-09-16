"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRevokeToken = exports.decodeToken = exports.createLoginCredentials = exports.getSignatures = exports.detectSignatureLevel = exports.verifyToken = exports.generateToken = exports.LogoutEnum = exports.TokenEnum = exports.SignatureLevelEnum = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const User_model_1 = require("../../DB/models/User.model");
const console_1 = require("console");
const error_response_1 = require("../Response/error.response");
const Repository_1 = require("../../DB/Repository");
const nanoid_1 = require("nanoid");
const Token_model_1 = require("../../DB/models/Token.model");
const Repository_2 = require("../../DB/Repository");
var SignatureLevelEnum;
(function (SignatureLevelEnum) {
    SignatureLevelEnum["Bearer"] = "Bearer";
    SignatureLevelEnum["System"] = "System";
})(SignatureLevelEnum || (exports.SignatureLevelEnum = SignatureLevelEnum = {}));
var TokenEnum;
(function (TokenEnum) {
    TokenEnum["access"] = "access";
    TokenEnum["refresh"] = "refresh";
})(TokenEnum || (exports.TokenEnum = TokenEnum = {}));
;
var LogoutEnum;
(function (LogoutEnum) {
    LogoutEnum["only"] = "only";
    LogoutEnum["all"] = "all";
})(LogoutEnum || (exports.LogoutEnum = LogoutEnum = {}));
;
const generateToken = async ({ payLoad, signature = process.env.ACCESS_USER_TOKEN_SIGNATURE, options = { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN) } }) => {
    return (0, jsonwebtoken_1.sign)(payLoad, signature, options);
};
exports.generateToken = generateToken;
const verifyToken = async ({ token, signature = process.env.ACCESS_USER_TOKEN_SIGNATURE, }) => {
    return (0, jsonwebtoken_1.verify)(token, signature);
};
exports.verifyToken = verifyToken;
const detectSignatureLevel = async (role = User_model_1.RoleEnum.user) => {
    let signatureLevel = SignatureLevelEnum.Bearer;
    switch (role) {
        case User_model_1.RoleEnum.admin:
            signatureLevel = SignatureLevelEnum.System;
            break;
        default:
            signatureLevel = SignatureLevelEnum.Bearer;
            break;
    }
    return signatureLevel;
};
exports.detectSignatureLevel = detectSignatureLevel;
const getSignatures = async (signatureLevel = SignatureLevelEnum.Bearer) => {
    let signatures = { access_signature: "", refresh_signature: "" };
    switch (signatureLevel) {
        case SignatureLevelEnum.System:
            signatures.access_signature = process.env.ACCESS_ADMIN_TOKEN_SIGNATURE;
            signatures.refresh_signature = process.env.REFRESH_ADMIN_TOKEN_SIGNATURE;
            break;
        default:
            signatures.access_signature = process.env.ACCESS_USER_TOKEN_SIGNATURE;
            signatures.refresh_signature = process.env.REFRESH_USER_TOKEN_SIGNATURE;
            break;
    }
    return signatures;
};
exports.getSignatures = getSignatures;
const createLoginCredentials = async (user) => {
    const signatureLevel = await (0, exports.detectSignatureLevel)(user.role);
    const signatures = await (0, exports.getSignatures)(signatureLevel);
    (0, console_1.log)({ signatures });
    const jwtId = (0, nanoid_1.nanoid)();
    const access_token = await (0, exports.generateToken)({
        payLoad: { _id: user?._id },
        signature: signatures.access_signature,
        options: {
            expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
            jwtid: jwtId
        }
    });
    const refresh_token = await (0, exports.generateToken)({
        payLoad: { _id: user?._id },
        signature: signatures.refresh_signature,
        options: {
            expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
            jwtid: jwtId
        }
    });
    return { access_token, refresh_token };
};
exports.createLoginCredentials = createLoginCredentials;
const decodeToken = async ({ authorization, tokenType = TokenEnum.access }) => {
    const userModel = new Repository_1.UserRepository(User_model_1.UserModel);
    const tokenModel = new Repository_2.TokenRepository(Token_model_1.TokenModel);
    const [bearerKey, token] = authorization.split(" ");
    if (!bearerKey || !token) {
        throw new error_response_1.unAuthorizedException("Missing Token Parts");
    }
    const signature = await (0, exports.getSignatures)(bearerKey);
    const decoded = await (0, exports.verifyToken)({
        token,
        signature: tokenType === TokenEnum.refresh ? signature.refresh_signature : signature.access_signature
    });
    if (!decoded?._id || !decoded?.iat) {
        throw new error_response_1.BadRequestException("In-valid tokens payload");
    }
    if (await tokenModel.findOne({
        filter: { jti: decoded.jti }
    })) {
        throw new error_response_1.unAuthorizedException("Invalid or Old Login Credentials");
    }
    const user = await userModel.findOne({ filter: { _id: decoded._id } });
    if (!user) {
        throw new error_response_1.BadRequestException("User not Registered");
    }
    return { user, decoded };
};
exports.decodeToken = decodeToken;
const createRevokeToken = async (decoded) => {
    const tokenModel = new Repository_2.TokenRepository(Token_model_1.TokenModel);
    const [result] = await tokenModel.create({
        data: [{
                jti: decoded.jti,
                expiresIn: decoded.iat + Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
                userId: decoded._id
            }]
    }) || [];
    if (!result) {
        throw new error_response_1.BadRequestException("Fail to revoke this token");
    }
    return result;
};
exports.createRevokeToken = createRevokeToken;
