import { z } from "zod";
import { generalFields } from "../../middleware/validation.middleware";


export const login = {
    body: z.object({
        email: generalFields.email,
        password: generalFields.password,
        enable2stepVerification: z.boolean().optional(),
    })
};


export const signup = {
    body: login.body.extend({
        userName: generalFields.userName,
        confirmPassword: generalFields.confirmPassword,
        gender: generalFields.gender,
        phone: generalFields.phone,
        age:generalFields.age,

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


export const confirmEmail = {
    body: z.strictObject({
        email: generalFields.email,
        otp: generalFields.otp
    })
};

export const gmailValidation = {
    body: z.strictObject({
        idToken: z.string()
    })
};

export const forgotPasswordCode = {
    body: z.strictObject({
        email:generalFields.email
    })
};

export const verifyForgotPasswordCode = {
    body: forgotPasswordCode.body.extend({
       otp:generalFields.otp
    })
};

export const resetYourNewPassword = {
    body: verifyForgotPasswordCode.body.extend({
        password: generalFields.password,
        confirmPassword:generalFields.confirmPassword
    }).refine(function (data) {
        return data.password === data.confirmPassword;
    }, { message: "Password mismatch confirmPassword", path: ["confirmEmail"] })
};

