"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endPoint = void 0;
const User_model_1 = require("../../DB/models/User.model");
exports.endPoint = {
    deletePost: [User_model_1.RoleEnum.superAdmin, User_model_1.RoleEnum.admin]
};
