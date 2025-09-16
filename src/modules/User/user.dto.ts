import { z } from "zod";
import { freezeAccount, hardDelete, logout, restoreAccount, shareProfile, updateBasicInfo, updateEmail, updatePassword } from "./user.validation";


export type ILogoutBodyDto = z.infer<typeof logout.body>;
export type IFreezeAccountParamsDto = z.infer<typeof freezeAccount.params>;
export type IRestoreAccountParamsDto = z.infer<typeof restoreAccount.params>;
export type IHardDeleteAccountParamsDto = z.infer<typeof hardDelete.params>;
export type IShareProfileParamsDto = z.infer<typeof shareProfile.params>;
export type IUpdatePasswordBodyDto = z.infer<typeof updatePassword.body>;
export type IUpdateEmailBodyDto = z.infer<typeof updateEmail.body>;
export type IUpdateBasicInfoBodyDto = z.infer<typeof updateBasicInfo.body>;
