"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const success_response_1 = require("../../utils/Response/success.response");
const Repository_1 = require("../../DB/Repository");
const Comment_model_1 = require("../../DB/models/Comment.model");
const User_model_1 = require("../../DB/models/User.model");
const Post_model_1 = require("../../DB/models/Post.model");
const error_response_1 = require("../../utils/Response/error.response");
const post_service_1 = require("../Post/post.service");
const S3_config_1 = require("../../utils/Multer/S3.config");
const mongoose_1 = require("mongoose");
class CommentService {
    commentModel = new Repository_1.CommentRepository(Comment_model_1.CommentModel);
    userModel = new Repository_1.UserRepository(User_model_1.UserModel);
    postModel = new Repository_1.PostRepository(Post_model_1.PostModel);
    constructor() { }
    createComment = async (req, res) => {
        const { postId } = req.params;
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                allowComments: Post_model_1.AllowCommentsEnum.allow,
                $or: (0, post_service_1.postAvailability)(req),
                createdBy: { $nin: req.user?.BlockList || [] }
            }
        });
        if (!post || !(await this.userModel.findOne({
            filter: {
                _id: post?.createdBy,
                BlockList: { $nin: [req.user?._id] }
            }
        }))) {
            throw new error_response_1.NotFoundException("Post not exist or In-valid postId");
        }
        if (req.body.tags &&
            (await this.userModel.find({
                filter: {
                    _id: { $in: req.body.tags, $ne: req.user?._id }
                }
            })).length !==
                req.body.tags.length) {
            throw new error_response_1.NotFoundException("Some of mentioned users are not exist");
        }
        let attachments = [];
        if (req.files?.length) {
            attachments = await (0, S3_config_1.uploadFilesOrLargeFiles)({
                files: req.files,
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
                await (0, S3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequestException("Fail To Create this Comment");
        }
        return (0, success_response_1.successResponse)({ res, statusCode: 201 });
    };
    replayOnComment = async (req, res) => {
        const { postId, commentId } = req.params;
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
                            allowComments: Post_model_1.AllowCommentsEnum.allow,
                            $or: (0, post_service_1.postAvailability)(req),
                            createdBy: { $nin: req.user?.BlockList || [] }
                        }
                    }
                ]
            }
        });
        if (!comment?.postId) {
            throw new error_response_1.NotFoundException("Post Not Exist Or Deleted");
        }
        if (req.body.tags &&
            (await this.userModel.find({
                filter: {
                    _id: { $in: req.body.tags, $ne: req.user?._id }
                }
            })).length !==
                req.body.tags.length) {
            throw new error_response_1.NotFoundException("Some of mentioned users are not exist");
        }
        let attachments = [];
        if (req.files?.length) {
            let post = comment.postId;
            attachments = await (0, S3_config_1.uploadFilesOrLargeFiles)({
                files: req.files,
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
                await (0, S3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequestException("Fail To Reply on this Comment");
        }
        return (0, success_response_1.successResponse)({ res, statusCode: 201 });
    };
    getCommentById = async (req, res) => {
        const { postId, commentId } = req.params;
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                $or: (0, post_service_1.postAvailability)(req),
                createdBy: { $nin: req.user?.BlockList || [] }
            }
        });
        if (!post || !(await this.userModel.findOne({
            filter: {
                _id: post?.createdBy,
                BlockList: { $nin: [req.user?._id] }
            }
        }))) {
            throw new error_response_1.NotFoundException("Post not exist or In-valid postId");
        }
        const comment = await this.commentModel.findById({
            id: commentId
        });
        if (!comment) {
            throw new error_response_1.NotFoundException("Comment not exists");
        }
        return (0, success_response_1.successResponse)({
            res, data: {
                comment
            }
        });
    };
    updateComment = async (req, res) => {
        const { postId, commentId } = req.params;
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                $or: (0, post_service_1.postAvailability)(req),
                createdBy: { $nin: req.user?.BlockList || [] }
            }
        });
        if (!post || !(await this.userModel.findOne({
            filter: {
                _id: post?.createdBy,
                BlockList: { $nin: [req.user?._id] }
            }
        }))) {
            throw new error_response_1.NotFoundException("Post not exist or In-valid postId");
        }
        if (req.body.tags && (await this.userModel.find({
            filter: {
                _id: { $in: req.body.tags, $ne: req.user?._id }
            }
        })).length !==
            req.body.tags.length) {
            throw new error_response_1.NotFoundException("Some of mentioned users are not exist");
        }
        let attachments = [];
        if (req.files?.length) {
            attachments = await (0, S3_config_1.uploadFilesOrLargeFiles)({
                files: req.files,
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
                                        (req.body.removedTags || []).map((tag) => {
                                            return mongoose_1.Types.ObjectId.createFromHexString(tag);
                                        })]
                                },
                                (req.body.tags || []).map((tag) => {
                                    return mongoose_1.Types.ObjectId.createFromHexString(tag);
                                }),
                            ]
                        }
                    }
                }
            ],
        });
        console.log(updatedComment);
        if (!updatedComment) {
            if (attachments.length) {
                await (0, S3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequestException("Fail to update this comment");
        }
        else {
            if (req.body.removedAttachments?.length) {
                await (0, S3_config_1.deleteFiles)({ urls: req.body.removedAttachments });
            }
        }
        return (0, success_response_1.successResponse)({ res, message: "Updated comment Successfully" });
    };
    freezeComment = async (req, res) => {
        const { postId, commentId } = req.params;
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                $or: (0, post_service_1.postAvailability)(req),
                createdBy: { $nin: req.user?.BlockList || [] }
            }
        });
        if (!post || !(await this.userModel.findOne({
            filter: {
                _id: post?.createdBy,
                BlockList: { $nin: [req.user?._id] }
            }
        }))) {
            throw new error_response_1.NotFoundException("Post not exist or In-valid postId");
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
            throw new error_response_1.BadRequestException("Fail to delete this comment");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    deleteComment = async (req, res) => {
        const { commentId } = req.params;
        const comment = await this.commentModel.findOne({
            filter: {
                _id: commentId,
                deletedAt: { $exists: true },
                deletedBy: { $exists: true },
                paranoid: false
            }
        });
        console.log(comment);
        if (!comment) {
            throw new error_response_1.NotFoundException("fail to find matching result");
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
        return (0, success_response_1.successResponse)({ res, message: "Deleted comment Successfully" });
    };
    getCommentWithReply = async (req, res) => {
        const { postId, commentId } = req.params;
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                $or: (0, post_service_1.postAvailability)(req),
                createdBy: { $nin: req.user?.BlockList || [] }
            }
        });
        if (!post || !(await this.userModel.findOne({
            filter: {
                _id: post?.createdBy,
                BlockList: { $nin: [req.user?._id] }
            }
        }))) {
            throw new error_response_1.NotFoundException("Post not exist or In-valid postId");
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
        return (0, success_response_1.successResponse)({
            res, data: {
                comment
            }
        });
    };
}
exports.default = new CommentService();
