"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postService = void 0;
exports.postAvailability = postAvailability;
const success_response_1 = require("../../utils/Response/success.response");
const Repository_1 = require("../../DB/Repository");
const User_model_1 = require("../../DB/models/User.model");
const Post_model_1 = require("../../DB/models/Post.model");
const mongoose_1 = require("mongoose");
const S3_config_1 = require("../../utils/Multer/S3.config");
const error_response_1 = require("../../utils/Response/error.response");
const nanoid_1 = require("nanoid");
const Comment_model_1 = require("../../DB/models/Comment.model");
const Gateway_1 = require("../Gateway");
function postAvailability(req) {
    return [
        { availability: Post_model_1.AvailabilityEnum.pubic },
        { availability: Post_model_1.AvailabilityEnum.onlyMe, createdBy: req.user?._id },
        { availability: Post_model_1.AvailabilityEnum.friends, createdBy: { $in: [...(req.user?.friends || []), req.user?._id] } },
        {
            availability: { $ne: Post_model_1.AvailabilityEnum.onlyMe },
            tags: { $in: req.user?._id }
        },
        {
            availability: Post_model_1.AvailabilityEnum.friendsExcept,
            Except: {
                $nin: [req.user?._id]
            },
        },
        {
            availability: Post_model_1.AvailabilityEnum.specificFriends,
            $or: [
                {
                    Only: {
                        $in: [req.user?._id]
                    }
                },
                { createdBy: req.user?._id }
            ]
        }
    ];
}
function isAvailability(post, req) {
    const case1 = (post?.availability === Post_model_1.AvailabilityEnum.onlyMe && String(post.createdBy) !== String(req.user?._id));
    console.log(case1);
    const case2 = (post?.availability === Post_model_1.AvailabilityEnum.friends && !req.user?.friends?.includes(post.createdBy));
    console.log(case2);
    const case3 = (post?.availability === Post_model_1.AvailabilityEnum.friendsExcept && post.Except.includes(req.user?._id));
    console.log(case3);
    const case4 = (post?.availability === Post_model_1.AvailabilityEnum.specificFriends && !post.Only.includes(req.user?._id));
    console.log(case4);
    return case1 || case2 || case3 || case4 || req.user?.BlockList.includes(post.createdBy) ? true : false;
}
class PostService {
    userModel = new Repository_1.UserRepository(User_model_1.UserModel);
    postModel = new Repository_1.PostRepository(Post_model_1.PostModel);
    commentModel = new Repository_1.CommentRepository(Comment_model_1.CommentModel);
    constructor() { }
    createPost = async (req, res) => {
        if (req.body.tags &&
            (await this.userModel.find({
                filter: {
                    _id: { $in: req.body.tags, $ne: req.user?._id },
                    BlockList: { $nin: req.user?._id }
                }
            })).length !==
                req.body.tags.length
            || req.body.tags?.some((tag) => req.user?.BlockList.includes(tag))) {
            throw new error_response_1.NotFoundException("Some of mentioned users are not exist");
        }
        let attachments = [];
        const assetsFolderId = (0, nanoid_1.nanoid)();
        if (req.files?.length) {
            attachments = await (0, S3_config_1.uploadFilesOrLargeFiles)({
                files: req.files,
                path: `user/${req.decoded?._id}/post/${assetsFolderId}`
            });
        }
        const [post] = await this.postModel.create({
            data: [
                {
                    ...req.body,
                    attachments,
                    createdBy: req.user?._id,
                    assetsFolderId
                }
            ]
        }) || [];
        if (!post) {
            if (attachments.length) {
                await (0, S3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequestException("Fail to create this post");
        }
        return (0, success_response_1.successResponse)({ res, statusCode: 201, message: "Created Post Successfully" });
    };
    likePost = async (req, res) => {
        const { postId } = req.params;
        const { action } = req.query;
        let update = {
            $addToSet: { likes: req.user?._id }
        };
        if (action === Post_model_1.LikeActionEnum.unlike) {
            update = {
                $pull: { likes: req.user?._id }
            };
        }
        const post = await this.postModel.findOneAndUpdate({
            filter: {
                _id: postId,
                $or: postAvailability(req),
                createdBy: { $nin: req.user?.BlockList || [] }
            },
            update
        });
        if (!post || !(await this.userModel.findOne({
            filter: {
                _id: post?.createdBy,
                BlockList: { $nin: [req.user?._id] }
            }
        }))) {
            throw new error_response_1.NotFoundException("Post not exist or In-valid postId");
        }
        if (action !== Post_model_1.LikeActionEnum.unlike) {
            (0, Gateway_1.getIo)().to(Gateway_1.connectedSockets.get(post.createdBy.toString())).emit("likePost", {
                postId,
                userId: req.user?._id
            });
        }
        return (0, success_response_1.successResponse)({ res });
    };
    updatePost = async (req, res) => {
        const { postId } = req.params;
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                createdBy: req.user?._id
            }
        });
        if (!post) {
            throw new error_response_1.NotFoundException("");
        }
        if (req.body.tags &&
            (await this.userModel.find({
                filter: {
                    _id: { $in: req.body.tags, $ne: req.user?._id },
                    BlockList: { $nin: req.user?._id }
                }
            })).length !==
                req.body.tags.length
            || req.body.tags?.some((tag) => req.user?.BlockList.includes(tag))) {
            throw new error_response_1.NotFoundException("Some of mentioned users are not exist");
        }
        let attachments = [];
        if (req.files?.length) {
            attachments = await (0, S3_config_1.uploadFilesOrLargeFiles)({ files: req.files, path: `user/${req.user?._id}/post/${post.assetsFolderId}` });
        }
        const updatedPost = await this.postModel.updateOne({
            filter: {
                _id: postId
            },
            update: [
                {
                    $set: {
                        content: req.body.content,
                        allowComments: req.body.allowComments || [],
                        availability: req.body.availability || [],
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
            ]
        });
        if (!updatedPost.matchedCount) {
            if (attachments.length) {
                await (0, S3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequestException("Fail to create this post");
        }
        else {
            if (req.body.removedAttachments?.length) {
                await (0, S3_config_1.deleteFiles)({ urls: req.body.removedAttachments });
            }
        }
        return (0, success_response_1.successResponse)({ res, message: "Updated Post Successfully" });
    };
    postsList = async (req, res) => {
        let { page, size } = req.query;
        const posts = await this.postModel.paginate({
            filter: {
                $or: postAvailability(req),
                createdBy: { $nin: req.user?.BlockList || [] }
            },
            page,
            size,
            options: {
                populate: [
                    {
                        path: "comments",
                        match: {
                            commentId: { $exists: false },
                            deletedAt: {
                                $exists: false
                            }
                        },
                        populate: [
                            {
                                path: "reply",
                                match: {
                                    commentId: { $exists: false },
                                    deletedAt: {
                                        $exists: false
                                    }
                                },
                                populate: [
                                    {
                                        path: "reply",
                                        match: {
                                            commentId: { $exists: false },
                                            deletedAt: {
                                                $exists: false
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                ]
            }
        });
        return (0, success_response_1.successResponse)({ res, data: posts });
    };
    getPostWithComments = async (req, res) => {
        const posts = await this.postModel.findCursor({
            filter: {
                $or: postAvailability(req),
                createdBy: { $nin: req.user?.BlockList || [] },
            },
        });
        return (0, success_response_1.successResponse)({ res, data: posts });
    };
    getPostById = async (req, res) => {
        const { postId } = req.params;
        const post = await this.postModel.findById({
            id: postId,
        });
        if (!post || !(await this.userModel.findOne({
            filter: {
                _id: post?.createdBy,
                BlockList: { $nin: [req.user?._id] }
            }
        }))) {
            throw new error_response_1.NotFoundException("Post not exist or In-valid postId");
        }
        if (isAvailability(post, req)) {
            throw new error_response_1.NotFoundException("Fail to find matching result");
        }
        return (0, success_response_1.successResponse)({
            res, data: {
                post
            }
        });
    };
    freezePost = async (req, res) => {
        const { postId } = req.params;
        await Promise.all([
            await this.postModel.findOneAndUpdate({
                filter: {
                    _id: postId,
                    createdBy: req.user?._id
                },
                update: {
                    deletedBy: req.user?._id,
                    deletedAt: new Date()
                }
            }),
            await this.commentModel.updateMany({
                filter: {
                    postId
                },
                update: {
                    deletedBy: req.user?._id,
                    deletedAt: new Date()
                }
            })
        ]);
        return (0, success_response_1.successResponse)({
            res
        });
    };
    deletePost = async (req, res) => {
        const { postId } = req.params;
        await Promise.all([
            await this.postModel.findOneAndDelete({
                filter: {
                    _id: postId,
                    createdBy: req.user?._id,
                    deletedBy: { $exists: true },
                    deletedAt: { $exists: true }
                },
            }),
            await this.commentModel.deleteMany({
                filter: {
                    postId
                },
            })
        ]);
        return (0, success_response_1.successResponse)({
            res
        });
    };
}
exports.postService = new PostService();
