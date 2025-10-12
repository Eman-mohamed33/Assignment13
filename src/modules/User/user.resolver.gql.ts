import { GenderEnum, HUserDocument } from "../../DB/models/User.model";
import { graphQlAuthorization } from "../../middleware/authentication.middleware";
import { graphQlValidation } from "../../middleware/validation.middleware";
import { IAuthGraphQl } from "../GraphQl/schema.interfaces";
import { endPoint } from "./user.authorization";
import { IUser } from "./user.schema.gql";
import { UserService } from "./user.service";
import * as validators from "./user.validation";
export class UserResolver {
    private userService: UserService = new UserService();
    constructor() { };

    welcome = async (parent: unknown, args: { name: string }, context: IAuthGraphQl): Promise<string> => {
        // console.log({ token: context.req.headers.authorization });
        // const { user } = await decodeToken({ authorization: context.req.headers.authorization, tokenType: TokenEnum.access });

        //   console.log({ token: context.req.raw.user });
        // console.log({ token: context.user });
        // context.req.context.res.status(201).json({ message: "Dooone" });
        await graphQlValidation<{ name: string }>(validators.welcome, args);
        await graphQlAuthorization(endPoint.welcome, context.user.role);
        
        return this.userService.welcome();
    };
    
    checkBoolean = (parent: unknown, args: any): boolean => {
        return this.userService.checkBoolean();
    };
    
    getAllUsers = async (parent: unknown,
        args: { gender: GenderEnum },
        context: IAuthGraphQl
    ): Promise<HUserDocument[]> => {
        return await this.userService.getAllUsers(args, context.user);
    };

    searchUser = (parent: unknown, args: { email: string }): { message: string, statusCode: number, data: IUser } => {
        return this.userService.searchUser(args);
    };
    
    addFollower = (parent: unknown, args: { friendId: number, myId: number }): IUser[] => {
        return this.userService.addFollower(args);
    };
}