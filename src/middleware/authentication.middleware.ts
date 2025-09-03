import type { Request, Response, NextFunction } from "express";

import { BadRequestException, forbiddenException } from "../utils/Response/error.response";
import { decodeToken, TokenEnum } from "../utils/Security/token.security";
import { RoleEnum } from "../DB/models/User.model";




export const authentication = (tokenType: TokenEnum = TokenEnum.access) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.headers.authorization) {
            throw new BadRequestException("Validation Error", {
                key: "headers",
                issues: [{
                    path: "authorization",
                    message: "missing authorization"
                }]
            });
        }

        const { user, decoded } = await decodeToken({ authorization: req.headers.authorization, tokenType });

        req.user = user;
        req.decoded = decoded;
        next();
    };
};


export const authorization = (accessRoles: RoleEnum[] = [], tokenType: TokenEnum = TokenEnum.access) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.headers.authorization) {
            throw new BadRequestException("Validation Error", {
                key: "headers",
                issues: [{
                    path: "authorization",
                    message: "missing authorization"
                }]
            });
        }

        const { user, decoded } = await decodeToken({ authorization: req.headers.authorization, tokenType });

        if (!accessRoles.includes(user.role)) {
            throw new forbiddenException("Not Authorized Account");
        }
        req.user = user;
        req.decoded = decoded;
        next();
    };
};