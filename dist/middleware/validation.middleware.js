"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalFields = exports.validation = void 0;
const error_response_1 = require("../utils/Response/error.response");
const zod_1 = require("zod");
const User_model_1 = require("../DB/models/User.model");
const mongoose_1 = require("mongoose");
const validation = (schema) => {
    return (req, res, next) => {
        console.log(schema);
        console.log(Object.keys(schema));
        const validationErrors = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            if (req.file) {
                req.body.attachment = req.file;
            }
            if (req.files) {
                req.body.attachments = req.files;
            }
            const validationResults = schema[key].safeParse(req[key]);
            if (!validationResults.success) {
                const errors = validationResults.error;
                validationErrors.push({
                    key,
                    issues: errors.issues.map((issue) => {
                        return { message: issue.message, path: issue.path };
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
    userName: zod_1.z.string().min(2).max(20),
    email: zod_1.z.email(),
    password: zod_1.z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*()_.]).{8,16}$/),
    confirmPassword: zod_1.z.string(),
    gender: zod_1.z.enum(Object.values(User_model_1.GenderEnum)),
    phone: zod_1.z.string().regex(/^(002|\+2)?01[0125]\d{8}$/),
    age: zod_1.z.number(),
    otp: zod_1.z.string().regex(/^\d{6}$/),
    file: function (mimetype) {
        return zod_1.z.strictObject({
            fieldname: zod_1.z.string(),
            originalname: zod_1.z.string(),
            encoding: zod_1.z.string(),
            mimetype: zod_1.z.enum(mimetype),
            buffer: zod_1.z.any().optional(),
            path: zod_1.z.string().optional(),
            size: zod_1.z.number(),
        }).refine((data) => { return !data.buffer || !data.path; }, { error: "neither path or buffer is available", path: ["file"] });
    },
    id: zod_1.z.string().refine((data) => {
        return mongoose_1.Types.ObjectId.isValid(data);
    }, { error: "In-valid objectId format" }),
};
