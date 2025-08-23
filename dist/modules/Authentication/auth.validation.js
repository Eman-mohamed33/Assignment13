"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = exports.login = void 0;
const zod_1 = require("zod");
const validation_middleware_1 = require("../../middleware/validation.middleware");
exports.login = {
    body: zod_1.z.object({
        email: validation_middleware_1.generalFields.email,
        password: validation_middleware_1.generalFields.password,
    })
};
exports.signup = {
    body: exports.login.body.extend({
        fullName: validation_middleware_1.generalFields.fullName,
        confirmPassword: validation_middleware_1.generalFields.confirmPassword,
        gender: validation_middleware_1.generalFields.gender,
        phone: validation_middleware_1.generalFields.phone
    }).superRefine((data, ctx) => {
        console.log({ data, ctx });
        if (data.confirmPassword !== data.password) {
            ctx.addIssue({
                code: "custom",
                path: ["confirmPassword"],
                message: "Password  mismatch confirmPassword"
            });
        }
    }),
};
