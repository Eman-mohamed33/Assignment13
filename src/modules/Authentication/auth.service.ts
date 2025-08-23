
import type { Request, Response } from "express";
import { UserModel } from "../../DB/models/User.model";
import { emailEvent } from "../../utils/Events/emai.event";
import { compareHash, generateHash } from "../../utils/Security/Hash.security";
import { generateEncryption } from "../../utils/Security/Encryption.security";
import { customAlphabet } from "nanoid";
import { generateToken } from "../../utils/Security/token.security";
import { ApplicationException, NotFoundException } from "../../utils/Response/error.response";
import { ILoginInputsBodyDTO, ISignupInputsBodyDTO } from "./auth.dto";


class AuthenticationService {
    constructor() { }

/**
 * 
 * @param req 
 * body {fullName,email,password,gender,phone};
 * @param res 
 * 201
 * message="Done"
 * 
 */

    signup = async (req: Request, res: Response): Promise<Response> => {
        try {

            const { fullName, email, password, phone, gender }: ISignupInputsBodyDTO = req.body;
            const UserExist = await UserModel.findOne({ email });

            const otp = customAlphabet("0123456789", 6)();
            if (UserExist) {
                res.status(409).json({ message: "Email Already Exist" });
                // throw new ApplicationException("Email Already Exist", 409, {
                //     cause: {
                //         extra: "jk"
                //     }
                // });
            }

            const hashPassword = await generateHash({ plainText: password });
            const encPhone = await generateEncryption({ plainText: phone });
            const confirmEmailOtp = await generateHash({ plainText: otp });

            const user = await UserModel.create(
                {
                    fullName
                    , email
                    , password: hashPassword
                    , phone: encPhone,
                    gender,
                    confirmEmailOtp: {
                        value: confirmEmailOtp,
                        attempts: 0,
                        expiredAt: Date.now() + 2 * 60 * 1000
                    }
                });
            
            emailEvent.emit("confirmEmail", { to: email, otp: otp, userEmail: email });
            return res.status(201).json({ message: "Done", data: { user } });
        
        } catch (error) {
            throw new ApplicationException("fail", 500, { cause: error });
        }
    }


    /**
     * 
     * @param req 
     * body {email,password}
     * @param res 
     * 200
     * message="Done",data:{credentials}
     * 
     */
    login = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { email, password }: ILoginInputsBodyDTO = req.body;
            const UserExist = await UserModel.findOne({ email });
            if (!UserExist) {
                //res.status(404).json({ message: "Invalid Login Data" });
                throw new NotFoundException("Invalid Login Data");
            }

            if (!UserExist?.confirmEmail) {
                res.status(400).json({ message: "Please Verify Your Account First" });
            }

            const match = await compareHash({ plainText: password, hashValue: UserExist?.password });

            if (!match) {
                return res.status(404).json({ message: "Invalid Login Data" });
            }
           
            const access_token = await generateToken({
                payLoad: { _id: UserExist?._id },
                signature: "kfldfkcrdklfcl5",
                options: {
                    expiresIn: 1800
                }
            });

            const refresh_token = await generateToken({
                payLoad: { _id: UserExist?._id },
                signature: "kfldfuyttykcrdklfcl5",
                options: {
                    expiresIn: 31536000
                }
            });

            return res.json({ message: "Done", data: { access_token, refresh_token } });
        
        } catch (error) {
            throw new ApplicationException("fail", 500, { cause: error });
        }
    }

/**
 * 
 * @param req 
 * body {email,otp}
 * @param res 
 * 200
 * message="Done"
 */
    confirmEmail = async (req: Request, res: Response): Promise<Response> => {
        try {
            
            const { email, otp } = req.body;

            const UserExist = await UserModel.findOne({
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
                await UserModel.updateOne({ email }, {
                    'confirmEmailOtp.banUntil': Date.now() + 5 * 60 * 1000,
                    $inc: { __v: 1 }
                });

                return res.status(400).json({ message: "Too Many Failed Attempts ,You're Temporarily Banned For 5 Minutes" });
            }

            if (!await compareHash({ plainText: otp, hashValue: UserExist?.confirmEmailOtp.value })) {
                await UserModel.updateOne({ email }, {
                    $inc: { 'confirmEmailOtp.attempts': 1, __v: 1 }
                });
                return res.status(400).json({ message: "In-Valid Otp" });

            }
            const user = await UserModel.updateOne({email},{
                confirmEmail: Date.now(),
                $unset: { confirmEmailOtp: true },
                $inc: { __v: 1 }
            });

            return res.json({ message: "Done", data: { user } });
        
        } catch (error) {
            throw new ApplicationException("fail", 500, { cause: error });
        }
    }


    /**
     * 
     * @param req 
     * body {email}
     * @param res 
     * 200 
     * message="Done"
     * 
     */
    resendConfirmationEmail = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { email } = req.body;
            const UserExist = await UserModel.findOne({
                email,
                confirmEmail: { $exists: false },
                confirmEmailOtp: { $exists: true }
            });
            if (!UserExist) {
                return res.status(404).json({ message: "In-valid Account Or Already Verified" });
            }
            
            const otp = customAlphabet("0123456789", 6)();
            const confirmEmailOtp = await generateHash({ plainText: otp });

            

            const banUntil = UserExist.confirmEmailOtp.banUntil?.getTime() ?? 0;
             const waitTime = (banUntil - Date.now()) / 1000;

            if ((banUntil) && (banUntil > Date.now())) {
                return res.status(400).json({ message: `You're Temporarily Banned ,Try Again After ${waitTime} seconds` });
            }

            emailEvent.emit("confirmEmail", { to: email, otp: otp, userEmail: email });
            const user = await UserModel.updateOne({ email }, {
                $set: {
                    'confirmEmailOtp.value': confirmEmailOtp,
                    'confirmEmailOtp.attempt': 0,
                    'confirmEmailOtp.expiredAt': Date.now() + 2 * 60 * 1000
                },
                $unset: { 'confirmEmailOtp.banUntil': 1 },
                $inc: { __v: 1 }
            });

            return res.json({ message: "Done", data: { user } });
        
        } catch (error) {
            throw new ApplicationException("fail", 500, { cause: error });
        }
    }

}




export default new AuthenticationService();






