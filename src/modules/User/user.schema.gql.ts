
import { GenderEnum } from "../../DB/models/User.model";
import * as gqlTypes from "./user.types.gql";
import * as gqlArgs from "./user.args.gql";
import { UserResolver } from "./user.resolver.gql";

export interface IUser {
        id: number;
        name: string;
        email: string;
        gender: GenderEnum;
        password: string;
        followers: number[];
};

class UserGQlSchema {
    private userResolver: UserResolver = new UserResolver();

    constructor() { }
    registerQuery = () => {
        return {
            welcome: {
                type: gqlTypes.welcome,
                description: "",
                args: gqlArgs.welcome,
                resolve: this.userResolver.welcome
            },
        
            checkBoolean: {
                type: gqlTypes.checkBoolean,
                resolve: this.userResolver.checkBoolean
            },
        
            getAllUsers: {
                type: gqlTypes.getAllUsers,
                args: gqlArgs.getAllUsers,
                resolve: this.userResolver.getAllUsers
            },
        
            searchUser: {
                type: gqlTypes.searchUser,
                args: gqlArgs.searchUser,
                resolve: this.userResolver.searchUser
            }
        }
                        
    }

    registerMutation = () => {
        return {
            addFollower: {
                type: gqlTypes.getAllUsers,
                args: gqlArgs.addFollower,
                resolve: this.userResolver.addFollower
            }
        }
    }
}

export default new UserGQlSchema();