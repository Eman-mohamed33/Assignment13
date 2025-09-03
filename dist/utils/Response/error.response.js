"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandling = exports.conflictException = exports.forbiddenException = exports.unAuthorizedException = exports.NotFoundException = exports.BadRequestException = exports.ApplicationException = void 0;
;
class ApplicationException extends Error {
    statusCode;
    constructor(message, statusCode, cause) {
        super(message, { cause });
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApplicationException = ApplicationException;
class BadRequestException extends ApplicationException {
    constructor(message, cause) {
        super(message, 400, cause);
    }
}
exports.BadRequestException = BadRequestException;
;
class NotFoundException extends ApplicationException {
    constructor(message, cause) {
        super(message, 404, cause);
    }
}
exports.NotFoundException = NotFoundException;
;
class unAuthorizedException extends ApplicationException {
    constructor(message, cause) {
        super(message, 401, cause);
    }
}
exports.unAuthorizedException = unAuthorizedException;
;
class forbiddenException extends ApplicationException {
    constructor(message, cause) {
        super(message, 403, cause);
    }
}
exports.forbiddenException = forbiddenException;
;
class conflictException extends ApplicationException {
    constructor(message, cause) {
        super(message, 409, cause);
    }
}
exports.conflictException = conflictException;
;
const globalErrorHandling = (error, req, res, next) => {
    res.status(error.statusCode || 500).json({
        err_message: error.message || "Something Went Wrong ‼",
        stack: process.env.MOOD === "development" ? error.stack : undefined,
        cause: error.cause
    });
};
exports.globalErrorHandling = globalErrorHandling;
