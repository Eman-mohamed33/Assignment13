"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFolderByPrefix = exports.listDirectoryFiles = exports.deleteFiles = exports.deleteFile = exports.createPreSignedGetUrl = exports.getFile = exports.preUploadSignedUrl = exports.uploadFilesOrLargeFiles = exports.uploadLargeFile = exports.uploadFile = exports.s3Config = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const nanoid_1 = require("nanoid");
const error_response_1 = require("../Response/error.response");
const cloud_multer_1 = require("./cloud.multer");
const fs_1 = require("fs");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const s3Config = () => {
    return new client_s3_1.S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    });
};
exports.s3Config = s3Config;
const uploadFile = async ({ storageApproach = cloud_multer_1.StorageEnum.memory, Bucket = process.env.AWS_BUCKET_NAME, ACL = "private", path = "general", file }) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket,
        ACL,
        Key: `${process.env.APPLICATION_NAME}/${path}/${(0, nanoid_1.nanoid)()}_${file.originalname}`,
        Body: storageApproach === cloud_multer_1.StorageEnum.memory ? file.buffer : (0, fs_1.createReadStream)(file.path),
        ContentType: file.mimetype
    });
    await (0, exports.s3Config)().send(command);
    if (!command?.input?.Key) {
        throw new error_response_1.BadRequestException("Fail to generate upload key");
    }
    return command.input.Key;
};
exports.uploadFile = uploadFile;
const uploadLargeFile = async ({ storageApproach = cloud_multer_1.StorageEnum.memory, Bucket = process.env.AWS_BUCKET_NAME, ACL = "private", path = "general", file }) => {
    const upload = new lib_storage_1.Upload({
        client: (0, exports.s3Config)(),
        params: {
            Bucket,
            ACL,
            Key: `${process.env.APPLICATION_NAME}/${path}/${(0, nanoid_1.nanoid)()}_${file.originalname}`,
            Body: storageApproach === cloud_multer_1.StorageEnum.memory ? file.buffer : (0, fs_1.createReadStream)(file.path),
            ContentType: file.mimetype
        }
    });
    upload.on("httpUploadProgress", (progress) => {
        console.log(`Upload file progress is ::: ${progress}`);
    });
    const { Key } = await upload.done();
    if (!Key) {
        throw new error_response_1.BadRequestException("Fail to generate upload key");
    }
    return Key;
};
exports.uploadLargeFile = uploadLargeFile;
const uploadFilesOrLargeFiles = async ({ storageApproach = cloud_multer_1.StorageEnum.memory, Bucket = process.env.AWS_BUCKET_NAME, ACL = "private", path = "general", files, useLarge }) => {
    let urls = [];
    if (useLarge) {
        urls = await Promise.all(files.map((file) => {
            return (0, exports.uploadLargeFile)({
                storageApproach,
                Bucket,
                ACL,
                path,
                file
            });
        }));
    }
    else {
        urls = await Promise.all(files.map((file) => {
            return (0, exports.uploadFile)({
                storageApproach,
                Bucket,
                ACL,
                path,
                file
            });
        }));
    }
    return urls;
};
exports.uploadFilesOrLargeFiles = uploadFilesOrLargeFiles;
const preUploadSignedUrl = async ({ Bucket = process.env.AWS_BUCKET_NAME, path = "general", originalname, ContentType, ExpiresIn = 120 }) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket,
        Key: `${process.env.APPLICATION_NAME}/${path}/${(0, nanoid_1.nanoid)()}_pre_${originalname}`,
        ContentType
    });
    const url = await (0, s3_request_presigner_1.getSignedUrl)((0, exports.s3Config)(), command, { expiresIn: ExpiresIn });
    if (!url || !command?.input?.Key) {
        throw new error_response_1.BadRequestException("Fail to generate preSignedUrl");
    }
    return { url, key: command.input.Key };
};
exports.preUploadSignedUrl = preUploadSignedUrl;
const getFile = async ({ Bucket = process.env.AWS_BUCKET_NAME, Key }) => {
    const command = new client_s3_1.GetObjectCommand({
        Bucket,
        Key
    });
    return (0, exports.s3Config)().send(command);
};
exports.getFile = getFile;
const createPreSignedGetUrl = async ({ Bucket = process.env.AWS_BUCKET_NAME, Key, ExpiresIn = 120, download = false }) => {
    const command = new client_s3_1.GetObjectCommand({
        Bucket,
        Key,
        ResponseContentDisposition: download ? `attachments; filename="${Key?.split("/").pop()}"` : undefined
    });
    const url = await (0, s3_request_presigner_1.getSignedUrl)((0, exports.s3Config)(), command, { expiresIn: ExpiresIn });
    if (!url) {
        throw new error_response_1.BadRequestException("Fail to generate preSignedUrl");
    }
    return url;
};
exports.createPreSignedGetUrl = createPreSignedGetUrl;
const deleteFile = async ({ Bucket = process.env.AWS_BUCKET_NAME, Key }) => {
    const command = new client_s3_1.DeleteObjectCommand({
        Bucket,
        Key
    });
    return await (0, exports.s3Config)().send(command);
};
exports.deleteFile = deleteFile;
const deleteFiles = async ({ Bucket = process.env.AWS_BUCKET_NAME, urls = [], Quiet = false }) => {
    const Objects = urls.map(url => {
        return { Key: url };
    });
    const command = new client_s3_1.DeleteObjectsCommand({
        Bucket,
        Delete: {
            Objects,
            Quiet
        }
    });
    return await (0, exports.s3Config)().send(command);
};
exports.deleteFiles = deleteFiles;
const listDirectoryFiles = async ({ Bucket = process.env.AWS_BUCKET_NAME, path = "general" }) => {
    const command = new client_s3_1.ListObjectsV2Command({
        Bucket,
        Prefix: `${process.env.APPLICATION_NAME}/${path}`
    });
    return (0, exports.s3Config)().send(command);
};
exports.listDirectoryFiles = listDirectoryFiles;
const deleteFolderByPrefix = async ({ Bucket = process.env.AWS_BUCKET_NAME, path = "general", Quiet = false }) => {
    const files = await (0, exports.listDirectoryFiles)({ Bucket, path });
    if (!files.Contents?.length) {
        throw new error_response_1.BadRequestException("Empty Directory");
    }
    const urls = files.Contents.map((file) => {
        return file.Key;
    });
    return await (0, exports.deleteFiles)({ Bucket, urls, Quiet });
};
exports.deleteFolderByPrefix = deleteFolderByPrefix;
