import { RoleEnum } from "../../DB/models/User.model";

export const endPoint = {
    deletePost: [RoleEnum.superAdmin, RoleEnum.admin]
}