"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = exports.authentication = void 0;
const error_response_1 = require("../utils/Response/error.response");
const token_security_1 = require("../utils/Security/token.security");
const authentication = (tokenType = token_security_1.TokenEnum.access) => {
    return async (req, res, next) => {
        if (!req.headers.authorization) {
            throw new error_response_1.BadRequestException("Validation Error", {
                key: "headers",
                issues: [{
                        path: "authorization",
                        message: "missing authorization"
                    }]
            });
        }
        const { user, decoded } = await (0, token_security_1.decodeToken)({ authorization: req.headers.authorization, tokenType });
        req.user = user;
        req.decoded = decoded;
        next();
    };
};
exports.authentication = authentication;
const authorization = (accessRoles = [], tokenType = token_security_1.TokenEnum.access) => {
    return async (req, res, next) => {
        if (!req.headers.authorization) {
            throw new error_response_1.BadRequestException("Validation Error", {
                key: "headers",
                issues: [{
                        path: "authorization",
                        message: "missing authorization"
                    }]
            });
        }
        const { user, decoded } = await (0, token_security_1.decodeToken)({ authorization: req.headers.authorization, tokenType });
        if (!accessRoles.includes(user.role)) {
            throw new error_response_1.forbiddenException("Not Authorized Account");
        }
        req.user = user;
        req.decoded = decoded;
        next();
    };
};
exports.authorization = authorization;
