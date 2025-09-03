"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailEvent = void 0;
const node_events_1 = __importDefault(require("node:events"));
const send_email_1 = require("../Emails/send.email");
const verify_emailTemplate_1 = require("../Emails/templates/verify.emailTemplate");
const node_console_1 = require("node:console");
exports.emailEvent = new node_events_1.default();
;
exports.emailEvent.on("confirmEmail", async (data) => {
    try {
        data.subject = "Please Confirm Email...",
            data.html = (0, verify_emailTemplate_1.verifyEmailTemplate)({ otp: data.otp, userEmail: data.to, title: "Email Confirmation" });
        await (0, send_email_1.sendEmail)(data);
    }
    catch (error) {
        (0, node_console_1.log)(`Fail To Send Email To ${data.to}`, error);
    }
});
exports.emailEvent.on("SendForgotPasswordCode", async (data) => {
    try {
        data.subject = "Forgot Password Code",
            data.html = (0, verify_emailTemplate_1.verifyEmailTemplate)({ otp: data.otp, userEmail: data.to, title: "Forgotten password code" });
        await (0, send_email_1.sendEmail)(data);
    }
    catch (error) {
        (0, node_console_1.log)(`Fail To Send Email To ${data.to}`, error);
    }
});
