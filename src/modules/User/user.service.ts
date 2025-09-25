import type { Request, Response } from "express";
import { IChangeRoleBodyDto, IChangeRoleParamsDto, IFreezeAccountParamsDto, IHardDeleteAccountParamsDto, ILogoutBodyDto, IRestoreAccountParamsDto, IShareProfileParamsDto, IUpdateBasicInfoBodyDto, IUpdateEmailBodyDto, IUpdatePasswordBodyDto } from "./user.dto";
import { RootFilterQuery, Types, UpdateQuery } from "mongoose";
import { BlockActionEnum, HUserDocument, IUser, RoleEnum, UserModel } from "../../DB/models/User.model";
import { createLoginCredentials, createRevokeToken, LogoutEnum } from "../../utils/Security/token.security";
import { FriendRequestRepository, PostRepository, UserRepository } from "../../DB/Repository";
import { JwtPayload } from "jsonwebtoken";
import { deleteFiles, deleteFolderByPrefix, preUploadSignedUrl, uploadFilesOrLargeFiles } from "../../utils/Multer/S3.config";
import { StorageEnum } from "../../utils/Multer/cloud.multer";
import { s3Event } from "../../utils/Events/S3.event";
import { BadRequestException, conflictException, forbiddenException, NotFoundException, unAuthorizedException } from "../../utils/Response/error.response";
import { successResponse } from "../../utils/Response/success.response";
import { ILoginResponse } from "../Authentication/auth.entities";
import { IProfileImageResponse, IUserResponse } from "./user.entities";
import { compareHash, generateHash } from "../../utils/Security/Hash.security";
import { emailEvent } from "../../utils/Events/email.event";
import { customAlphabet } from "nanoid";
import { generateEncryption } from "../../utils/Security/Encryption.security";
import { PostModel } from "../../DB/models/Post.model";
import { FriendRequestModel } from "../../DB/models/FriendRequest.model";




class UserService {
    private userModel = new UserRepository(UserModel);
    private postModel = new PostRepository(PostModel);
    private friendRequestModel = new FriendRequestRepository(FriendRequestModel);
   

    constructor() { }
    
    profile = async (req: Request, res: Response): Promise<Response> => {

        if (!req.user) {
            throw new unAuthorizedException("Missing user details");
        }

        const profile = await this.userModel.findOne({
            filter: {
                _id: req.user._id
            },
            options: {
                populate: [
                    {
                        path: "friends",
                        select: "firstName lastName email gender age"
                    }
                ]
            },
        });

        if (!profile) {
            throw new NotFoundException("Fail to find this user");
        }

        return successResponse<IUserResponse>({
            res, data: {
                user: profile
            }
        });
    }

    dashboard = async (req: Request, res: Response): Promise<Response> => {

        const result = await Promise.allSettled([
            this.userModel.find({
                filter: {}
            }),
            this.postModel.find({
                filter: {}
            }),
        ]);
        return successResponse({
            res, data: {
                result
            }
        });
    }

    changeRole = async (req: Request, res: Response): Promise<Response> => {

        const { userId } = req.params as IChangeRoleParamsDto;
        const { role } = req.body as IChangeRoleBodyDto;
        const denyRoles: RoleEnum[] = [role, RoleEnum.superAdmin];
        if (req.user?.role === RoleEnum.admin) {
            denyRoles.push(RoleEnum.admin);
        }

        const user = await this.userModel.findOneAndUpdate({
            filter: {
                _id: userId,
                role: {
                    $nin: denyRoles
                }
            },
            update: {
                role
            }
        });

        if (!user) {
            throw new NotFoundException("Fail to find matching result");
        }
        return successResponse({
            res
        });
    }

