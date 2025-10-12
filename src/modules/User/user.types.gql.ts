import {
    GraphQLBoolean,
    GraphQLEnumType,
    GraphQLID,
    GraphQLInt,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLString
} from "graphql";
import { GenderEnum, HUserDocument, ProviderEnum, RoleEnum } from "../../DB/models/User.model";
import { GraphQlUniformResponse } from "../GraphQl/types.gql";

export const GraphQLGenderEnumType = new GraphQLEnumType({
    name: "GenderEnumType",
    values: {
        male: { value: GenderEnum.male },
        female: { value: GenderEnum.female }
    }
});

export const GraphQLRoleEnumType = new GraphQLEnumType({
    name: "RoleEnumType",
    values: {
        user: { value: RoleEnum.user },
        admin: { value: RoleEnum.admin },
        superAdmin: { value: RoleEnum.superAdmin },
    }
});

export const GraphQLProviderEnumType = new GraphQLEnumType({
    name: "ProviderEnumType",
    values: {
        google: { value: ProviderEnum.google },
        system: { value: ProviderEnum.system }
    }
});

export const GraphQlOneUserType = new GraphQLObjectType({
    name: "OneUserResponse",
    fields: {
        _id: { type: GraphQLID },
        
        userName: {
            type: GraphQLString,
            resolve: (parent: HUserDocument) => {
                return parent.gender === GenderEnum.male ? `Mr ${parent.userName}` : `Mrs ${parent.userName}`
            }
        },
        firstName: { type: GraphQLString },
        lastName: { type: GraphQLString },
          
        
        
        email: { type: GraphQLString },
        confirmEmail: { type: GraphQLString },
        confirmEmailOtp: {
            type: new GraphQLObjectType({
                name: "confirmEmailOtp",
                fields: {
                    Value: { type: GraphQLString },
                    attempts: { type: GraphQLInt },
                    expiredAt: { type: GraphQLString },
                    banUntil: { type: GraphQLString },
                }
            
            })
        }
        ,
        
        password: { type: GraphQLString },
        resetPasswordOtp: { type: GraphQLString },
            
        changeCredentialsTime: { type: GraphQLString },
        
        gender: { type: GraphQLGenderEnumType },
        role: { type: GraphQLRoleEnumType },
        
        phone: { type: GraphQLString },
        address: { type: GraphQLString },
        age: { type: GraphQLInt },
            
        createdAt: { type: GraphQLString },
        updatedAt: { type: GraphQLString },
        
        provider: { type: GraphQLProviderEnumType },
        profileImage: { type: GraphQLString },
        tempOldProfileImage: { type: GraphQLString },
        profileCoverImages: { type: new GraphQLList(GraphQLString) },
        
        
        deletedAt: { type: GraphQLString },
        deletedBy: { type: GraphQLID },
        restoredAt: { type: GraphQLString },
        restoredBy: { type: GraphQLID },
           
        BlockList: { type: new GraphQLList(GraphQLString) },
        
        
        stepVerificationOtp: { type: GraphQLString },
        enable2stepVerification: { type: GraphQLBoolean },
        
        friends: { type: new GraphQLList(GraphQLString) },
           
    }
});

export const welcome = GraphQLString;
export const checkBoolean = new GraphQLNonNull(GraphQLBoolean);
export const getAllUsers = new GraphQLList(GraphQlOneUserType);
export const searchUser = GraphQlUniformResponse({ name: "SearchKey", data: new GraphQLNonNull(GraphQlOneUserType) });
export const addFollower = new GraphQLList(GraphQlOneUserType);
