"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudFileUpload = exports.fileValidation = exports.StorageEnum = void 0;
const multer_1 = __importDefault(require("multer"));
const nanoid_1 = require("nanoid");
const node_os_1 = __importDefault(require("node:os"));
const error_response_1 = require("../Response/error.response");
var StorageEnum;
(function (StorageEnum) {
    StorageEnum["memory"] = "memory";
    StorageEnum["disk"] = "disk";
})(StorageEnum || (exports.StorageEnum = StorageEnum = {}));
exports.fileValidation = {
    image: ["image/jpeg", "image/gif", "image/png", "image/tiff", "image/vnd.wap.wbmp", "image/x-ms-bmp", 'application/octet-stream']
};
const cloudFileUpload = ({ storageApproach = StorageEnum.memory, maximumSize = 2, validation = [] }) => {
    console.log(node_os_1.default.tmpdir());
    const storage = storageApproach === StorageEnum.memory ? multer_1.default.memoryStorage() : multer_1.default.diskStorage({
        destination: node_os_1.default.tmpdir(),
        filename: function (req, file, callback) {
            callback(null, `${(0, nanoid_1.nanoid)()}_${file.originalname}`);
        },
    });
    function fileFilter(req, file, callback) {
        if (!validation.includes(file.mimetype)) {
            callback(new error_response_1.BadRequestException("Validation Error", {
                key: "file", issues: {
                    path: "file",
                    message: "Invalid file format"
                }
            }));
        }
        callback(null, true);
    }
    return (0, multer_1.default)({
        fileFilter,
        storage,
        limits: {
            fieldSize: maximumSize * 1024 * 1024
        },
    });
};
exports.cloudFileUpload = cloudFileUpload;
