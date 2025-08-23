"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_model_1 = require("../../DB/models/User.model");
const emai_event_1 = require("../../utils/Events/emai.event");
const Hash_security_1 = require("../../utils/Security/Hash.security");
const Encryption_security_1 = require("../../utils/Security/Encryption.security");
const nanoid_1 = require("nanoid");
const token_security_1 = require("../../utils/Security/token.security");
const error_response_1 = require("../../utils/Response/error.response");
class AuthenticationService {
    constructor() { }
    signup = async (req, res) => {
        try {
            const { fullName, email, password, phone, gender } = req.body;
            const UserExist = await User_model_1.UserModel.findOne({ email });
            const otp = (0, nanoid_1.customAlphabet)("0123456789", 6)();
            if (UserExist) {
                res.status(409).json({ message: "Email Already Exist" });
            }
            const hashPassword = await (0, Hash_security_1.generateHash)({ plainText: password });
            const encPhone = await (0, Encryption_security_1.generateEncryption)({ plainText: phone });
            const confirmEmailOtp = await (0, Hash_security_1.generateHash)({ plainText: otp });
            const user = await User_model_1.UserModel.create({
                fullName,
                email,
                password: hashPassword,
                phone: encPhone,
                gender,
                confirmEmailOtp: {
                    value: confirmEmailOtp,
                    attempts: 0,
                    expiredAt: Date.now() + 2 * 60 * 1000
                }
            });
            emai_event_1.emailEvent.emit("confirmEmail", { to: email, otp: otp, userEmail: email });
            return res.status(201).json({ message: "Done", data: { user } });
        }
        catch (error) {
            throw new error_response_1.ApplicationException("fail", 500, { cause: error });
        }
    };
    login = async (req, res) => {
        try {
            const { email, password } = req.body;
            const UserExist = await User_model_1.UserModel.findOne({ email });
            if (!UserExist) {
                throw new error_response_1.NotFoundException("Invalid Login Data");
            }
            if (!UserExist?.confirmEmail) {
                res.status(400).json({ message: "Please Verify Your Account First" });
            }
            const match = await (0, Hash_security_1.compareHash)({ plainText: password, hashValue: UserExist?.password });
            if (!match) {
                return res.status(404).json({ message: "Invalid Login Data" });
            }
            const access_token = await (0, token_security_1.generateToken)({
                payLoad: { _id: UserExist?._id },
                signature: "kfldfkcrdklfcl5",
                options: {
                    expiresIn: 1800
                }
            });
            const refresh_token = await (0, token_security_1.generateToken)({
                payLoad: { _id: UserExist?._id },
                signature: "kfldfuyttykcrdklfcl5",
                options: {
                    expiresIn: 31536000
                }
            });
            return res.json({ message: "Done", data: { access_token, refresh_token } });
        }
        catch (error) {
            throw new error_response_1.ApplicationException("fail", 500, { cause: error });
        }
    };
    confirmEmail = async (req, res) => {
        try {
            const { email, otp } = req.body;
            const UserExist = await User_model_1.UserModel.findOne({
                email,
                confirmEmail: { $exists: false },
                confirmEmailOtp: { $exists: true }
            });
            if (!UserExist) {
                return res.status(404).json({ message: "In-valid Account Or Already Verified" });
            }
            const banUntil = UserExist.confirmEmailOtp.banUntil?.getTime() ?? 0;
            console.log(banUntil);
            const waitTime = (banUntil - Date.now()) / 1000;
            if ((banUntil) && (banUntil > Date.now())) {
                return res.status(400).json({ message: `You're Temporarily Banned ,Try Again After ${waitTime} seconds` });
            }
            if ((Date.now() - (UserExist.confirmEmailOtp.expiredAt?.getTime() ?? 0)) > 2 * 60 * 1000) {
                return res.status(400).json({ message: "Code Expired ,You Need To Request A New one" });
            }
            if (UserExist?.confirmEmailOtp.attempts === 5) {
                await User_model_1.UserModel.updateOne({ email }, {
                    'confirmEmailOtp.banUntil': Date.now() + 5 * 60 * 1000,
                    $inc: { __v: 1 }
                });
                return res.status(400).json({ message: "Too Many Failed Attempts ,You're Temporarily Banned For 5 Minutes" });
            }
            if (!await (0, Hash_security_1.compareHash)({ plainText: otp, hashValue: UserExist?.confirmEmailOtp.value })) {
                await User_model_1.UserModel.updateOne({ email }, {
                    $inc: { 'confirmEmailOtp.attempts': 1, __v: 1 }
                });
                return res.status(400).json({ message: "In-Valid Otp" });
            }
            const user = await User_model_1.UserModel.updateOne({ email }, {
                confirmEmail: Date.now(),
                $unset: { confirmEmailOtp: true },
                $inc: { __v: 1 }
            });
            return res.json({ message: "Done", data: { user } });
        }
        catch (error) {
            throw new error_response_1.ApplicationException("fail", 500, { cause: error });
        }
    };
    resendConfirmationEmail = async (req, res) => {
        try {
            const { email } = req.body;
            const UserExist = await User_model_1.UserModel.findOne({
                email,
                confirmEmail: { $exists: false },
                confirmEmailOtp: { $exists: true }
            });
            if (!UserExist) {
                return res.status(404).json({ message: "In-valid Account Or Already Verified" });
            }
            const otp = (0, nanoid_1.customAlphabet)("0123456789", 6)();
            const confirmEmailOtp = await (0, Hash_security_1.generateHash)({ plainText: otp });
            const banUntil = UserExist.confirmEmailOtp.banUntil?.getTime() ?? 0;
            const waitTime = (banUntil - Date.now()) / 1000;
            if ((banUntil) && (banUntil > Date.now())) {
                return res.status(400).json({ message: `You're Temporarily Banned ,Try Again After ${waitTime} seconds` });
            }
            emai_event_1.emailEvent.emit("confirmEmail", { to: email, otp: otp, userEmail: email });
            const user = await User_model_1.UserModel.updateOne({ email }, {
                $set: {
                    'confirmEmailOtp.value': confirmEmailOtp,
                    'confirmEmailOtp.attempt': 0,
                    'confirmEmailOtp.expiredAt': Date.now() + 2 * 60 * 1000
                },
                $unset: { 'confirmEmailOtp.banUntil': 1 },
                $inc: { __v: 1 }
            });
            return res.json({ message: "Done", data: { user } });
        }
        catch (error) {
            throw new error_response_1.ApplicationException("fail", 500, { cause: error });
        }
    };
}
exports.default = new AuthenticationService();
