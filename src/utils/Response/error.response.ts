import { NextFunction, Request, Response } from "express";


interface IError extends Error {
    statusCode:number
};

export class ApplicationException extends Error {

    constructor(message: string, public statusCode: number,  cause?: unknown) {
        super(message, {cause});
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestException extends ApplicationException  {

    constructor(message: string,   cause?: unknown) {
        super(message, 400, cause);
    }
};

export class NotFoundException extends ApplicationException  {

    constructor(message: string,   cause?: unknown) {
        super(message, 404, cause);
    }
};

export const globalErrorHandling = (
    error: IError,
    req: Request,
    res: Response,
    next: NextFunction) => {
    
    res.status(error.statusCode || 500).json({
        err_message: error.message || "Something Went Wrong ‼",
        stack: process.env.MOOD === "development" ? error.stack : undefined,
        cause: error.cause
    });
};



// class parent {
//     constructor(public name?: string) {
        
//     }
//     getName(){return this.name}
// }

// class child extends parent{
//     constructor(public override name:string) {
//         super()
//     }
// }

// const ch = new child("eman");
// log(ch.getName());

