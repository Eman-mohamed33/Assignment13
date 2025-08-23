import { z } from "zod";
import { login, signup } from "./auth.validation";


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

