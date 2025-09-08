"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_model_1 = require("../../DB/models/User.model");
const token_security_1 = require("../../utils/Security/token.security");
const User_repository_1 = require("../../DB/Repository/User.repository");
const S3_config_1 = require("../../utils/Multer/S3.config");
const cloud_multer_1 = require("../../utils/Multer/cloud.multer");
const S3_event_1 = require("../../utils/Events/S3.event");
const error_response_1 = require("../../utils/Response/error.response");
const success_response_1 = require("../../utils/Response/success.response");
class UserService {
    userModel = new User_repository_1.UserRepository(User_model_1.UserModel);
    constructor() { }
    profile = async (req, res) => {
        if (!req.user) {
            throw new error_response_1.unAuthorizedException("Missing user details");
        }
        return (0, success_response_1.successResponse)({
            res, data: {
                user: req.user
            }
        });
    };
    shareProfile = async (req, res) => {
        const { userId } = req.params;
        const user = await this.userModel.findOne({
            filter: {
                _id: userId,
                confirmEmail: { $exists: true },
                deletedAt: { $exists: false }
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Invalid user account");
        }
        return (0, success_response_1.successResponse)({ res, data: { user } });
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
        if (!user) {
            throw new error_response_1.BadRequestException("Fail to Logout");
        }
        return (0, success_response_1.successResponse)({ res, statusCode });
    };
    refreshToken = async (req, res) => {
        const credentials = await (0, token_security_1.createLoginCredentials)(req.user);
        await (0, token_security_1.createRevokeToken)(req.decoded);
        return (0, success_response_1.successResponse)({ res, statusCode: 201, data: { credentials } });
    };
    profilePhoto = async (req, res) => {
        const { originalname, ContentType } = req.body;
        const { url, key } = await (0, S3_config_1.preUploadSignedUrl)({ originalname, ContentType, path: `users/${req.decoded?._id}` });
        const user = await this.userModel.findByIdAndUpdate({
            id: req.user?._id,
            update: {
                profileImage: key,
                tempOldProfileImage: req.user?.profileImage
            }
        });
        if (!user) {
            throw new error_response_1.BadRequestException("Fail to upload profile Image");
        }
        S3_event_1.s3Event.emit("trackProfileImageUpload", {
            id: req.user?._id,
            oldKey: req.user?.profileImage,
            Key: key
        });
        return (0, success_response_1.successResponse)({ res, data: { url } });
    };
    profileCoverPhotos = async (req, res) => {
        const urls = await (0, S3_config_1.uploadFilesOrLargeFiles)({
            storageApproach: cloud_multer_1.StorageEnum.disk,
            path: `users/${req.decoded?._id}/cover`,
            files: req.files
        });
        const user = await this.userModel.findByIdAndUpdate({
            id: req.user?._id,
            update: {
                profileCoverImages: urls
            }
        });
        if (!user) {
            throw new error_response_1.BadRequestException("Fail to upload profile cover Images");
        }
        if (req.user?.profileCoverImages) {
            await (0, S3_config_1.deleteFiles)({ urls: req.user.profileCoverImages });
        }
        return (0, success_response_1.successResponse)({ res, data: { user } });
    };
    freezeAccount = async (req, res) => {
        const { userId } = req.params || {};
        if (userId && req.user?.role !== User_model_1.RoleEnum.admin) {
            throw new error_response_1.forbiddenException("Not authorized user");
        }
        const user = await this.userModel.updateOne({
            filter: {
                _id: userId || req.user?._id,
                deletedAt: { $exists: false },
                deletedBy: { $exists: false },
            },
            update: {
                deletedAt: new Date(),
                deletedBy: req.user?._id,
                changeCredentialsTime: new Date(),
                $unset: {
                    restoredAt: 1,
                    restoredBy: 1
                }
            }
        });
        if (!user.matchedCount) {
            throw new error_response_1.NotFoundException("User not found and Fail to delete this account");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    restoreAccount = async (req, res) => {
        const { userId } = req.params;
        const user = await this.userModel.updateOne({
            filter: {
                _id: userId,
                deletedBy: { $ne: userId },
            },
            update: {
                restoredAt: new Date(),
                restoredBy: req.user?._id,
                $unset: {
                    deletedAt: 1,
                    deletedBy: 1
                }
            }
        });
        if (!user.matchedCount) {
            throw new error_response_1.NotFoundException("User not found and Fail to restore this account");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    hardDelete = async (req, res) => {
        const { userId } = req.params;
        const user = await this.userModel.deleteOne({
            filter: {
                _id: userId,
                deletedAt: { $exists: true },
                deletedBy: { $exists: true },
            }
        });
        if (!user.deletedCount) {
            throw new error_response_1.NotFoundException("User not found or Fail to hard Delete this account");
        }
        await (0, S3_config_1.deleteFolderByPrefix)({ path: `users/${userId}` });
        return (0, success_response_1.successResponse)({ res });
    };
}
exports.default = new UserService;
