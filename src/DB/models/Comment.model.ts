import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { IPost } from "./Post.model";
import { UserModel } from "./User.model";
import { UserRepository } from "../Repository";
import { emailEvent } from "../../utils/Events/email.event";

export interface IComment {
    content?: string;
    attachments?: string[];

    createdBy: Types.ObjectId;
    postId: Types.ObjectId | Partial<IPost>;
    commentId?: Types.ObjectId;

    tags?: Types.ObjectId[];
    likes: Types.ObjectId[];
    
    deletedBy?: Types.ObjectId;
    deletedAt?: Date;
    
    restoredBy?: Types.ObjectId;
    restoredAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

export type HCommentDocument = HydratedDocument<IComment>;

const commentSchema = new Schema<IComment>({
    content: {
        type: String, minlength: 2, maxlength: 500000, required: function () {
            return !this.attachments?.length ? true : false
        }
    },
    
    attachments: [String],
    tags: [{ type: Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedAt: Date,
    
    restoredBy: { type: Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,

    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    commentId: { type: Schema.Types.ObjectId, ref: "Comment" },

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
    } else {
        this.setQuery({ ...query, deletedAt: { $exists: false } });
    }
    next();
});

commentSchema.pre(["find", "findOne", "countDocuments"], function (next) {
    
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    } else {
        this.setQuery({ ...query, deletedAt: { $exists: false } });
    }
    next();
});

commentSchema.virtual("reply", {
    localField:"_id",
    foreignField: "commentId",
    ref: "Comment",
})

commentSchema.post("save", async function (doc, next) {
    const userModel = new UserRepository(UserModel);
    const users = await userModel.find({
        filter: {
            _id: { $in: doc.tags }
        }
    })
    
    console.log({ users, tags: doc.tags });
    
    if (users?.length) {
        for (const user of users) {
            emailEvent.emit("MentionedYou", {
                to: user.email,
                userName: user.userName,
                Content: doc.content,
                field:"comment"
            });
        }
    }
 
});

commentSchema.post("updateOne", async function (doc, next) {

    const Doc = await this.model.findOne(this.getFilter());
    
    const userModel = new UserRepository(UserModel);

    const users = await userModel.find({
        filter: {
            _id: { $in: Doc.tags }
        }
    })
    
    console.log({ users, tags: Doc.tags });
    
    if (users?.length) {
        for (const user of users) {
            emailEvent.emit("MentionedYou", {
                to: user.email,
                userName: user.userName,
                Content: Doc.content,
                field:"comment"
            });
        }
    }
 
});

export const CommentModel = models.Comment || model<IComment>("Comment", commentSchema);