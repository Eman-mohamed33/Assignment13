"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFollower = exports.searchUser = exports.getAllUsers = exports.welcome = void 0;
const graphql_1 = require("graphql");
const user_types_gql_1 = require("./user.types.gql");
exports.welcome = {
    name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) }
};
exports.getAllUsers = {
    gender: {
        type: user_types_gql_1.GraphQLGenderEnumType
    }
};
exports.searchUser = {
    email: {
        type: graphql_1.GraphQLString,
        description: "This email use to find unique Account"
    }
};
exports.addFollower = {
    friendId: { type: graphql_1.GraphQLInt },
    myId: { type: graphql_1.GraphQLInt }
};
