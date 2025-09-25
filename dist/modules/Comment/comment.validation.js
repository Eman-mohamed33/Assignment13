"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateComment = exports.deleteComment = exports.freezeComment = exports.getCommentWithReply = exports.getCommentById = exports.replayOnComment = exports.createComment = void 0;
const zod_1 = require("zod");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const cloud_multer_1 = require("../../utils/Multer/cloud.multer");
exports.createComment = {
    params: zod_1.z.strictObject({
        postId: validation_middleware_1.generalFields.id,
    }),
    body: zod_1.z.strictObject({
        content: zod_1.z.string().min(2).max(500000).optional(),
        attachments: zod_1.z.array(validation_middleware_1.generalFields.file(cloud_multer_1.fileValidation.image)).max(4).optional(),
        tags: zod_1.z.array(validation_middleware_1.generalFields.id).max(20).optional(),
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
};
exports.replayOnComment = {
    params: exports.createComment.params.extend({
        commentId: validation_middleware_1.generalFields.id,
    }),
    body: exports.createComment.body,
};
exports.getCommentById = {
    params: exports.replayOnComment.params,
};
exports.getCommentWithReply = {
    params: exports.getCommentById.params
};
exports.freezeComment = {
    params: zod_1.z.strictObject({
        postId: validation_middleware_1.generalFields.id,
        commentId: validation_middleware_1.generalFields.id
    }),
};
exports.deleteComment = {
    params: zod_1.z.strictObject({
        commentId: validation_middleware_1.generalFields.id
    }),
};
exports.updateComment = {
    params: exports.freezeComment.params
};
