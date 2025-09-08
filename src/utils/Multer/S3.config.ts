import { DeleteObjectCommand, DeleteObjectCommandOutput, DeleteObjectsCommand, DeleteObjectsCommandOutput, GetObjectCommand, ListObjectsV2Command, ListObjectsV2CommandOutput, ObjectCannedACL, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import { BadRequestException } from "../Response/error.response";
import { StorageEnum } from "./cloud.multer";
import { createReadStream } from "fs";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3Config = () => {
    
    return new S3Client({
        region: process.env.AWS_REGION as string,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string
        }
    });
}

export const uploadFile = async ({
    storageApproach = StorageEnum.memory,
    Bucket = process.env.AWS_BUCKET_NAME as string,
    ACL = "private",
    path = "general",
    file
}: {
    storageApproach?: StorageEnum,
    Bucket?: string,
    ACL?: ObjectCannedACL,
    path?: string,
    file: Express.Multer.File
}):Promise<string> => {
    const command = new PutObjectCommand({
        Bucket,
        ACL,
        Key: `${process.env.APPLICATION_NAME}/${path}/${nanoid()}_${file.originalname}`,
        Body: storageApproach === StorageEnum.memory ? file.buffer : createReadStream(file.path),
        ContentType: file.mimetype
    });

    await s3Config().send(command);
    if (!command?.input?.Key) {
        throw new BadRequestException("Fail to generate upload key");
    }

    return command.input.Key;
}

export const uploadLargeFile = async ({
    storageApproach = StorageEnum.memory,
    Bucket = process.env.AWS_BUCKET_NAME as string,
    ACL = "private",
    path = "general",
    file
}: {
    storageApproach?: StorageEnum,
    Bucket?: string,
    ACL?: ObjectCannedACL,
    path?: string,
    file: Express.Multer.File
}): Promise<string> => {
    const upload = new Upload({
        client: s3Config(),
        params: {
            Bucket,
            ACL,
            Key: `${process.env.APPLICATION_NAME}/${path}/${nanoid()}_${file.originalname}`,
            Body: storageApproach === StorageEnum.memory ? file.buffer : createReadStream(file.path),
            ContentType: file.mimetype
        }
    });

    upload.on("httpUploadProgress", (progress) => {
        console.log(`Upload file progress is ::: ${progress}`);
    });

    const { Key } = await upload.done();
    if (!Key) {
        throw new BadRequestException("Fail to generate upload key");
    }
    return Key;
}

export const uploadFilesOrLargeFiles = async ({
    storageApproach = StorageEnum.memory,
    Bucket = process.env.AWS_BUCKET_NAME as string,
    ACL = "private",
    path = "general",
    files,
    useLarge
}: {
    storageApproach?: StorageEnum,
    Bucket?: string,
    ACL?: ObjectCannedACL,
    path?: string,
        files: Express.Multer.File[],
    useLarge?:boolean
}):Promise<string[]> => {
   
    let urls: string[] = [];

    if (useLarge) {
        urls = await Promise.all(files.map((file) => {
            return uploadLargeFile({
                storageApproach,
                Bucket,
                ACL,
                path,
                file
            });
        }));
    } else {
        urls = await Promise.all(files.map((file) => {
            return uploadFile({
                storageApproach,
                Bucket,
                ACL,
                path,
                file
            });
        })
        );
    }

        return urls;
}

export const preUploadSignedUrl = async ({ 
    Bucket = process.env.AWS_BUCKET_NAME as string,
    path = "general",
    originalname,
    ContentType,
    ExpiresIn=120
}: {
    Bucket?: string,
    path?: string,
        originalname: string,
        ContentType: string,
   ExpiresIn?:number
}): Promise<{ url: string, key: string }> => {
    
    const command = new PutObjectCommand({
        Bucket,
        Key: `${process.env.APPLICATION_NAME}/${path}/${nanoid()}_pre_${originalname}`,
        ContentType
    });
    const url = await getSignedUrl(s3Config(), command, { expiresIn: ExpiresIn });
    
    if (!url || !command?.input?.Key) {
        throw new BadRequestException("Fail to generate preSignedUrl");
    }
    return { url, key: command.input.Key };
}

export const getFile = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    Key
}: {
    Bucket?: string,
    Key: string
}) => {
    const command = new GetObjectCommand({
        Bucket,
        Key
    });
    return s3Config().send(command);
}

export const createPreSignedGetUrl = async({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    Key,
    ExpiresIn = 120,
    download=false
}: {
    Bucket?: string,
    Key?: string,
    ExpiresIn?: number,
    download?: boolean
}): Promise<string > => {
    
    const command = new GetObjectCommand({
        Bucket,
        Key,
        ResponseContentDisposition: download ? `attachments; filename="${Key?.split("/").pop()}"` : undefined
    });
    const url = await getSignedUrl(s3Config(), command, { expiresIn: ExpiresIn });
    
    if (!url ) {
        throw new BadRequestException("Fail to generate preSignedUrl");
    }
    return url;
}

export const deleteFile = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    Key
}: {
    Bucket?: string,
    Key?: string
}): Promise<DeleteObjectCommandOutput> => {
    const command = new DeleteObjectCommand({
        Bucket,
        Key
    });
    return await s3Config().send(command);
}

export const deleteFiles = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    urls = [],
    Quiet = false
}: {
    Bucket?: string,
    urls: string[],
    Quiet?: boolean
    
    }): Promise<DeleteObjectsCommandOutput> => {
    
    const Objects = urls.map(url => {
        return { Key: url };
    });
    const command = new DeleteObjectsCommand({
        Bucket,
        Delete: {
            Objects,
            Quiet
        }
    });
    return await s3Config().send(command);
}

export const listDirectoryFiles = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    path = "general"
}: {
    Bucket?: string,
    path: string
    
}): Promise<ListObjectsV2CommandOutput> => {
    const command = new ListObjectsV2Command({
        Bucket,
        Prefix: `${process.env.APPLICATION_NAME}/${path}`
    });
    return s3Config().send(command);
}

export const deleteFolderByPrefix = async({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    path="general",
    Quiet = false
}: {
    Bucket?: string,
    path: string,
    Quiet?: boolean
    
}):Promise<DeleteObjectsCommandOutput>=> {
         const files = await listDirectoryFiles({ Bucket,path});
        if (!files.Contents?.length) {
            throw new BadRequestException("Empty Directory");
        }
    const urls: string[] = files.Contents.map((file) => {
        return file.Key;
    }) as string[];
    return await deleteFiles({ Bucket, urls, Quiet });
}