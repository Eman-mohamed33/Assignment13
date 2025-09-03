import { z } from "zod";
import { logout } from "./user.validation";


export type ILogoutBodyDto = z.infer<typeof logout.body>;