import { GraphQLObjectType, GraphQLSchema } from "graphql";
import userSchemaGql from "../User/user.schema.gql";
import postSchemaGql from "../Post/post.schema.gql";

const query = new GraphQLObjectType({
    name: "RootSchemaQuery",
    description: "optional",
    fields: {
        ...userSchemaGql.registerQuery(),
        ...postSchemaGql.registerQuery(),
    }
});
const mutation = new GraphQLObjectType({
    name: "RootSchemaMutation",
    fields: {
        ...userSchemaGql.registerMutation(),
        ...postSchemaGql.registerMutation()
    }
});

export const schema = new GraphQLSchema({
    query,
    mutation

});

    //  const adminSchema = new GraphQLSchema({
    //     query: new GraphQLObjectType({
    //         name: "RootSchemaQuery",
    //         description: "optional",
    //         fields: {
    //             welcome: {
    //                 type: GraphQLString,
    //                 description: "",
    //                 resolve: (parent: unknown, args: any) => {
    //                     return "Done";
    //                 }
    //             },
    //         }
    //     })

    // });
