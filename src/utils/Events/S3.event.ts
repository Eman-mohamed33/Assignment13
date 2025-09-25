import { EventEmitter } from "node:events";
import { UserRepository } from "../../DB/Repository";
import { HUserDocument, UserModel } from "../../DB/models/User.model";
import { deleteFile, getFile } from "../Multer/S3.config";
import { UpdateQuery } from "mongoose";



export const s3Event = new EventEmitter();

s3Event.on("trackProfileImageUpload",  (data) => {
    const userModel = new UserRepository(UserModel);
    console.log(data);
    setTimeout(async () => {
        try {
            await getFile({ Key: data.Key });
            await userModel.updateOne({
                filter: { _id: data.id },
                update: {
                    $unset: { tempOldProfileImage: 1 }
                }
            })
            await deleteFile({ Key: data.oldKey });
            console.log("Done ✔");
            
        } catch (error: any) {
            console.log(error);
            if (error.Code === "NoSuchKey") {

                let unsetData: UpdateQuery<HUserDocument> = { tempOldProfileImage: 1 };
                if (!data.oldKey) {
                    unsetData = { tempOldProfileImage: 1, profileImage: 1 }
                }
                await userModel.updateOne({
                    filter: { _id: data.id },
                    update: {
                        profileImage: data.oldKey,
                        $unset: unsetData
                    }
                })
            }
        }
    }, data.expiresIn || Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN_SECONDS) * 1000);
})