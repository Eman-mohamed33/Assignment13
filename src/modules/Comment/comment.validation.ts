import { z } from "zod";
import { generalFields } from "../../middleware/validation.middleware";
import { fileValidation } from "../../utils/Multer/cloud.multer";

export const createComment = {
    params: z.strictObject({
        postId: generalFields.id,
    }),

    body: z.strictObject({
        content: z.string().min(2).max(500000).optional(),
        attachments: z.array(generalFields.file(fileValidation.image)).max(4).optional(),
        
        tags: z.array(generalFields.id).max(20).optional(),
          

    }).superRefine((data, ctx) => {
        
        if (!data.attachments?.length && !data.content) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "Sorry we can't create post without content and attachments"
            });
        }

        if (data.tags?.length && data.tags?.length !== [...new Set(data.tags)].length) {
            ctx.addIssue({
                code: "custom",
                path: ["tags"],
                message: "Duplicated tagged users",
            });
        }
    })
}

export const replayOnComment = {
    params: createComment.params.extend({
        commentId: generalFields.id,
    }),

    body: createComment.body,

}

export const getCommentById = {
    params: replayOnComment.params,
};

export const getCommentWithReply = {
    params: getCommentById.params
}

export const freezeComment = {
    params: z.strictObject({
        postId: generalFields.id,
        commentId: generalFields.id
    }),
}

export const deleteComment = {
    params: z.strictObject({
        commentId: generalFields.id
    }),
}

export const updateComment = {
    params: freezeComment.params
}

