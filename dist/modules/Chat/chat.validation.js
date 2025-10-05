"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messages = exports.createChattingGroup = exports.getChattingGroup = exports.getChat = void 0;
const zod_1 = require("zod");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const cloud_multer_1 = require("../../utils/Multer/cloud.multer");
exports.getChat = {
    params: zod_1.z.strictObject({
        userId: validation_middleware_1.generalFields.id,
    }),
    query: zod_1.z.strictObject({
        page: zod_1.z.coerce.number().int().min(1).optional(),
        size: zod_1.z.coerce.number().int().min(1).optional()
    }),
};
exports.getChattingGroup = {
    params: zod_1.z.strictObject({
        groupId: validation_middleware_1.generalFields.id,
    }),
    query: exports.getChat.query
};
exports.createChattingGroup = {
    body: zod_1.z.strictObject({
        participants: zod_1.z.array(validation_middleware_1.generalFields.id).min(1),
        image: validation_middleware_1.generalFields.file(cloud_multer_1.fileValidation.image).optional(),
        group: zod_1.z.string().min(1).max(5000),
    }).superRefine((data, ctx) => {
        if (data.participants?.length && data.participants?.length !== [...new Set(data.participants)].length) {
            ctx.addIssue({
                code: "custom",
                path: ["participants"],
                message: "Duplicated participants",
            });
        }
    })
};
exports.messages = {
    sendMessage: zod_1.z.strictObject({
        content: zod_1.z.string().min(1).max(500000),
        sendTo: validation_middleware_1.generalFields.id
    }),
    sendGroupMessage: zod_1.z.object({
        content: zod_1.z.string().min(1).max(500000),
        groupId: validation_middleware_1.generalFields.id
    })
};
