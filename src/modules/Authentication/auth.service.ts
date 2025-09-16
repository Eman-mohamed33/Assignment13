
import type { Request, Response } from "express";
import { ProviderEnum, UserModel } from "../../DB/models/User.model";
import { emailEvent } from "../../utils/Events/email.event";
import { compareHash, generateHash } from "../../utils/Security/Hash.security";
import { customAlphabet } from "nanoid";
import { createLoginCredentials } from "../../utils/Security/token.security";
import { BadRequestException, conflictException, NotFoundException } from "../../utils/Response/error.response";
import { IConfirmEmailInputsBodyDTO, ILoginInputsBodyDTO, IResetNewPasswordInputBodyDTO, ISendForgotPasswordCodeInputBodyDTO, ISignupInputsBodyDTO, ISignupOrLoginInputBodyDTO, IVerifyForgotPasswordCodeInputBodyDTO } from "./auth.dto";
import { UserRepository } from "../../DB/Repository";
import {OAuth2Client, TokenPayload} from 'google-auth-library';
import { generateOtp } from "../../utils/Security/Otp";
import { successResponse } from "../../utils/Response/success.response";
import { ILoginResponse } from "./auth.entities";





class AuthenticationService {
    private userModel = new UserRepository(UserModel);

    private async verifyGmailAccount(idToken: string): Promise<TokenPayload> {
     
        const client = new OAuth2Client();

        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.WEB_CLIENT_IDs?.split(",") || [],
        });
        const payload = ticket.getPayload();
        if (!payload?.email_verified) {
            throw new BadRequestException("Fail to verify this google Account");
        }
        return payload;
    }
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
      
        const { userName, email, password, phone, gender, age }: ISignupInputsBodyDTO = req.body;

        const UserExist = await this.userModel.findOne({ filter: { email } });
            
            
        if (UserExist) {
            throw new conflictException("User is Already Exist");
        }
        const otp = customAlphabet("0123456789", 6)();


        // const hashPassword = await generateHash(password);
        // const encPhone = await generateEncryption({ plainText: phone });
        // const confirmEmailOtp = await generateHash(otp);

        const user = await this.userModel.createUser({
            data: [{
                userName
                , email
                , password
                , phone,
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
            throw new BadRequestException("Fail to create new user");
        }
        // emailEvent.emit("confirmEmail", { to: email, otp: otp, userEmail: email });

        return successResponse({ res, statusCode: 201 });
        
    }

/**
 * 
 * @param req 
 * body {idToken}
 * verifyGmailAccount {email, picture, family_name, given_name}
 * @param res 
 * 201 
 * message="Done"
 */
    signupWithGmail = async (req: Request, res: Response): Promise<Response> => {
        const { idToken }: ISignupOrLoginInputBodyDTO = req.body;
        const { email, picture, family_name, given_name } = await this.verifyGmailAccount(idToken);
        const checkUserExist = await this.userModel.findOne({
            filter: { email }
        });
        if (checkUserExist) {
            if (checkUserExist.provider === ProviderEnum.google) {
                await this.loginWithGmail(req, res);
            }
            throw new conflictException("User already Exist");
        }

        const [user] = await this.userModel.create({
            data: [{
                firstName: given_name as string,
                lastName: family_name as string,
                email: email as string,
                profileImage: picture as string,
                confirmEmail: new Date(),
                provider: ProviderEnum.google,
                
            }],
        }) || [];
        if (!user) {
            throw new BadRequestException("Fail to signup with gmail please try again...");
        }
        return successResponse({ res, statusCode: 201 });
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
        
        const { email, password, enable2stepVerification }: ILoginInputsBodyDTO = req.body;
       
        const UserExist = await this.userModel.findOne({
            filter: { email }
        });

        if (!UserExist) {
            throw new NotFoundException("Invalid Login Data");
        }

        if (!UserExist?.confirmEmail) {
            throw new BadRequestException("Please Verify Your Account First");
        }

        const match = await compareHash(password, UserExist?.password);

        if (!match) {
            throw new NotFoundException("Invalid Login Data");
        }
       
       
        if (enable2stepVerification) {
            await this.twoStepVerification(req, res, email);
        }
        
        const credentials = await createLoginCredentials(UserExist);
        return successResponse<ILoginResponse>({ res, statusCode: 201, data: { credentials } });

    }


    /**
     * 
     * @param req 
     * body {idToken}
     * verifyGmailAccount {email}
     * @param res 
     * 200
     * data : {credentials}
     * @returns 
     */
    loginWithGmail = async (req: Request, res: Response): Promise<Response> => {
        const { idToken }: ISignupOrLoginInputBodyDTO = req.body;
        const { email } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({
            filter: { email, provider: ProviderEnum.google }
        });
        if (!user) {
            throw new NotFoundException("User Not Exist");
        }

        const credentials = await createLoginCredentials(user);
        return successResponse<ILoginResponse>({ res, data: { credentials }, statusCode: 201 });

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
        const { email, otp }: IConfirmEmailInputsBodyDTO = req.body;

        const UserExist = await this.userModel.findOne({
            filter: {
                email,
                confirmEmail: { $exists: false },
                confirmEmailOtp: { $exists: true }
            }
        });
        if (!UserExist) {
            throw new NotFoundException("In-valid Account Or Already Verified");
        }
        const banUntil = UserExist?.confirmEmailOtp?.banUntil?.getTime() ?? 0;
        console.log(banUntil);

        const waitTime = (banUntil - Date.now()) / 1000;

        if ((banUntil) && (banUntil > Date.now())) {
            throw new BadRequestException(`You're Temporarily Banned ,Try Again After ${waitTime} seconds`);
        }

        if ((Date.now() - (UserExist?.confirmEmailOtp?.expiredAt?.getTime() ?? 0)) > 2 * 60 * 1000) {
            throw new BadRequestException("Code Expired ,You Need To Request A New one");
        }

        if (UserExist?.confirmEmailOtp?.attempts === 5) {
            await this.userModel.updateOne({
                filter: { email },
                update: {
                    'confirmEmailOtp.banUntil': Date.now() + 5 * 60 * 1000,
                }
            });

            throw new BadRequestException("Too Many Failed Attempts ,You're Temporarily Banned For 5 Minutes");
        }

        if (!await compareHash(otp, UserExist?.confirmEmailOtp?.value as string)) {
            await this.userModel.updateOne({
                filter: { email },
                update: {
                    $inc: { 'confirmEmailOtp.attempts': 1 }
                }
            });
            throw new BadRequestException("In-Valid Otp");

        }
        const user = await this.userModel.updateOne({
            filter: { email },
            update: {
                confirmEmail: Date.now(),
                $unset: { confirmEmailOtp: true },
            }
        });

        if (!user) {
            throw new BadRequestException("Fail to confirm user Email");
        }
        return successResponse({ res });
        
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
      
        const { email } = req.body;
        const UserExist = await this.userModel.findOne({
            filter: {
                email,
                confirmEmail: { $exists: false },
                confirmEmailOtp: { $exists: true }
            }
        });
        if (!UserExist) {
            throw new NotFoundException("In-valid Account Or Already Verified");
        }
            
        const otp = customAlphabet("0123456789", 6)();
        const confirmEmailOtp = await generateHash(otp);

            

        const banUntil = UserExist?.confirmEmailOtp?.banUntil?.getTime() ?? 0;
        const waitTime = (banUntil - Date.now()) / 1000;

        if ((banUntil) && (banUntil > Date.now())) {
            throw new BadRequestException(`You're Temporarily Banned ,Try Again After ${waitTime} seconds`);
        }

        emailEvent.emit("confirmEmail", { to: email, otp: otp, userEmail: email });
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
            throw new BadRequestException("Fail to resend confirm Email");
        }
        return successResponse({ res });
        
    }

    /**
     * 
     * @param req 
     * body  {email}
     * @param res 
     * send otpCode 
     * @returns 
     */
    findYourAccount_sendForgotPasswordCode = async (req: Request, res: Response): Promise<Response> => {
        const { email }: ISendForgotPasswordCodeInputBodyDTO = req.body;

        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: ProviderEnum.system,
                confirmEmail: { $exists: true },
                
            }
        });

        if (!user) {
            throw new NotFoundException("In-valid Account due to one of the following reasons [not register ,not confirmed ,invalid provider]");
        }

        const otp = generateOtp();

        const updatedUser = await this.userModel.updateOne({
            filter: { email },
            update: {
                resetPasswordOtp: await generateHash(String(otp))
            }
        })
        if (!updatedUser.matchedCount) {
            throw new BadRequestException("Fail to send the reset code please try again later");
        }

        emailEvent.emit("SendForgotPasswordCode", { to: email, otp });
        return successResponse({ res, message: `We Sent Your Code To ${email} , Please Check Your Email ✅` });
    }

    verifyForgotPasswordCode = async (req: Request, res: Response): Promise<Response> => {
        const { email, otp }: IVerifyForgotPasswordCodeInputBodyDTO = req.body;

        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: ProviderEnum.system,
                resetPasswordOtp: { $exists: true },
                
            }
        });

        if (!user) {
            throw new NotFoundException("In-valid Account due to one of the following reasons [not register ,not confirmed ,invalid provider]");
        }

        if (!await compareHash(otp, user.resetPasswordOtp as string)) {
            throw new NotFoundException("Invalid Otp");
        }

        return successResponse({ res });
    }

    /**
     * 
     * @param req 
     * body { email,otp, password }
     * @param res 
     * message:"Done"
     * @returns 
     */
    resetYourPassword = async (req: Request, res: Response): Promise<Response> => {
        const { email,otp, password }: IResetNewPasswordInputBodyDTO = req.body;

        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: ProviderEnum.system,
                resetPasswordOtp: { $exists: true },
                
            }
        });

        if (!user) {
            throw new NotFoundException("In-valid Account due to one of the following reasons [not register ,not confirmed ,invalid provider]");
        }

        if (!await compareHash(otp, user.resetPasswordOtp as string)) {
            throw new NotFoundException("Invalid Otp");
        }
        
        const updatedUser = await this.userModel.updateOne({
            filter: { email },
            update: {
                password: await generateHash(password),
                $unset: { resetPasswordOtp: 1 },
                changeCredentialsTime: new Date()
            }
        });

        if (!updatedUser.matchedCount) {
            throw new BadRequestException("Fail to reset password please try again later");
        }

        return successResponse({ res, message: `Your Password is Reset` });
    }

    twoStepVerification = async (req: Request, res: Response, email: string): Promise<Response> => {

        const otp = customAlphabet("0123456", 6)();
        const user = await this.userModel.updateOne({
            filter: {
               email,
                confirmEmail: { $exists: true },
                deletedAt: { $exists: false }
            },
            update: {
                stepVerificationOtp: await generateHash(otp),

            }
        });
        
        if (!user.matchedCount) {
            throw new BadRequestException("Fail to Apply 2-step-verification");
        }
        emailEvent.emit("stepVerification", { to: email, otp });
        return successResponse({ res, message: "Otp sent!" });
    }

    loginConfirmation = async (req: Request, res: Response): Promise<Response> => {
        
        const {email, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                stepVerificationOtp: { $exists: true }
            }
        });

        if (!await compareHash(otp, user?.stepVerificationOtp as string)) {
            throw new BadRequestException("In-valid Otp ,please try again later ");
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
            throw new NotFoundException("Invalid Login Data");
        }
        const credentials = await createLoginCredentials(user);

        return successResponse<ILoginResponse>({ res, statusCode: 201, data: { credentials } });
    }
}

export default new AuthenticationService();








