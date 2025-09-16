"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const success_response_1 = require("../../utils/Response/success.response");
const Repository_1 = require("../../DB/Repository");
const User_model_1 = require("../../DB/models/User.model");
const Post_model_1 = require("../../DB/models/Post.model");
const S3_config_1 = require("../../utils/Multer/S3.config");
const error_response_1 = require("../../utils/Response/error.response");
const nanoid_1 = require("nanoid");
class PostService {
    userModel = new Repository_1.UserRepository(User_model_1.UserModel);
    postModel = new Repository_1.PostRepository(Post_model_1.PostModel);
    constructor() { }
    createPost = async (req, res) => {
        if (req.body.tags &&
            (await this.userModel.find({
                filter: {
                    _id: { $in: req.body.tags }
                }
            })).length !==
                req.body.tags.length) {
            throw new error_response_1.NotFoundException("Some of mentioned users are not exist");
        }
        let attachments = [];
        const assetsFolderId = (0, nanoid_1.nanoid)();
        if (req.files?.length) {
            attachments = await (0, S3_config_1.uploadFilesOrLargeFiles)({ files: req.files, path: `user/${req.decoded?._id}/post/${assetsFolderId}` });
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
            },
            update
        });
        if (!post) {
            throw new error_response_1.NotFoundException("Post not exist or In-valid postId");
        }
        return (0, success_response_1.successResponse)({ res });
    };
}
exports.default = new PostService();
