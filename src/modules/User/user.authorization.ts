import { RoleEnum } from "../../DB/models/User.model";



export const endPoint = {
    profile: [RoleEnum.user],
    restore: [RoleEnum.admin],
    hardDelete: [RoleEnum.admin]
};