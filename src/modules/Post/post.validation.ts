import { z } from "zod";
import { AllowCommentsEnum, AvailabilityEnum, LikeActionEnum } from "../../DB/models/Post.model";
import { generalFields } from "../../middleware/validation.middleware";
import { fileValidation } from "../../utils/Multer/cloud.multer";

export const createPost = {
    body: z.strictObject({
        content: z.string().min(2).max(500000).optional(),
        attachments:z.array(generalFields.file(fileValidation.image)).max(4).optional(),
        
        availability: z.enum(AvailabilityEnum).default(AvailabilityEnum.pubic),
        allowComments: z.enum(AllowCommentsEnum).default(AllowCommentsEnum.allow),
        
        tags: z.array(generalFields.id).max(20).optional(),
          
    }).superRefine((data,ctx) => {
        if (!data.attachments?.length&&!data.content) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message:"Sorry we can't create post without content and attachments"
            })
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

export const likePost = {
    params: z.strictObject({
        postId: generalFields.id,
    }),
    query: z.strictObject({
        action: z.enum(LikeActionEnum).default(LikeActionEnum.like),
    }),
}