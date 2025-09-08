import multer, { FileFilterCallback } from "multer";
import { nanoid } from "nanoid";
import type { Request } from "express";
import os from "node:os";
import { BadRequestException } from "../Response/error.response";



export enum StorageEnum {
    memory = "memory",
    disk = "disk"
}

export const fileValidation = {
    image: ["image/jpeg", "image/gif", "image/png", "image/tiff", "image/vnd.wap.wbmp", "image/x-ms-bmp", 'application/octet-stream']
};

export const cloudFileUpload = ({ storageApproach = StorageEnum.memory, maximumSize = 2, validation = [] }: { storageApproach?: StorageEnum, maximumSize?: number, validation?: string[] }): multer.Multer => {
    console.log(os.tmpdir());
   
    const storage = storageApproach === StorageEnum.memory ? multer.memoryStorage() : multer.diskStorage({
        destination: os.tmpdir(),
        filename: function (req: Request, file: Express.Multer.File, callback) {
            callback(null, `${nanoid()}_${file.originalname}`);
        },
    });

    function fileFilter(req:Request,file:Express.Multer.File,callback:FileFilterCallback) {
        if (!validation.includes(file.mimetype)) {
            callback(new BadRequestException("Validation Error", {
                key: "file", issues: {
                    path: "file",
                    message:"Invalid file format"
            }}));
        }
        callback(null, true);
    }
    return multer({
         fileFilter,
        storage,
        limits: {
            fieldSize: maximumSize * 1024 * 1024
        },
       
    });

}
