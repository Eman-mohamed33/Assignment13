import { PostResolver } from "./post.resolver.gql";
import * as graphQlArgs from "./post.args";
import * as graphQLTypes from "./post.types.gql";

class PostGqlSchema {
    private postResolver: PostResolver = new PostResolver();

    constructor() { };

    registerQuery = () => {
        return {
            allPosts: {
                type: graphQLTypes.allPosts,
                args: graphQlArgs.allPosts,
                resolve: this.postResolver.allPosts
            }
        }
    }

    registerMutation = () => {
        return {
            likePost: {
                type: graphQLTypes.GraphQlOnePostResponse,
                args: graphQlArgs.likeGraphQlPost,
                resolve: this.postResolver.likeGraphQlPost
            }
        }
    }
}

export default new PostGqlSchema();