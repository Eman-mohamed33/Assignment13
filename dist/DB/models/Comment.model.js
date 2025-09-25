"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentModel = void 0;
const mongoose_1 = require("mongoose");
const User_model_1 = require("./User.model");
const Repository_1 = require("../Repository");
const email_event_1 = require("../../utils/Events/email.event");
const commentSchema = new mongoose_1.Schema({
    content: {
        type: String, minlength: 2, maxlength: 500000, required: function () {
            return !this.attachments?.length ? true : false;
        }
    },
    attachments: [String],
    tags: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    deletedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    deletedAt: Date,
    restoredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,
    postId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Post", required: true },
    commentId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Comment" },
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
commentSchema.pre(["updateOne", "findOneAndUpdate"], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, deletedAt: { $exists: false } });
    }
    next();
});
commentSchema.pre(["find", "findOne", "countDocuments"], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, deletedAt: { $exists: false } });
    }
    next();
});
commentSchema.virtual("reply", {
    localField: "_id",
    foreignField: "commentId",
    ref: "Comment",
});
commentSchema.post("save", async function (doc, next) {
    const userModel = new Repository_1.UserRepository(User_model_1.UserModel);
    const users = await userModel.find({
        filter: {
            _id: { $in: doc.tags }
        }
    });
    console.log({ users, tags: doc.tags });
    if (users?.length) {
        for (const user of users) {
            email_event_1.emailEvent.emit("MentionedYou", {
                to: user.email,
                userName: user.userName,
                Content: doc.content,
                field: "comment"
            });
        }
    }
});
commentSchema.post("updateOne", async function (doc, next) {
    const Doc = await this.model.findOne(this.getFilter());
    const userModel = new Repository_1.UserRepository(User_model_1.UserModel);
    const users = await userModel.find({
        filter: {
            _id: { $in: Doc.tags }
        }
    });
    console.log({ users, tags: Doc.tags });
    if (users?.length) {
        for (const user of users) {
            email_event_1.emailEvent.emit("MentionedYou", {
                to: user.email,
                userName: user.userName,
                Content: Doc.content,
                field: "comment"
            });
        }
    }
});
exports.CommentModel = mongoose_1.models.Comment || (0, mongoose_1.model)("Comment", commentSchema);
