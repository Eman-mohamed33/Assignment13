import z from "zod";
import { createComment, replayOnComment } from "./comment.validation";

export type ICreateCommentParamsDto = z.infer<typeof createComment.params>;
export type IReplyOnCommentParamsDto = z.infer<typeof replayOnComment.params>;

