"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostRepository = void 0;
const DataBase_repository_1 = require("./DataBase.repository");
const Comment_model_1 = require("../models/Comment.model");
const Comment_repository_1 = require("./Comment.repository");
class PostRepository extends DataBase_repository_1.DatabaseRepository {
    model;
    commentModel = new Comment_repository_1.CommentRepository(Comment_model_1.CommentModel);
    constructor(model) {
        super(model);
        this.model = model;
    }
    async findCursor({ filter, select, options }) {
        let result = [];
        const cursor = this.model.find(filter || {}).select(select || " ")
            .populate(options?.populate).cursor();
        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            const comments = await this.commentModel.find({
                filter: {
                    postId: doc._id,
                    commentId: {
                        $exists: false
                    }
                }
            });
            result.push({ post: doc, comments });
        }
        return result;
    }
}
exports.PostRepository = PostRepository;
