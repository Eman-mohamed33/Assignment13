"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_model_1 = require("../../DB/models/User.model");
const email_event_1 = require("../../utils/Events/email.event");
const Hash_security_1 = require("../../utils/Security/Hash.security");
const nanoid_1 = require("nanoid");
const token_security_1 = require("../../utils/Security/token.security");
const error_response_1 = require("../../utils/Response/error.response");
const Repository_1 = require("../../DB/Repository");
const google_auth_library_1 = require("google-auth-library");
const Otp_1 = require("../../utils/Security/Otp");
const success_response_1 = require("../../utils/Response/success.response");
class AuthenticationService {
    userModel = new Repository_1.UserRepository(User_model_1.UserModel);
    async verifyGmailAccount(idToken) {
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.WEB_CLIENT_IDs?.split(",") || [],
        });
        const payload = ticket.getPayload();
        if (!payload?.email_verified) {
            throw new error_response_1.BadRequestException("Fail to verify this google Account");
        }
        return payload;
    }
    constructor() { }
    signup = async (req, res) => {
        const { userName, email, password, phone, gender, age } = req.body;
        const UserExist = await this.userModel.findOne({ filter: { email } });
        if (UserExist) {
            throw new error_response_1.conflictException("User is Already Exist");
        }
        const otp = (0, nanoid_1.customAlphabet)("0123456789", 6)();
        const user = await this.userModel.createUser({
            data: [{
                    userName,
                    email,
                    password,
                    phone,
                    gender,
                    age,
                    confirmEmailOtp: {
                        value: otp,
                        attempts: 0,
                        expiredAt: new Date(Date.now() + 2 * 60 * 1000)
                    }
                }]
        });
        if (!user) {
            throw new error_response_1.BadRequestException("Fail to create new user");
        }
        return (0, success_response_1.successResponse)({ res, statusCode: 201 });
    };
    signupWithGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email, picture, family_name, given_name } = await this.verifyGmailAccount(idToken);
        const checkUserExist = await this.userModel.findOne({
            filter: { email }
        });
        if (checkUserExist) {
            if (checkUserExist.provider === User_model_1.ProviderEnum.google) {
                await this.loginWithGmail(req, res);
            }
            throw new error_response_1.conflictException("User already Exist");
        }
        const [user] = await this.userModel.create({
            data: [{
                    firstName: given_name,
                    lastName: family_name,
                    email: email,
                    profileImage: picture,
                    confirmEmail: new Date(),
                    provider: User_model_1.ProviderEnum.google,
                }],
        }) || [];
        if (!user) {
            throw new error_response_1.BadRequestException("Fail to signup with gmail please try again...");
        }
        return (0, success_response_1.successResponse)({ res, statusCode: 201 });
    };
    login = async (req, res) => {
        const { email, password, enable2stepVerification } = req.body;
        const UserExist = await this.userModel.findOne({
            filter: { email }
        });
        if (!UserExist) {
            throw new error_response_1.NotFoundException("Invalid Login Data");
        }
        if (!UserExist?.confirmEmail) {
            throw new error_response_1.BadRequestException("Please Verify Your Account First");
        }
        const match = await (0, Hash_security_1.compareHash)(password, UserExist?.password);
        if (!match) {
            throw new error_response_1.NotFoundException("Invalid Login Data");
        }
        if (enable2stepVerification) {
            await this.twoStepVerification(req, res, email);
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(UserExist);
        return (0, success_response_1.successResponse)({ res, statusCode: 201, data: { credentials } });
    };
    loginWithGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({
            filter: { email, provider: User_model_1.ProviderEnum.google }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("User Not Exist");
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(user);
        return (0, success_response_1.successResponse)({ res, data: { credentials }, statusCode: 201 });
    };
    confirmEmail = async (req, res) => {
        const { email, otp } = req.body;
        const UserExist = await this.userModel.findOne({
            filter: {
                email,
                confirmEmail: { $exists: false },
                confirmEmailOtp: { $exists: true }
            }
        });
        if (!UserExist) {
            throw new error_response_1.NotFoundException("In-valid Account Or Already Verified");
        }
        const banUntil = UserExist?.confirmEmailOtp?.banUntil?.getTime() ?? 0;
        console.log(banUntil);
        const waitTime = (banUntil - Date.now()) / 1000;
        if ((banUntil) && (banUntil > Date.now())) {
            throw new error_response_1.BadRequestException(`You're Temporarily Banned ,Try Again After ${waitTime} seconds`);
        }
        if ((Date.now() - (UserExist?.confirmEmailOtp?.expiredAt?.getTime() ?? 0)) > 2 * 60 * 1000) {
            throw new error_response_1.BadRequestException("Code Expired ,You Need To Request A New one");
        }
        if (UserExist?.confirmEmailOtp?.attempts === 5) {
            await this.userModel.updateOne({
                filter: { email },
                update: {
                    'confirmEmailOtp.banUntil': Date.now() + 5 * 60 * 1000,
                }
            });
            throw new error_response_1.BadRequestException("Too Many Failed Attempts ,You're Temporarily Banned For 5 Minutes");
        }
        if (!await (0, Hash_security_1.compareHash)(otp, UserExist?.confirmEmailOtp?.value)) {
            await this.userModel.updateOne({
                filter: { email },
                update: {
                    $inc: { 'confirmEmailOtp.attempts': 1 }
                }
            });
            throw new error_response_1.BadRequestException("In-Valid Otp");
        }
        const user = await this.userModel.updateOne({
            filter: { email },
            update: {
                confirmEmail: Date.now(),
                $unset: { confirmEmailOtp: true },
            }
        });
        if (!user) {
            throw new error_response_1.BadRequestException("Fail to confirm user Email");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    resendConfirmationEmail = async (req, res) => {
        const { email } = req.body;
        const UserExist = await this.userModel.findOne({
            filter: {
                email,
                confirmEmail: { $exists: false },
                confirmEmailOtp: { $exists: true }
            }
        });
        if (!UserExist) {
            throw new error_response_1.NotFoundException("In-valid Account Or Already Verified");
        }
        const otp = (0, nanoid_1.customAlphabet)("0123456789", 6)();
        const confirmEmailOtp = await (0, Hash_security_1.generateHash)(otp);
        const banUntil = UserExist?.confirmEmailOtp?.banUntil?.getTime() ?? 0;
        const waitTime = (banUntil - Date.now()) / 1000;
        if ((banUntil) && (banUntil > Date.now())) {
            throw new error_response_1.BadRequestException(`You're Temporarily Banned ,Try Again After ${waitTime} seconds`);
        }
        email_event_1.emailEvent.emit("confirmEmail", { to: email, otp: otp, userEmail: email });
        const user = await this.userModel.updateOne({
            filter: { email }, update: {
                $set: {
                    'confirmEmailOtp.value': confirmEmailOtp,
                    'confirmEmailOtp.attempt': 0,
                    'confirmEmailOtp.expiredAt': Date.now() + 2 * 60 * 1000
                },
                $unset: { 'confirmEmailOtp.banUntil': 1 },
                $inc: { __v: 1 }
            }
        });
        if (!user) {
            throw new error_response_1.BadRequestException("Fail to resend confirm Email");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    findYourAccount_sendForgotPasswordCode = async (req, res) => {
        const { email } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: User_model_1.ProviderEnum.system,
                confirmEmail: { $exists: true },
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("In-valid Account due to one of the following reasons [not register ,not confirmed ,invalid provider]");
        }
        const otp = (0, Otp_1.generateOtp)();
        const updatedUser = await this.userModel.updateOne({
            filter: { email },
            update: {
                resetPasswordOtp: await (0, Hash_security_1.generateHash)(String(otp))
            }
        });
        if (!updatedUser.matchedCount) {
            throw new error_response_1.BadRequestException("Fail to send the reset code please try again later");
        }
        email_event_1.emailEvent.emit("SendForgotPasswordCode", { to: email, otp });
        return (0, success_response_1.successResponse)({ res, message: `We Sent Your Code To ${email} , Please Check Your Email ✅` });
    };
    verifyForgotPasswordCode = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: User_model_1.ProviderEnum.system,
                resetPasswordOtp: { $exists: true },
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("In-valid Account due to one of the following reasons [not register ,not confirmed ,invalid provider]");
        }
        if (!await (0, Hash_security_1.compareHash)(otp, user.resetPasswordOtp)) {
            throw new error_response_1.NotFoundException("Invalid Otp");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    resetYourPassword = async (req, res) => {
        const { email, otp, password } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: User_model_1.ProviderEnum.system,
                resetPasswordOtp: { $exists: true },
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("In-valid Account due to one of the following reasons [not register ,not confirmed ,invalid provider]");
        }
        if (!await (0, Hash_security_1.compareHash)(otp, user.resetPasswordOtp)) {
            throw new error_response_1.NotFoundException("Invalid Otp");
        }
        const updatedUser = await this.userModel.updateOne({
            filter: { email },
            update: {
                password: await (0, Hash_security_1.generateHash)(password),
                $unset: { resetPasswordOtp: 1 },
                changeCredentialsTime: new Date()
            }
        });
        if (!updatedUser.matchedCount) {
            throw new error_response_1.BadRequestException("Fail to reset password please try again later");
        }
        return (0, success_response_1.successResponse)({ res, message: `Your Password is Reset` });
    };
    twoStepVerification = async (req, res, email) => {
        const otp = (0, nanoid_1.customAlphabet)("0123456", 6)();
        const user = await this.userModel.updateOne({
            filter: {
                email,
                confirmEmail: { $exists: true },
                deletedAt: { $exists: false }
            },
            update: {
                stepVerificationOtp: await (0, Hash_security_1.generateHash)(otp),
            }
        });
        if (!user.matchedCount) {
            throw new error_response_1.BadRequestException("Fail to Apply 2-step-verification");
        }
        email_event_1.emailEvent.emit("stepVerification", { to: email, otp });
        return (0, success_response_1.successResponse)({ res, message: "Otp sent!" });
    };
    loginConfirmation = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                stepVerificationOtp: { $exists: true }
            }
        });
        if (!await (0, Hash_security_1.compareHash)(otp, user?.stepVerificationOtp)) {
            throw new error_response_1.BadRequestException("In-valid Otp ,please try again later ");
        }
        await this.userModel.updateOne({
            filter: {
                email
            },
            update: {
                $unset: {
                    stepVerificationOtp: 1
                }
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Invalid Login Data");
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(user);
        return (0, success_response_1.successResponse)({ res, statusCode: 201, data: { credentials } });
    };
}
exports.default = new AuthenticationService();
