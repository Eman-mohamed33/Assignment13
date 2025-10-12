import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";
import { GraphQLGenderEnumType } from "./user.types.gql";


export const welcome = {
    name: { type: new GraphQLNonNull(GraphQLString) }
}

export const getAllUsers = {
    gender: {
        type: GraphQLGenderEnumType
    }
};

export const searchUser = {
    email: {
        type: GraphQLString,
        description: "This email use to find unique Account"
    }
};

export const addFollower = {
    friendId: { type: GraphQLInt },
    myId: { type: GraphQLInt }
};