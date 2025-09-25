"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Event = void 0;
const node_events_1 = require("node:events");
const Repository_1 = require("../../DB/Repository");
const User_model_1 = require("../../DB/models/User.model");
const S3_config_1 = require("../Multer/S3.config");
exports.s3Event = new node_events_1.EventEmitter();
exports.s3Event.on("trackProfileImageUpload", (data) => {
    const userModel = new Repository_1.UserRepository(User_model_1.UserModel);
    console.log(data);
    setTimeout(async () => {
        try {
            await (0, S3_config_1.getFile)({ Key: data.Key });
            await userModel.updateOne({
                filter: { _id: data.id },
                update: {
                    $unset: { tempOldProfileImage: 1 }
                }
            });
            await (0, S3_config_1.deleteFile)({ Key: data.oldKey });
            console.log("Done ✔");
        }
        catch (error) {
            console.log(error);
            if (error.Code === "NoSuchKey") {
                let unsetData = { tempOldProfileImage: 1 };
                if (!data.oldKey) {
                    unsetData = { tempOldProfileImage: 1, profileImage: 1 };
                }
                await userModel.updateOne({
                    filter: { _id: data.id },
                    update: {
                        profileImage: data.oldKey,
                        $unset: unsetData
                    }
                });
            }
        }
    }, data.expiresIn || Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN_SECONDS) * 1000);
});
