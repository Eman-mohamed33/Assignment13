"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likePost = exports.createPost = void 0;
const zod_1 = require("zod");
const Post_model_1 = require("../../DB/models/Post.model");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const cloud_multer_1 = require("../../utils/Multer/cloud.multer");
exports.createPost = {
    body: zod_1.z.strictObject({
        content: zod_1.z.string().min(2).max(500000).optional(),
        attachments: zod_1.z.array(validation_middleware_1.generalFields.file(cloud_multer_1.fileValidation.image)).max(4).optional(),
        availability: zod_1.z.enum(Post_model_1.AvailabilityEnum).default(Post_model_1.AvailabilityEnum.pubic),
        allowComments: zod_1.z.enum(Post_model_1.AllowCommentsEnum).default(Post_model_1.AllowCommentsEnum.allow),
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
exports.likePost = {
    params: zod_1.z.strictObject({
        postId: validation_middleware_1.generalFields.id,
    }),
    query: zod_1.z.strictObject({
        action: zod_1.z.enum(Post_model_1.LikeActionEnum).default(Post_model_1.LikeActionEnum.like),
    }),
};
