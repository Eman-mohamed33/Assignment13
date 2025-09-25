"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endPoint = void 0;
const User_model_1 = require("../../DB/models/User.model");
exports.endPoint = {
    profile: [User_model_1.RoleEnum.user, User_model_1.RoleEnum.superAdmin, User_model_1.RoleEnum.admin],
    restore: [User_model_1.RoleEnum.admin],
    hardDelete: [User_model_1.RoleEnum.admin],
    dashboard: [User_model_1.RoleEnum.superAdmin, User_model_1.RoleEnum.admin]
};
