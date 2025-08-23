import { z } from "zod";
import { generalFields } from "../../middleware/validation.middleware";


export const login = {
    body: z.object({
        email: generalFields.email,
        password: generalFields.password,
    })
};


export const signup = {
    body: login.body.extend({
        fullName: generalFields.fullName,
        confirmPassword: generalFields.confirmPassword,
        gender: generalFields.gender,
        phone: generalFields.phone

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