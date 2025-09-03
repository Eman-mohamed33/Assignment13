import { z } from "zod";
import { LogoutEnum } from "../../utils/Security/token.security";

export const logout = {
    body: z.strictObject({
        flag: z.enum(LogoutEnum).default(LogoutEnum.only),
    })
    
}