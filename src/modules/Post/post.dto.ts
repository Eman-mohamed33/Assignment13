import { z } from "zod";
import { likePost } from "./post.validation";

export type IPostLikeParamsDto = z.infer<typeof likePost.params>;
export type IActionPostQueryDto = z.infer<typeof likePost.query>;


