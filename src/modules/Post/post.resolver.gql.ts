import { HPostDocument, LikeActionEnum } from "../../DB/models/Post.model";
import { IAuthGraphQl } from "../GraphQl/schema.interfaces";
import { PostService } from "./post.service"


export class PostResolver {
    private postService: PostService = new PostService();
    constructor() { }
    allPosts = async (
        parent: unknown,
        args: { page: number; size: number },
        context: IAuthGraphQl
    ): Promise<{
        docsCount?: number;
        pages?: number;
        currentPage?: number | undefined;
        limit?: number;
        result: HPostDocument[];
    }> => {
        return await this.postService.allPosts(args, context.user);
    };
    
    likeGraphQlPost = async (parent: unknown, args: { postId: string, action: LikeActionEnum }, context: IAuthGraphQl): Promise<HPostDocument> => {
        return await this.postService.likeGraphQlPost(args, context.user);
    };
}