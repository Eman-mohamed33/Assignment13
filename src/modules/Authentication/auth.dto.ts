import { z } from "zod";
import { confirmEmail, forgotPasswordCode, gmailValidation, login, resetYourNewPassword, signup, verifyForgotPasswordCode } from "./auth.validation";


// export interface ILoginInputsBodyDTO {
//     email: string,
//     password: string,
// }

// export interface ISignupInputsBodyDTO extends ILoginInputsBodyDTO{
//     fullName: string,
//     phone: string
//     gender: genderEnum,
// }

export type ILoginInputsBodyDTO = z.infer<typeof login.body>;
export type ISignupInputsBodyDTO = z.infer<typeof signup.body>;

export type IConfirmEmailInputsBodyDTO = z.infer<typeof confirmEmail.body>;
export type ISignupOrLoginInputBodyDTO = z.infer<typeof gmailValidation.body>;

export type ISendForgotPasswordCodeInputBodyDTO = z.infer<typeof forgotPasswordCode.body>;
export type IVerifyForgotPasswordCodeInputBodyDTO = z.infer<typeof verifyForgotPasswordCode.body>;
export type IResetNewPasswordInputBodyDTO = z.infer<typeof resetYourNewPassword.body>;