    shareProfile = async (req: Request, res: Response): Promise<Response> => {

        const { userId } = req.params as unknown as { userId: Types.ObjectId };


        const user = await this.userModel.findOne({
            filter: {
                _id: userId,
                confirmEmail: { $exists: true },
                deletedAt: { $exists: false },
            }
        });

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

        const posts = await this.postModel.updateMany({
            filter: {
                createdBy: userId || req.user?._id
            },
            update: {
                deletedAt: new Date(),
                deletedBy: req.user?._id,
            }
        });
        

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

        const posts = await this.userModel.deleteMany({
            filter: {
                createdBy: userId,
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

    updateBasicInfo = async (req: Request, res: Response): Promise<Response> => {
        const { userName, gender, age, role, phone }: IUpdateBasicInfoBodyDto = req.body;
       
        if (userName) {
            const [firstName, lastName] = req.body.userName.split(" ");
            req.body.firstName = firstName;
            req.body.lastName = lastName;
            delete req.body.userName;
        }

        const userExist = await this.userModel.findOne({
            filter: {
                _id: req.decoded?._id
            }
        });

        if (!userExist) {
            throw new NotFoundException("Account not found");
        }
        const user = await this.userModel.updateOne({
            filter: {
                _id: req.decoded?._id as Types.ObjectId,
                confirmEmail: { $exists: true },
                deletedAt: { $exists: false },
                deletedBy: { $exists: false }
            },
            update: {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                role,
                gender,
                age,
                phone: await generateEncryption({ plainText: phone })
            }
        });
        if (!user.matchedCount) {
            throw new BadRequestException("Fail to update your basic information");
        }
        return successResponse({ res, statusCode: 201, message: "Basic Info Updated" });
    }

    updatePassword = async (req: Request, res: Response): Promise<Response> => {
        const { oldPassword, newPassword }: IUpdatePasswordBodyDto = req.body;

        if (!await compareHash(oldPassword, req.user?.password as string)) {
            throw new BadRequestException("In-Valid Old Password");
        }

        const hashPass = await generateHash(newPassword);

        const user = await this.userModel.updateOne({
            filter: {
                _id: req.decoded?._id,
                confirmEmail: { $exists: true },
                deletedAt: { $exists: false },
                deletedBy: { $exists: false }
            },
            update: {
                password: hashPass
            }
        });

        if (!user) {
            throw new BadRequestException("Fail to update your password");
        }
        return successResponse({ res, message: "Password Updated" });
    }

    updateEmail = async (req: Request, res: Response): Promise<Response> => {
        const { oldEmail, newEmail, passwordOfOldEmail }: IUpdateEmailBodyDto = req.body;

        if (oldEmail !== req.user?.email) {
            throw new BadRequestException("In-valid Email");
        }

        if (!await compareHash(passwordOfOldEmail, req.user?.password)) {
            throw new BadRequestException("In-valid password ,please try again");
        }

        const emailExist = await this.userModel.findOne({
            filter: {
                email: newEmail
            }
        });
        if (emailExist) {
            throw new conflictException("Email Already Exist");
        }
        const otp = customAlphabet("0123456789", 6)();

        const user = await this.userModel.updateOne({
            filter: {
                _id: req.decoded?._id,
                confirmEmail: { $exists: true },
                deletedAt: { $exists: false },
                deletedBy: { $exists: false }
            },
            update: {
                email: newEmail,
                $unset: {
                    confirmEmail: 1
                },
                confirmEmailOtp: {
                    value: await generateHash(otp),
                    attempts: 0,
                    expiredAt: new Date(Date.now() + 2 * 60 * 1000)
                },
                changeCredentialsTime: new Date()
            }
        });

        if (!user.matchedCount) {
            throw new BadRequestException("Fail to update your Email");
        }

        emailEvent.emit("confirmEmail", { to: newEmail, otp, userEmail: newEmail });
        return successResponse({ res, message: "Email Updated" });
    }

    sendFriendRequest = async (req: Request, res: Response): Promise<Response> => {

        const { userId } = req.params as unknown as { userId: Types.ObjectId };
        
        if (req.user?.BlockList.includes(userId)) {
            throw new NotFoundException("You Blocked this user");
        }
        const FriendRequestExist = await this.friendRequestModel.findOne({
            filter: {
                createdBy: { $in: [req.user?._id, userId] },
                sendTo: { $in: [req.user?._id, userId] },
                AcceptedAt: { $exists: false },
            }
        });

        if (FriendRequestExist) {
            throw new conflictException("Friend Request Already Exist");
        }
        const user = await this.userModel.findOne({
            filter: {
                _id: userId,
                BlockList: { $nin: [req.user?._id] }

            }
        });
        if (!user) {
            throw new NotFoundException("User not Exist");
        }
       
        const [friendRequest] = (await this.friendRequestModel.create({

            data: [{
                createdBy: req.user?._id as Types.ObjectId,
                sendTo: userId,
            }]
        })) || [];

        if (!friendRequest) {
            throw new BadRequestException("Fail to sent friend request");
        }

        return successResponse({
            res,
            statusCode: 201
        });
    }

    acceptFriendRequest = async (req: Request, res: Response): Promise<Response> => {

        const { requestId } = req.params as unknown as { requestId: Types.ObjectId };
        const FriendRequestExist = await this.friendRequestModel.findOneAndUpdate({
            filter: {
                _id: requestId,
                AcceptedAt: { $exists: false },
                sendTo: req.user?._id
            },
            update: {
                AcceptedAt: new Date()
            }
        });


        if (!FriendRequestExist) {
            throw new conflictException("Fail to find matching result");
        }

        await Promise.all([
            await this.userModel.updateOne({
                filter: {
                    _id: FriendRequestExist.sendTo
                },
                update: {
                    $addToSet: {
                        friends: FriendRequestExist.createdBy
                    }
                }
            }),
            await this.userModel.updateOne({
                filter: {
                    _id: FriendRequestExist.createdBy
                },
                update: {
                    $addToSet: {
                        friends: FriendRequestExist.sendTo
                    }
                }
            })
        ]);
      
       
        return successResponse({
            res,
        });
    }

    deleteFriendRequest = async (req: Request, res: Response): Promise<Response> => {

        const { requestId } = req.params as unknown as { requestId: Types.ObjectId };

        const FriendRequestExist = await this.friendRequestModel.findOne({
            filter: {
                _id: requestId,
                AcceptedAt: { $exists: false },
                sendTo: req.user?._id
            }
        });


        if (!FriendRequestExist) {
            throw new conflictException("Fail to find matching result");
        }

        await this.friendRequestModel.deleteOne({
            filter: {
                _id: requestId,
                sendTo: req.user?._id
            }
        });
       
        return successResponse({
            res,
        });
    }

    unfriend = async (req: Request, res: Response): Promise<Response> => {

        const { userId } = req.params as unknown as { userId: Types.ObjectId };

        if (req.user?.BlockList.includes(userId)) {
            throw new NotFoundException("You Blocked this user");
        }


        await Promise.all([await this.userModel.updateOne({
            
            filter: {
                _id: userId,
                friends: {
                    $in: [req.user?._id]
                },
                  BlockList: { $nin: [req.user?._id] }
            },
            update: {
                $pull: {
                    friends: req.user?._id
                }
            }
        }),

        await this.userModel.updateOne({
            filter: {
                _id: req.user?._id,
                friends: {
                    $in: [userId]
                },
            },
            update: {
                $pull: {
                    friends: userId
                }
            }
        })
        ]);

        return successResponse({
            res,
        });
    }

    blockUser = async (req: Request, res: Response): Promise<Response> => {
        const { userId } = req.params as unknown as{ userId: Types.ObjectId };
        const { action } = req.query as unknown as { action: BlockActionEnum };

        let denyUsers = [RoleEnum.superAdmin, RoleEnum.admin];

        if (req.user?._id === userId) {
            throw new BadRequestException("You can't block yourself");
        }

        
        let filter: RootFilterQuery<IUser> = {
            _id: userId,
            role: {
                $nin: denyUsers.filter(role => req.user?.role === RoleEnum.admin)
            }
        };

        let update: UpdateQuery<HUserDocument> = {
            $pull: {
                friends: req.user?._id
            }
        };

        let filterUser: RootFilterQuery<IUser> = {
            _id: req.user?._id
        };

        let updateUser: UpdateQuery<HUserDocument> = {
            $addToSet: {
                BlockList: userId
            },
            $pull: {
                friends: userId
            }
        };


        if (action === BlockActionEnum.unblock) {

            filterUser = {
                _id: req.user?._id,
                $in: {
                    BlockList: userId
                }
            };
            updateUser = {
                $pull: {
                    BlockList: userId
                }
            };    
        }


        const user = await this.userModel.findOneAndUpdate({      
            filter,
            update
        });

        await this.userModel.updateOne({
            filter: filterUser,
            update: updateUser
        });

        if (!user) {
            throw new NotFoundException("Fail to find matching result");
        }
       
       
        return successResponse({
            res,
        });
    }

}


export default new UserService;

