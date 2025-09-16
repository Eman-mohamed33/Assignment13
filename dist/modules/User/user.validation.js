"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBasicInfo = exports.updateEmail = exports.updatePassword = exports.shareProfile = exports.hardDelete = exports.restoreAccount = exports.freezeAccount = exports.logout = void 0;
const zod_1 = require("zod");
const token_security_1 = require("../../utils/Security/token.security");
const mongoose_1 = require("mongoose");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const User_model_1 = require("../../DB/models/User.model");
exports.logout = {
    body: zod_1.z.strictObject({
        flag: zod_1.z.enum(token_security_1.LogoutEnum).default(token_security_1.LogoutEnum.only),
    })
};
exports.freezeAccount = {
    params: zod_1.z.object({
        userId: zod_1.z.string().optional()
    }).optional().refine((data) => {
        return data?.userId ? mongoose_1.Types.ObjectId.isValid(data.userId) : true;
    }, {
        error: "Invalid ObjectId Format",
        path: ["userId"]
    }),
};
exports.restoreAccount = {
    params: zod_1.z.object({
        userId: zod_1.z.string(),
    }).refine((data) => {
        return mongoose_1.Types.ObjectId.isValid(data.userId);
    }, {
        error: "Invalid ObjectId Format",
        path: ["userId"]
    }),
};
exports.hardDelete = exports.restoreAccount;
exports.shareProfile = exports.restoreAccount;
exports.updatePassword = {
    body: zod_1.z.strictObject({
        oldPassword: validation_middleware_1.generalFields.password,
        newPassword: validation_middleware_1.generalFields.password,
        confirmPassword: validation_middleware_1.generalFields.confirmPassword
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
};
exports.updateEmail = {
    body: zod_1.z.strictObject({
        oldEmail: validation_middleware_1.generalFields.email,
        newEmail: validation_middleware_1.generalFields.email,
        passwordOfOldEmail: validation_middleware_1.generalFields.password
    }),
};
exports.updateBasicInfo = {
    body: zod_1.z.object({
        userName: validation_middleware_1.generalFields.userName.optional(),
        gender: validation_middleware_1.generalFields.gender.optional(),
        phone: validation_middleware_1.generalFields.phone.optional(),
        age: validation_middleware_1.generalFields.age.optional(),
        role: zod_1.z.enum(User_model_1.RoleEnum).default(User_model_1.RoleEnum.user).optional()
    }),
};
