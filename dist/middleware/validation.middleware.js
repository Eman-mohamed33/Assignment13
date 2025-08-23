"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalFields = exports.validation = void 0;
const error_response_1 = require("../utils/Response/error.response");
const zod_1 = require("zod");
const User_model_1 = require("../DB/models/User.model");
const validation = (schema) => {
    return (req, res, next) => {
        console.log(schema);
        console.log(Object.keys(schema));
        const validationErrors = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            const validationResults = schema[key].safeParse(req[key]);
            if (!validationResults.success) {
                const errors = validationResults.error;
                validationErrors.push({
                    key,
                    issues: errors.issues.map((issue) => {
                        return { message: issue.message, path: issue.path[0] };
                    }),
                });
            }
        }
        if (validationErrors.length) {
            throw new error_response_1.BadRequestException("Validation Error", { validationErrors });
        }
        return next();
    };
};
exports.validation = validation;
exports.generalFields = {
    fullName: zod_1.z.string().min(2).max(20),
    email: zod_1.z.email(),
    password: zod_1.z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*()_.]).{8,16}$/),
    confirmPassword: zod_1.z.string(),
    gender: zod_1.z.enum(Object.values(User_model_1.genderEnum)),
    phone: zod_1.z.string().regex(/^(002|\+2)?01[0125]\d{8}$/)
};
