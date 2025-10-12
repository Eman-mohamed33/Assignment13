"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const gqlTypes = __importStar(require("./user.types.gql"));
const gqlArgs = __importStar(require("./user.args.gql"));
const user_resolver_gql_1 = require("./user.resolver.gql");
;
class UserGQlSchema {
    userResolver = new user_resolver_gql_1.UserResolver();
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
        };
    };
    registerMutation = () => {
        return {
            addFollower: {
                type: gqlTypes.getAllUsers,
                args: gqlArgs.addFollower,
                resolve: this.userResolver.addFollower
            }
        };
    };
}
exports.default = new UserGQlSchema();
