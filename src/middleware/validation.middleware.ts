import type { NextFunction, Request, Response } from "express";
import type { ZodError, ZodType } from "zod";
import { BadRequestException } from "../utils/Response/error.response";
import { z } from "zod";
import { genderEnum } from "../DB/models/User.model";


type KeyReqType = keyof Request;
type SchemaType = Partial<Record<KeyReqType, ZodType>>

type ValidationErrorsType = Array<{
    key: KeyReqType,
    issues: Array<{
        message: string,
        path: string | number | symbol | undefined
    }>
}>;

export const validation = (schema: SchemaType) => {
    return (req: Request, res: Response, next: NextFunction): NextFunction => {
        console.log(schema);
        console.log(Object.keys(schema));
        
        const validationErrors: ValidationErrorsType = [];


        /**
         * // input
         * @param schema:SchemaType
         * 
         * // output
         * if no errors then return next() otherwise return throw BadRequestException
         */
        for (const key of Object.keys(schema) as KeyReqType[]) {
            if (!schema[key]) continue;

            const validationResults = schema[key].safeParse(req[key]);
            if (!validationResults.success) {
                const errors = validationResults.error as ZodError;

                validationErrors.push({
                    key,
                    issues: errors.issues.map((issue) => {
                        return { message: issue.message, path: issue.path[0] };
                    }),
                });
            }
            
        }
        
        if (validationErrors.length) {
            throw new BadRequestException("Validation Error", { validationErrors });
        }

        return next() as unknown as NextFunction;
    }
};

export const generalFields = {
    fullName: z.string().min(2).max(20),
    email: z.email(),
    password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*()_.]).{8,16}$/),
    confirmPassword: z.string(),
    gender: z.enum(Object.values(genderEnum)),
    phone: z.string().regex(/^(002|\+2)?01[0125]\d{8}$/)
};