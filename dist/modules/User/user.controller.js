"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authentication_middleware_1 = require("../../middleware/authentication.middleware");
const user_service_1 = __importDefault(require("./user.service"));
const user_authorization_1 = require("./user.authorization");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const validators = __importStar(require("./user.validation"));
const token_security_1 = require("../../utils/Security/token.security");
const cloud_multer_1 = require("../../utils/Multer/cloud.multer");
const Chat_1 = require("../Chat");
const router = (0, express_1.Router)();
router.use("/:userId/chat", Chat_1.ChatRouter);
router.get("/", (0, authentication_middleware_1.authorization)(user_authorization_1.endPoint.profile), user_service_1.default.profile);
router.get("/dashboard", (0, authentication_middleware_1.authorization)(user_authorization_1.endPoint.dashboard), user_service_1.default.dashboard);
router.get("/:userId", (0, validation_middleware_1.validation)(validators.shareProfile), user_service_1.default.shareProfile);
router.post("/logout", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.logout), user_service_1.default.logout);
router.post("/refresh-token", (0, authentication_middleware_1.authentication)(token_security_1.TokenEnum.refresh), user_service_1.default.refreshToken);
router.post("/:userId/send-friend-request", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.sentFriendRequest), user_service_1.default.sendFriendRequest);
router.patch("/profile-Photo", (0, authentication_middleware_1.authentication)(), user_service_1.default.profilePhoto);
router.patch("/profile-Cover-Photos", (0, authentication_middleware_1.authentication)(), (0, cloud_multer_1.cloudFileUpload)({ validation: cloud_multer_1.fileValidation.image, storageApproach: cloud_multer_1.StorageEnum.disk }).array("photos", 5), user_service_1.default.profileCoverPhotos);
router.patch("/:userId/restore-Account", (0, authentication_middleware_1.authorization)(user_authorization_1.endPoint.restore), (0, validation_middleware_1.validation)(validators.restoreAccount), user_service_1.default.restoreAccount);
router.patch("/:userId/change-role", (0, authentication_middleware_1.authorization)(user_authorization_1.endPoint.dashboard), (0, validation_middleware_1.validation)(validators.changeRole), user_service_1.default.changeRole);
router.patch("/update-password", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.updatePassword), user_service_1.default.updatePassword);
router.patch("/update-Personal-Info", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.updateBasicInfo), user_service_1.default.updateBasicInfo);
router.patch("/update-Email", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.updateEmail), user_service_1.default.updateEmail);
router.patch("/accept-friend-request/:requestId", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.acceptFriendRequest), user_service_1.default.acceptFriendRequest);
router.patch("/:userId/unfriend", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.unfriend), user_service_1.default.unfriend);
router.patch("/:userId/block", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.blockUser), user_service_1.default.blockUser);
router.delete("/delete-friend-request/:requestId", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.deleteFriendRequest), user_service_1.default.deleteFriendRequest);
router.delete("{/:userId}/freeze-Account", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.freezeAccount), user_service_1.default.freezeAccount);
router.delete("/:userId", (0, authentication_middleware_1.authorization)(user_authorization_1.endPoint.hardDelete), (0, validation_middleware_1.validation)(validators.hardDelete), user_service_1.default.hardDelete);
exports.default = router;
