import { GraphQLEnumType, GraphQLID, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString } from "graphql";
import { AllowCommentsEnum, AvailabilityEnum } from "../../DB/models/Post.model";
import { GraphQlOneUserType } from "../User/user.types.gql";

export const GraphQLAvailabilityEnumType = new GraphQLEnumType({
    name: "AvailabilityEnumType",
    values: {
        closeFriends: { value: AvailabilityEnum.closeFriends },
        friends: { value: AvailabilityEnum.friends },
        friendsExcept: { value: AvailabilityEnum.friendsExcept },
        onlyMe: { value: AvailabilityEnum.onlyMe },
        pubic: { value: AvailabilityEnum.pubic },
        specificFriends: { value: AvailabilityEnum.specificFriends },       
    }
});

export const GraphQLAllowCommentsEnumType = new GraphQLEnumType({
    name: "AllowCommentsEnumType",
    values: {
        allow: { value: AllowCommentsEnum.allow },
        deny: { value: AllowCommentsEnum.deny },
    }
});

export const GraphQlOnePostResponse = new GraphQLObjectType({
    name: "OnePostResponse",
    fields: {
        content: { type: GraphQLString },
        attachments: { type: new GraphQLList(GraphQLString) },
        assetsFolderId: { type: GraphQLString },
        
        availability: { type: GraphQLAvailabilityEnumType },
        allowComments: { type: GraphQLAllowCommentsEnumType },
        
        tags: { type: new GraphQLList(GraphQLID) },
        likes: { type: new GraphQLList(GraphQLID) },
        
        createdBy: { type: GraphQlOneUserType },
        Only: { type: new GraphQLList(GraphQLID) },
        Except: { type: new GraphQLList(GraphQLID) },
        
        deletedBy: { type: GraphQLID },
        deletedAt: { type: GraphQLString },
        
        restoredBy: { type: GraphQLID },
        restoredAt: { type: GraphQLString },
        
        createdAt: { type: GraphQLString },
        updatedAt: { type: GraphQLString },
        
    }
})

export const allPosts = new GraphQLObjectType({
    name: "allPosts",
    fields: {
        docsCount: { type: GraphQLInt },
        pages: { type: GraphQLInt },
        currentPage: { type: GraphQLInt },
        limit: { type: GraphQLInt },
        result: { type: new GraphQLList(GraphQlOnePostResponse) }
    }
});