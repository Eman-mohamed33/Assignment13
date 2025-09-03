"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_model_1 = require("../../DB/models/User.model");
const token_security_1 = require("../../utils/Security/token.security");
const User_repository_1 = require("../../DB/Repository/User.repository");
class UserService {
    userModel = new User_repository_1.UserRepository(User_model_1.UserModel);
    constructor() { }
    profile = async (req, res) => {
        return res.json({
            message: "Done", data: {
                user: req.user,
                decoded: req.decoded?.iat
            }
        });
    };
    logout = async (req, res) => {
        const { flag } = req.body;
        let statusCode = 200;
        const update = {};
        switch (flag) {
            case token_security_1.LogoutEnum.all:
                update.changeCredentialsTime = new Date();
                break;
            default:
                await (0, token_security_1.createRevokeToken)(req.decoded);
                statusCode = 201;
                break;
        }
        const user = await this.userModel.updateOne({
            filter: { _id: req.decoded?._id },
            update
        });
        return res.status(statusCode).json({
            message: "Done", data: {
                user
            }
        });
    };
    refreshToken = async (req, res) => {
        const credentials = await (0, token_security_1.createLoginCredentials)(req.user);
        await (0, token_security_1.createRevokeToken)(req.decoded);
        return res.status(201).json({
            message: "Done", data: {
                credentials
            }
        });
    };
}
exports.default = new UserService;
