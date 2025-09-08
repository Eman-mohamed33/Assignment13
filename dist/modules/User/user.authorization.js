"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endPoint = void 0;
const User_model_1 = require("../../DB/models/User.model");
exports.endPoint = {
    profile: [User_model_1.RoleEnum.user],
    restore: [User_model_1.RoleEnum.admin],
    hardDelete: [User_model_1.RoleEnum.admin]
};
