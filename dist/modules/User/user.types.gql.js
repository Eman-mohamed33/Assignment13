"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFollower = exports.searchUser = exports.getAllUsers = exports.checkBoolean = exports.welcome = exports.GraphQlOneUserType = exports.GraphQLProviderEnumType = exports.GraphQLRoleEnumType = exports.GraphQLGenderEnumType = void 0;
const graphql_1 = require("graphql");
const User_model_1 = require("../../DB/models/User.model");
const types_gql_1 = require("../GraphQl/types.gql");
exports.GraphQLGenderEnumType = new graphql_1.GraphQLEnumType({
    name: "GenderEnumType",
    values: {
        male: { value: User_model_1.GenderEnum.male },
        female: { value: User_model_1.GenderEnum.female }
    }
});
exports.GraphQLRoleEnumType = new graphql_1.GraphQLEnumType({
    name: "RoleEnumType",
    values: {
        user: { value: User_model_1.RoleEnum.user },
        admin: { value: User_model_1.RoleEnum.admin },
        superAdmin: { value: User_model_1.RoleEnum.superAdmin },
    }
});
exports.GraphQLProviderEnumType = new graphql_1.GraphQLEnumType({
    name: "ProviderEnumType",
    values: {
        google: { value: User_model_1.ProviderEnum.google },
        system: { value: User_model_1.ProviderEnum.system }
    }
});
exports.GraphQlOneUserType = new graphql_1.GraphQLObjectType({
    name: "OneUserResponse",
    fields: {
        _id: { type: graphql_1.GraphQLID },
        userName: {
            type: graphql_1.GraphQLString,
            resolve: (parent) => {
                return parent.gender === User_model_1.GenderEnum.male ? `Mr ${parent.userName}` : `Mrs ${parent.userName}`;
            }
        },
        firstName: { type: graphql_1.GraphQLString },
        lastName: { type: graphql_1.GraphQLString },
        email: { type: graphql_1.GraphQLString },
        confirmEmail: { type: graphql_1.GraphQLString },
        confirmEmailOtp: {
            type: new graphql_1.GraphQLObjectType({
                name: "confirmEmailOtp",
                fields: {
                    Value: { type: graphql_1.GraphQLString },
                    attempts: { type: graphql_1.GraphQLInt },
                    expiredAt: { type: graphql_1.GraphQLString },
                    banUntil: { type: graphql_1.GraphQLString },
                }
            })
        },
        password: { type: graphql_1.GraphQLString },
        resetPasswordOtp: { type: graphql_1.GraphQLString },
        changeCredentialsTime: { type: graphql_1.GraphQLString },
        gender: { type: exports.GraphQLGenderEnumType },
        role: { type: exports.GraphQLRoleEnumType },
        phone: { type: graphql_1.GraphQLString },
        address: { type: graphql_1.GraphQLString },
        age: { type: graphql_1.GraphQLInt },
        createdAt: { type: graphql_1.GraphQLString },
        updatedAt: { type: graphql_1.GraphQLString },
        provider: { type: exports.GraphQLProviderEnumType },
        profileImage: { type: graphql_1.GraphQLString },
        tempOldProfileImage: { type: graphql_1.GraphQLString },
        profileCoverImages: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        deletedAt: { type: graphql_1.GraphQLString },
        deletedBy: { type: graphql_1.GraphQLID },
        restoredAt: { type: graphql_1.GraphQLString },
        restoredBy: { type: graphql_1.GraphQLID },
        BlockList: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        stepVerificationOtp: { type: graphql_1.GraphQLString },
        enable2stepVerification: { type: graphql_1.GraphQLBoolean },
        friends: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
    }
});
exports.welcome = graphql_1.GraphQLString;
exports.checkBoolean = new graphql_1.GraphQLNonNull(graphql_1.GraphQLBoolean);
exports.getAllUsers = new graphql_1.GraphQLList(exports.GraphQlOneUserType);
exports.searchUser = (0, types_gql_1.GraphQlUniformResponse)({ name: "SearchKey", data: new graphql_1.GraphQLNonNull(exports.GraphQlOneUserType) });
exports.addFollower = new graphql_1.GraphQLList(exports.GraphQlOneUserType);
