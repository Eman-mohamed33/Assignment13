import type { Request, Response } from "express";
import { ILogoutBodyDto } from "./user.dto";
import { UpdateQuery } from "mongoose";
import { HUserDocument, IUser, UserModel } from "../../DB/models/User.model";
import { createLoginCredentials, createRevokeToken, LogoutEnum } from "../../utils/Security/token.security";
import { UserRepository } from "../../DB/Repository/User.repository";
import { JwtPayload } from "jsonwebtoken";



class UserService {
    private userModel = new UserRepository(UserModel);
   

    constructor() { }
    
    profile = async (req: Request, res: Response): Promise<Response> => {
        return res.json({
            message: "Done", data: {
                user: req.user,
                decoded: req.decoded?.iat
            }
        });
    }
     
    logout = async (req: Request, res: Response): Promise<Response> => {
        const { flag }: ILogoutBodyDto = req.body;
        let statusCode = 200;
        const update: UpdateQuery<IUser> = {};

        switch (flag) {
            case LogoutEnum.all:
                update.changeCredentialsTime = new Date();
                break;
         
            default:
                await createRevokeToken(req.decoded as JwtPayload);
                statusCode = 201;
                break;
        }

        const user = await this.userModel.updateOne({
            filter: { _id: req.decoded?._id },
            update
        });
        return res.status(statusCode).json({
            message: "Done", data: {
                user
            }
        });
    }

    refreshToken = async (req: Request, res: Response): Promise<Response> => {
        const credentials = await createLoginCredentials(req.user as HUserDocument);
        await createRevokeToken(req.decoded as JwtPayload);

        return res.status(201).json({
            message: "Done", data: {
                credentials
            }
        });

    }
}


export default new UserService;
