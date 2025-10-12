"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allPosts = exports.GraphQlOnePostResponse = exports.GraphQLAllowCommentsEnumType = exports.GraphQLAvailabilityEnumType = void 0;
const graphql_1 = require("graphql");
const Post_model_1 = require("../../DB/models/Post.model");
exports.GraphQLAvailabilityEnumType = new graphql_1.GraphQLEnumType({
    name: "AvailabilityEnumType",
    values: {
        closeFriends: { value: Post_model_1.AvailabilityEnum.closeFriends },
        friends: { value: Post_model_1.AvailabilityEnum.friends },
        friendsExcept: { value: Post_model_1.AvailabilityEnum.friendsExcept },
        onlyMe: { value: Post_model_1.AvailabilityEnum.onlyMe },
        pubic: { value: Post_model_1.AvailabilityEnum.pubic },
        specificFriends: { value: Post_model_1.AvailabilityEnum.specificFriends },
    }
});
exports.GraphQLAllowCommentsEnumType = new graphql_1.GraphQLEnumType({
    name: "AllowCommentsEnumType",
    values: {
        allow: { value: Post_model_1.AllowCommentsEnum.allow },
        deny: { value: Post_model_1.AllowCommentsEnum.deny },
    }
});
exports.GraphQlOnePostResponse = new graphql_1.GraphQLObjectType({
    name: "OnePostResponse",
    fields: {
        content: { type: graphql_1.GraphQLString },
        attachments: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        assetsFolderId: { type: graphql_1.GraphQLString },
        availability: { type: exports.GraphQLAvailabilityEnumType },
        allowComments: { type: exports.GraphQLAllowCommentsEnumType },
        tags: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
        likes: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
        createdBy: { type: graphql_1.GraphQLID },
        Only: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
        Except: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) },
        deletedBy: { type: graphql_1.GraphQLID },
        deletedAt: { type: graphql_1.GraphQLString },
        restoredBy: { type: graphql_1.GraphQLID },
        restoredAt: { type: graphql_1.GraphQLString },
        createdAt: { type: graphql_1.GraphQLString },
        updatedAt: { type: graphql_1.GraphQLString },
    }
});
exports.allPosts = new graphql_1.GraphQLList(exports.GraphQlOnePostResponse);
