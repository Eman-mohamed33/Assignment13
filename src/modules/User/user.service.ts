import type { Request, Response } from "express";
import { IFreezeAccountParamsDto, IHardDeleteAccountParamsDto, ILogoutBodyDto, IRestoreAccountParamsDto, IShareProfileParamsDto } from "./user.dto";
import { Types, UpdateQuery } from "mongoose";
import { HUserDocument, IUser, RoleEnum, UserModel } from "../../DB/models/User.model";
import { createLoginCredentials, createRevokeToken, LogoutEnum } from "../../utils/Security/token.security";
import { UserRepository } from "../../DB/Repository/User.repository";
import { JwtPayload } from "jsonwebtoken";
import { deleteFiles, deleteFolderByPrefix, preUploadSignedUrl, uploadFilesOrLargeFiles } from "../../utils/Multer/S3.config";
import { StorageEnum } from "../../utils/Multer/cloud.multer";
import { s3Event } from "../../utils/Events/S3.event";
import { BadRequestException, forbiddenException, NotFoundException, unAuthorizedException } from "../../utils/Response/error.response";
import { successResponse } from "../../utils/Response/success.response";
import { ILoginResponse } from "../Authentication/auth.entities";
import { IProfileImageResponse, IUserResponse } from "./user.entities";




class UserService {
    private userModel = new UserRepository(UserModel);
   

    constructor() { }
    
    profile = async (req: Request, res: Response): Promise<Response> => {
  if (!req.user) {
      throw new unAuthorizedException("Missing user details");
  }
        return successResponse<IUserResponse>({
            res, data: {
                user: req.user
            }
        });
    }

    shareProfile = async (req: Request, res: Response): Promise<Response> => {
        const { userId }: IShareProfileParamsDto = req.params as IShareProfileParamsDto;
        const user = await this.userModel.findOne({
            filter: {
                _id: userId,
                confirmEmail: { $exists: true },
                deletedAt: { $exists: false }
            }
        })
        if (!user) {
            throw new NotFoundException("Invalid user account");
        }
        return successResponse<IUserResponse>({ res, data: { user } });
    }
     
    logout = async (req: Request, res: Response): Promise<Response> => {
        const { flag }: ILogoutBodyDto = req.body;
        let statusCode = 200;
        const update: UpdateQuery<IUser> = {};

        switch (flag) {
            case LogoutEnum.all:
                update.changeCredentialsTime = new Date();
                break;
         
            default:
                await createRevokeToken(req.decoded as JwtPayload);
                statusCode = 201;
                break;
        }

        const user = await this.userModel.updateOne({
            filter: { _id: req.decoded?._id },
            update
        });
        if (!user) {
            throw new BadRequestException("Fail to Logout");
        }
        return successResponse({ res, statusCode });
    }

    refreshToken = async (req: Request, res: Response): Promise<Response> => {
        const credentials = await createLoginCredentials(req.user as HUserDocument);
        await createRevokeToken(req.decoded as JwtPayload);

        return successResponse<ILoginResponse>({ res, statusCode: 201, data: { credentials } });

    }

//     profilePhoto = async (req: Request, res: Response): Promise<Response> => {
//        const key= await uploadLargeFile({
//             path: `users/${req.decoded?._id}`,
//             file:req.file as Express.Multer.File
// })

//         return res.json({
//             message: "Done", date: {
//                 key
//             }
//         });
    //     }
    
    profilePhoto = async (req: Request, res: Response): Promise<Response> => {
        const { originalname, ContentType }: { originalname: string, ContentType: string } = req.body;
        const { url, key } = await preUploadSignedUrl({ originalname, ContentType, path: `users/${req.decoded?._id}` });
        const user = await this.userModel.findByIdAndUpdate({
            id: req.user?._id as Types.ObjectId,
            update: {
                profileImage: key,
                tempOldProfileImage: req.user?.profileImage
            }
            
        });

        if (!user) {
            throw new BadRequestException("Fail to upload profile Image");
        }
        s3Event.emit("trackProfileImageUpload", {
            id: req.user?._id,
           // expiresIn: 3000,
            oldKey: req.user?.profileImage,
            Key: key
        });
        return successResponse<IProfileImageResponse>({ res, data: { url } });
    }


    profileCoverPhotos = async (req: Request, res: Response): Promise<Response> => {
        const urls = await uploadFilesOrLargeFiles({
            storageApproach: StorageEnum.disk,
            path: `users/${req.decoded?._id}/cover`,
            files: req.files as Express.Multer.File[]
        });

        const user = await this.userModel.findByIdAndUpdate({
            id: req.user?._id as Types.ObjectId,
            update: {
                profileCoverImages: urls
            }
        });
        if (!user) {
            throw new BadRequestException("Fail to upload profile cover Images");
        }

        if (req.user?.profileCoverImages) {
            await deleteFiles({ urls: req.user.profileCoverImages });
        }

        return successResponse<IUserResponse>({ res, data: { user } });
       
    }


    freezeAccount = async (req: Request, res: Response): Promise<Response> => {
        const { userId }: IFreezeAccountParamsDto = req.params || {};
        
        if (userId && req.user?.role !== RoleEnum.admin) {
            throw new forbiddenException("Not authorized user");
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
        })

        if (!user.matchedCount) {
            throw new NotFoundException("User not found and Fail to delete this account");
        }

        return successResponse({ res });
    }

    restoreAccount = async (req: Request, res: Response): Promise<Response> => {
        const { userId }: IRestoreAccountParamsDto = req.params as IRestoreAccountParamsDto;
        

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
            throw new NotFoundException("User not found and Fail to restore this account");
        }

        return successResponse({ res });
    }

    hardDelete = async (req: Request, res: Response): Promise<Response> => {
        const { userId }: IHardDeleteAccountParamsDto = req.params as IHardDeleteAccountParamsDto;
        

        const user = await this.userModel.deleteOne({
            filter: {
                _id: userId,
                deletedAt: { $exists: true },
                deletedBy: { $exists: true },  
            }
        });

        if (!user.deletedCount) {
            throw new NotFoundException("User not found or Fail to hard Delete this account");
        }

        await deleteFolderByPrefix({ path: `users/${userId}` });

        return successResponse({ res });
    }
}


export default new UserService;

