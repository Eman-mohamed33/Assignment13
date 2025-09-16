"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetYourNewPassword = exports.verifyForgotPasswordCode = exports.forgotPasswordCode = exports.gmailValidation = exports.confirmEmail = exports.signup = exports.login = void 0;
const zod_1 = require("zod");
const validation_middleware_1 = require("../../middleware/validation.middleware");
exports.login = {
    body: zod_1.z.object({
        email: validation_middleware_1.generalFields.email,
        password: validation_middleware_1.generalFields.password,
        enable2stepVerification: zod_1.z.boolean().optional(),
    })
};
exports.signup = {
    body: exports.login.body.extend({
        userName: validation_middleware_1.generalFields.userName,
        confirmPassword: validation_middleware_1.generalFields.confirmPassword,
        gender: validation_middleware_1.generalFields.gender,
        phone: validation_middleware_1.generalFields.phone,
        age: validation_middleware_1.generalFields.age,
    }).superRefine((data, ctx) => {
        console.log({ data, ctx });
        if (data.confirmPassword !== data.password) {
            ctx.addIssue({
                code: "custom",
                path: ["confirmPassword"],
                message: "Password mismatch confirmPassword"
            });
        }
    }),
};
exports.confirmEmail = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFields.email,
        otp: validation_middleware_1.generalFields.otp
    })
};
exports.gmailValidation = {
    body: zod_1.z.strictObject({
        idToken: zod_1.z.string()
    })
};
exports.forgotPasswordCode = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFields.email
    })
};
exports.verifyForgotPasswordCode = {
    body: exports.forgotPasswordCode.body.extend({
        otp: validation_middleware_1.generalFields.otp
    })
};
exports.resetYourNewPassword = {
    body: exports.verifyForgotPasswordCode.body.extend({
        password: validation_middleware_1.generalFields.password,
        confirmPassword: validation_middleware_1.generalFields.confirmPassword
    }).refine(function (data) {
        return data.password === data.confirmPassword;
    }, { message: "Password mismatch confirmPassword", path: ["confirmEmail"] })
};
