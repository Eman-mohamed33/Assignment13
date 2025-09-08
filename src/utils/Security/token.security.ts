import {JwtPayload, Secret,sign, SignOptions, verify} from 'jsonwebtoken';
import { HUserDocument, RoleEnum, UserModel } from '../../DB/models/User.model';
import { log } from 'console';
import { BadRequestException, unAuthorizedException } from '../Response/error.response';
import { UserRepository } from '../../DB/Repository/User.repository';
import { nanoid } from 'nanoid';
import { HTokenDocument, TokenModel } from '../../DB/models/Token.model';
import { TokenRepository } from '../../DB/Repository/Token.repository';

export enum SignatureLevelEnum{
    Bearer = "Bearer",
    System="System"
}

export enum TokenEnum{
    access = "access",
    refresh="refresh"
};

export enum LogoutEnum{
    only = "only",
    all = "all"
};


export const generateToken = async ({
    payLoad,
    signature = process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
    options = { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN) }
}: {
    payLoad: object,
    signature?: Secret,
    options?: SignOptions
}): Promise<string> => {
    return sign(payLoad, signature, options);
};

export const verifyToken = async ({
    token,
    signature = process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
}: {
    token: string,
    signature?: Secret,

}): Promise<JwtPayload> => {
    return verify(token, signature) as JwtPayload;
};

export const detectSignatureLevel = async (role: RoleEnum = RoleEnum.user):Promise<SignatureLevelEnum> => {
    let signatureLevel: SignatureLevelEnum = SignatureLevelEnum.Bearer;

    switch (role) {
        case RoleEnum.admin:
            signatureLevel = SignatureLevelEnum.System;
            break;
        default:
            signatureLevel = SignatureLevelEnum.Bearer;
            break;
    }

    return signatureLevel;
};


export const getSignatures = async (signatureLevel: SignatureLevelEnum = SignatureLevelEnum.Bearer
): Promise<{ access_signature: string, refresh_signature: string }> => {
  
    let signatures: { access_signature: string, refresh_signature: string } = { access_signature: "", refresh_signature: "" };
  
    switch (signatureLevel) {
        case SignatureLevelEnum.System:
            signatures.access_signature = process.env.ACCESS_ADMIN_TOKEN_SIGNATURE as string;
            signatures.refresh_signature = process.env.REFRESH_ADMIN_TOKEN_SIGNATURE as string;
            break;
        default:
            signatures.access_signature = process.env.ACCESS_USER_TOKEN_SIGNATURE as string;
            signatures.refresh_signature = process.env.REFRESH_USER_TOKEN_SIGNATURE as string;
            break;
    }

    return signatures;
};

export const createLoginCredentials = async (user: HUserDocument) => {
    const signatureLevel = await detectSignatureLevel(user.role);
    const signatures = await getSignatures(signatureLevel);
    log({ signatures });
    const jwtId = nanoid();
    const access_token = await generateToken({
        payLoad: { _id: user?._id },
        signature: signatures.access_signature,
        options: {
            expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
            jwtid: jwtId
        }
    });
    
    const refresh_token = await generateToken({
        payLoad: { _id: user?._id },
        signature: signatures.refresh_signature,
        options: {
            expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
            jwtid: jwtId
        }
    });
    
    return { access_token, refresh_token };
};


export const decodeToken = async ({
    authorization,
    tokenType = TokenEnum.access
}:
    {
        authorization: string,
        tokenType?: TokenEnum

    }) => {
 
    const userModel = new UserRepository(UserModel);
    const tokenModel = new TokenRepository(TokenModel);

    const [bearerKey, token] = authorization.split(" ");

    if (!bearerKey || !token) {
        throw new unAuthorizedException("Missing Token Parts");
    }

    const signature = await getSignatures(bearerKey as SignatureLevelEnum);
    const decoded = await verifyToken({
        token,
        signature: tokenType === TokenEnum.refresh ? signature.refresh_signature : signature.access_signature
    });

    if (!decoded?._id || !decoded?.iat) {
        throw new BadRequestException("In-valid tokens payload");
    }

    
    if (await tokenModel.findOne({
        filter: { jti: decoded.jti }
    })) {
        throw new unAuthorizedException("Invalid or Old Login Credentials");
    }

    const user = await userModel.findOne({ filter: { _id: decoded._id } });


    if (!user) {
        throw new BadRequestException("User not Registered");
    }
    
    // if (user.changeCredentialsTime?.getTime() || 0 > decoded.iat * 1000) {
    //     throw new unAuthorizedException("Invalid or Old Login Credentials");
    // }
    return { user, decoded };
}

export const createRevokeToken = async (decoded : JwtPayload):Promise<HTokenDocument> => {
    const tokenModel = new TokenRepository(TokenModel);
    const [result] = await tokenModel.create({
        data: [{
            jti: decoded.jti as string,
            expiresIn: (decoded.iat as number) + Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
            userId: decoded._id
        }]
    }) || [];

    if (!result) {
        throw new BadRequestException("Fail to revoke this token");
    }

    return result;
}