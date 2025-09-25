import { z } from "zod";
import { LogoutEnum } from "../../utils/Security/token.security";
import { Types } from "mongoose";
import { generalFields } from "../../middleware/validation.middleware";
import { BlockActionEnum, RoleEnum } from "../../DB/models/User.model";

export const logout = {
    body: z.strictObject({
        flag: z.enum(LogoutEnum).default(LogoutEnum.only),
    })
    
}

export const freezeAccount = {
    params: z.object({
        userId: z.string().optional()
    }).optional().refine((data) => {
        return data?.userId ? Types.ObjectId.isValid(data.userId) : true;
    }, {
        error: "Invalid ObjectId Format",
        path: ["userId"]
    }),
    
}

export const restoreAccount = {
    params: z.object({
        userId: generalFields.id,
    }).refine((data) => {
        return Types.ObjectId.isValid(data.userId);
    }, {
        error: "Invalid ObjectId Format",
        path: ["userId"]
    }),
    
}

export const hardDelete = restoreAccount;

export const shareProfile = restoreAccount;

export const updatePassword = {
    body:z.strictObject({
        oldPassword: generalFields.password,
        newPassword: generalFields.password,
        confirmPassword: generalFields.confirmPassword
    }).superRefine((data, ctx) => {
        console.log({ data, ctx });
        if (data.confirmPassword !== data.newPassword) {
            ctx.addIssue({
                code: "custom",
                path: ["confirmPassword"],
                message: "Password mismatch confirmPassword"
            });
        }
    }),
}

export const updateEmail = {
    body: z.strictObject({
        oldEmail: generalFields.email,
        newEmail: generalFields.email,
        passwordOfOldEmail: generalFields.password
    }),
}

export const updateBasicInfo = {
    body: z.object({
        userName: generalFields.userName.optional(),
        gender: generalFields.gender.optional(),
        phone: generalFields.phone.optional(),
        age: generalFields.age.optional(),
        role: z.enum(RoleEnum).default(RoleEnum.user).optional()
    
    }),
}

export const changeRole = {
    params: z.strictObject({
        userId: generalFields.id
    }),
    body: z.strictObject({
        role: z.enum(RoleEnum),
    })
}

export const sentFriendRequest = {
    params: changeRole.params
};

export const acceptFriendRequest = {
    params: z.strictObject({
        requestId: generalFields.id
    }),
   
}

export const deleteFriendRequest = {
    params: acceptFriendRequest.params
}

export const unfriend = {
    params: changeRole.params
}

export const blockUser = {
    params: unfriend.params,
    query: z.strictObject({
        action: z.enum(BlockActionEnum).default(BlockActionEnum.block),
    }),
}