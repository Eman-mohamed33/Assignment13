import { RoleEnum } from "../../DB/models/User.model";



export const endPoint = {
    profile: [RoleEnum.user,RoleEnum.superAdmin,RoleEnum.admin],
    restore: [RoleEnum.admin],
    hardDelete: [RoleEnum.admin],
    dashboard: [RoleEnum.superAdmin, RoleEnum.admin]
};