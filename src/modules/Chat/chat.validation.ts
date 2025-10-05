import { z } from "zod";
import { generalFields } from "../../middleware/validation.middleware";
import { fileValidation } from "../../utils/Multer/cloud.multer";

export const getChat = {
    params: z.strictObject({
        userId: generalFields.id,
    }),

    query: z.strictObject({
        page: z.coerce.number().int().min(1).optional(),
        size: z.coerce.number().int().min(1).optional()
    }),

}

export const getChattingGroup = {
    params: z.strictObject({
        groupId: generalFields.id,
    }),

    query: getChat.query
}

export const createChattingGroup = {
    body: z.strictObject({
        participants: z.array(generalFields.id).min(1),
        image: generalFields.file(fileValidation.image).optional(),
        group: z.string().min(1).max(5000),

    }).superRefine((data, ctx) => {
        if (data.participants?.length && data.participants?.length !== [...new Set(data.participants)].length) {
            ctx.addIssue({
                code: "custom",
                path: ["participants"],
                message: "Duplicated participants",
            });
        }
    })
}

export const messages = {
    sendMessage: z.strictObject({
          content: z.string().min(1).max(500000),
        sendTo: generalFields.id
    }),

    sendGroupMessage: z.object({
        content: z.string().min(1).max(500000),
        groupId: generalFields.id
    })



  
}