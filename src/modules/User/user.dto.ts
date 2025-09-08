import { z } from "zod";
import { freezeAccount, hardDelete, logout, restoreAccount, shareProfile } from "./user.validation";


export type ILogoutBodyDto = z.infer<typeof logout.body>;
export type IFreezeAccountParamsDto = z.infer<typeof freezeAccount.params>;
export type IRestoreAccountParamsDto = z.infer<typeof restoreAccount.params>;
export type IHardDeleteAccountParamsDto = z.infer<typeof hardDelete.params>;
export type IShareProfileParamsDto = z.infer<typeof shareProfile.params>;