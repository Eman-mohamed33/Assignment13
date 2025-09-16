import { Request, Response } from "express";
import { successResponse } from "../../utils/Response/success.response";
import { PostRepository, UserRepository } from "../../DB/Repository";
import { UserModel } from "../../DB/models/User.model";
import { HPostDocument, LikeActionEnum, PostModel } from "../../DB/models/Post.model";
import { Types, UpdateQuery } from "mongoose";
import { deleteFiles, uploadFilesOrLargeFiles } from "../../utils/Multer/S3.config";
import { BadRequestException, NotFoundException } from "../../utils/Response/error.response";
import { nanoid } from "nanoid";
import { IActionPostQueryDto, IPostLikeParamsDto } from "./post.dto";

class PostService{
    private userModel = new UserRepository(UserModel);
    private postModel = new PostRepository(PostModel);
    constructor() { }
    
    createPost = async (req: Request, res: Response): Promise<Response> => {
       
        if (req.body.tags &&
            (await this.userModel.find({
                filter: {
                    _id: { $in: req.body.tags }
                }
            })).length !==
            req.body.tags.length
        ) {
            throw new NotFoundException("Some of mentioned users are not exist");
        }
       
        
        let attachments: string[] = []; 
        const assetsFolderId = nanoid();

        if (req.files?.length) {
            attachments = await uploadFilesOrLargeFiles({ files: req.files as Express.Multer.File[], path: `user/${req.decoded?._id}/post/${assetsFolderId}` });
      
        }

        const [post] = await this.postModel.create({
            data: [
                {
                    ...req.body,
                    attachments,
                    createdBy: req.user?._id as Types.ObjectId,
                   assetsFolderId
                }
            ]
        }) || [];

        if (!post) {
            if (attachments.length) {
                await deleteFiles({ urls: attachments });
            }
            throw new BadRequestException("Fail to create this post");
        }
        return successResponse({ res, statusCode: 201, message: "Created Post Successfully" });
    }

    likePost = async (req: Request, res: Response): Promise<Response> => {
        const { postId } = req.params as IPostLikeParamsDto;
        const { action } = req.query as IActionPostQueryDto;

        let update :UpdateQuery<HPostDocument>= {
            $addToSet: { likes: req.user?._id }
        };

        if (action === LikeActionEnum.unlike) {
            update = {
                $pull: { likes: req.user?._id }
            };
        }

        const post = await this.postModel.findOneAndUpdate({
            filter: {
                _id: postId,
            },
            update
        });

        if (!post) {
            throw new NotFoundException("Post not exist or In-valid postId");
        }

        
        return successResponse({ res });
    }
}

export default new PostService();
