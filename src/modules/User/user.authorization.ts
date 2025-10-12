import { RoleEnum } from "../../DB/models/User.model";



export const endPoint = {
    welcome: [RoleEnum.user, RoleEnum.admin],
    profile: [RoleEnum.user,RoleEnum.superAdmin,RoleEnum.admin],
    restore: [RoleEnum.admin],
    hardDelete: [RoleEnum.admin],
    dashboard: [RoleEnum.superAdmin, RoleEnum.admin]
};