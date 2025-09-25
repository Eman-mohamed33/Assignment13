import { Request, Response } from "express";
import { successResponse } from "../../utils/Response/success.response";
import { CommentRepository, PostRepository, UserRepository } from "../../DB/Repository";
import { CommentModel } from "../../DB/models/Comment.model";
import { UserModel } from "../../DB/models/User.model";
import { AllowCommentsEnum, HPostDocument, PostModel } from "../../DB/models/Post.model";
import { BadRequestException, NotFoundException } from "../../utils/Response/error.response";
import { postAvailability } from "../Post/post.service";
import { deleteFiles, uploadFilesOrLargeFiles } from "../../utils/Multer/S3.config";
import { ICreateCommentParamsDto, IReplyOnCommentParamsDto } from "./comment.dto";
import { Types } from "mongoose";

class CommentService {
    private commentModel = new CommentRepository(CommentModel);
    private userModel = new UserRepository(UserModel);
    private postModel = new PostRepository(PostModel);

    constructor() { }
    createComment = async (req: Request, res: Response): Promise<Response> => {

        const { postId } = req.params as unknown as ICreateCommentParamsDto;

        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                allowComments: AllowCommentsEnum.allow,
                $or: postAvailability(req),
                  createdBy: { $nin: req.user?.BlockList || [] }
            }
        });

        if (!post || !(await this.userModel.findOne({
            filter: {
                _id: post?.createdBy,
                BlockList: { $nin: [req.user?._id] }
            }
        }))) {
            throw new NotFoundException("Post not exist or In-valid postId");
        }

        if (req.body.tags &&
            (await this.userModel.find({
                filter: {
                    _id: { $in: req.body.tags, $ne: req.user?._id }
                }
            })).length !==
            req.body.tags.length
        ) {
            throw new NotFoundException("Some of mentioned users are not exist");
        }
               
                
        let attachments: string[] = [];
                
        
        if (req.files?.length) {
            attachments = await uploadFilesOrLargeFiles({
                files: req.files as Express.Multer.File[],
                path: `user/${post.createdBy}/post/${post.assetsFolderId}/comment`
            });
              
        }

        const [comment] = (await this.commentModel.create({
            data: [{
                ...req.body,
                createdBy: req.user?._id,
                postId
            }]
        })) || [];


        if (!comment) {
            if (attachments.length) {
                await deleteFiles({ urls: attachments });
            }
            throw new BadRequestException("Fail To Create this Comment");
        }
        return successResponse({ res, statusCode: 201 });
    }

    replayOnComment = async (req: Request, res: Response): Promise<Response> => {

        const { postId, commentId } = req.params as unknown as IReplyOnCommentParamsDto;

        const comment = await this.commentModel.findOne({
            filter: {
                _id: commentId,
                postId,
            },
            options: {
                populate: [
                    {
                        path: "postId",
                        match: {
                            allowComments: AllowCommentsEnum.allow,
                            $or: postAvailability(req),
                            createdBy: { $nin: req.user?.BlockList || [] }
                        }
                    }
                    
                ]
            }
        });

        if (!comment?.postId) {
            throw new NotFoundException("Post Not Exist Or Deleted");
        }

        if (req.body.tags &&
            (await this.userModel.find({
                filter: {
                    _id: { $in: req.body.tags, $ne: req.user?._id }
                }
            })).length !==
            req.body.tags.length
        ) {
            throw new NotFoundException("Some of mentioned users are not exist");
        }
               
                
        let attachments: string[] = [];
                
        
        if (req.files?.length) {
            let post = comment.postId as Partial<HPostDocument>;
            attachments = await uploadFilesOrLargeFiles({
                files: req.files as Express.Multer.File[],
                path: `user/${post.createdBy}/post/${post.assetsFolderId}/comment`
            });
              
        }

        const [reply] = (await this.commentModel.create({
            data: [{
                ...req.body,
                createdBy: req.user?._id,
                postId,
                commentId
            }]
        })) || [];


        if (!reply) {
            if (attachments.length) {
                await deleteFiles({ urls: attachments });
            }
            throw new BadRequestException("Fail To Reply on this Comment");
        }
        return successResponse({ res, statusCode: 201 });
    }

    getCommentById = async (req: Request, res: Response): Promise<Response> => {
        const { postId, commentId } = req.params as unknown as { postId: Types.ObjectId, commentId: Types.ObjectId };
       
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                $or: postAvailability(req),
                createdBy: { $nin: req.user?.BlockList || [] }
            }
        });


        if (!post || !(await this.userModel.findOne({
            filter: {
                _id: post?.createdBy,
                BlockList: { $nin: [req.user?._id] }
            }
        }))) {
            throw new NotFoundException("Post not exist or In-valid postId");
        }
        const comment = await this.commentModel.findById({
            id: commentId
        });
        
        if (!comment) {
            throw new NotFoundException("Comment not exists");
        }
        return successResponse({
            res, data: {
                comment
            }
        });
    }

    updateComment = async (req: Request, res: Response): Promise<Response> => {
     
        const { postId, commentId } = req.params as unknown as { postId: Types.ObjectId, commentId: Types.ObjectId };

        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                $or: postAvailability(req),
                createdBy: { $nin: req.user?.BlockList || [] }
            }
        });

        if (!post || !(await this.userModel.findOne({
            filter: {
                _id: post?.createdBy,
                BlockList: { $nin: [req.user?._id] }
            }
        }))) {
            throw new NotFoundException("Post not exist or In-valid postId");
        }

        if (req.body.tags &&  (await this.userModel.find({
                filter: {
                    _id: { $in: req.body.tags, $ne: req.user?._id }
                }
            })).length !==
            req.body.tags.length
        ) {
            throw new NotFoundException("Some of mentioned users are not exist");
        }
       
        
        let attachments: string[] = [];
       
        if (req.files?.length) {
            attachments = await uploadFilesOrLargeFiles({
                files: req.files as Express.Multer.File[],
                path: `user/${req.user?._id}/post/${post.assetsFolderId}/comment`
            });
        }


        const updatedComment = await this.commentModel.updateOne({
            filter: {
                _id: commentId,
                createdBy: req.user?._id
            },
            update: [
                {
                    $set: {
                      content: req.body.content,
                        attachments: {
                            $setUnion: [
                                { $setDifference: ["$attachments", req.body.removedAttachments || []] },
                                attachments
                            ]
                        },
                        tags: {
                            $setUnion: [
                                {
                                    $setDifference: ["$tags",
                                        (req.body.removedTags || []).map((tag: string) => {
                                            return Types.ObjectId.createFromHexString(tag);
                                        })]
                                },
                                (req.body.tags || []).map((tag: string) => {
                                    return Types.ObjectId.createFromHexString(tag);
                                }),
                            ]
                        }
                    }
                }],
        });
        
        console.log(updatedComment);


        if (!updatedComment) {
            if (attachments.length) {
                await deleteFiles({ urls: attachments });
            }
            throw new BadRequestException("Fail to update this comment");
        } else {
            if (req.body.removedAttachments?.length) {
                await deleteFiles({ urls: req.body.removedAttachments });
            }
        }
        return successResponse({ res, message: "Updated comment Successfully" });
    }

    freezeComment = async (req: Request, res: Response): Promise<Response> => {

        const { postId, commentId } = req.params as unknown as { postId: Types.ObjectId, commentId: Types.ObjectId };
        
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                $or: postAvailability(req),
                createdBy: { $nin: req.user?.BlockList || [] }
            }
        });

        if (!post || !(await this.userModel.findOne({
            filter: {
                _id: post?.createdBy,
                BlockList: { $nin: [req.user?._id] }
            }
        }))) {
            throw new NotFoundException("Post not exist or In-valid postId");
        }

        const result = await Promise.all([
            await this.commentModel.findOneAndUpdate({
                filter: {
                    _id: commentId,
                    createdBy: req.user?._id
                },
                update: {
                    deletedBy: req.user?._id,
                    deletedAt: new Date()
                }
            }),

            await this.commentModel.updateMany({
                filter: {
                    commentId
                },
                update: {
                    deletedBy: req.user?._id,
                    deletedAt: new Date()
                }
            })
        ]);

        if (!result) {
            throw new BadRequestException("Fail to delete this comment");
        }
        return successResponse({ res });
    }

    deleteComment = async (req: Request, res: Response): Promise<Response> => {

        const { commentId } = req.params as unknown as { commentId: Types.ObjectId };

        const comment = await this.commentModel.findOne({
            filter: {
                _id: commentId,
                deletedAt: { $exists: true },
                deletedBy: { $exists: true }
                ,
                paranoid: false
            }
        });
        console.log(comment);
        

        if (!comment) {
            throw new NotFoundException("fail to find matching result");
        }

        await Promise.all([
            await this.commentModel.deleteOne({
                filter: {
                    _id: commentId
                }
            }),

            await this.commentModel.deleteMany({
                filter: {
                    commentId
                }
            })
        ]);

        

        return successResponse({ res, message: "Deleted comment Successfully" });
    }


    getCommentWithReply = async (req: Request, res: Response): Promise<Response> => {

        const { postId, commentId } = req.params as unknown as { postId: Types.ObjectId, commentId: Types.ObjectId };

        
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                $or: postAvailability(req),
                createdBy: { $nin: req.user?.BlockList || [] }
            }
        });


        if (!post || !(await this.userModel.findOne({
            filter: {
                _id: post?.createdBy,
                BlockList: { $nin: [req.user?._id] }
            }
        }))) {
            throw new NotFoundException("Post not exist or In-valid postId");
        }
        const comment = await this.commentModel.findOne({
            filter: {
                _id: commentId,
                
               
            },
            options: {
                populate: [
                    {
                        path: "reply",
                        match: {
                            commentId,
                            deletedAt: { $exists: false }
                        },
                        populate: [
                            {
                                path: "reply",
                                match: {
                                    commentId,
                                    deletedAt: { $exists: false }
                                }
                            }
                        ]
                    }
                ]
            }
        });


        
        return successResponse({
            res, data: {
                comment
            }
        });
    }


}

export default new CommentService();


