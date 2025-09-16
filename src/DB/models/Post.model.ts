import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { emailEvent } from "../../utils/Events/email.event";
import { UserRepository } from "../Repository";
import { UserModel } from "./User.model";

export enum AllowCommentsEnum {
    allow = "allow",
    deny = "deny"
}

export enum AvailabilityEnum {
    pubic = "pubic",
    friends = "friends",
    onlyMe = "only-Me",
    closeFriends = "close-Friends",
}

export enum LikeActionEnum {
    like = "like",
    unlike = "unlike"
}

export interface IPost{
    content?: string;
    attachments?: string[];

    assetsFolderId: string;

    availability: AvailabilityEnum;
    allowComments: AllowCommentsEnum;

    tags?: Types.ObjectId[];
    likes: Types.ObjectId[];

    createdBy: Types.ObjectId;

    deletedBy?: Types.ObjectId;
    deletedAt?: Date;

    restoredBy?: Types.ObjectId;
    restoredAt?: Date;

    createdAt: Date;
    updatedAt: Date;

}

export type HPostDocument = HydratedDocument<IPost>;

export const postSchema = new Schema<IPost>({
    content: {
        type: String, minlength: 2, maxlength: 500000, required: function () {
            return !this.attachments?.length ? true : false
        }
    },
    
    attachments: [String],

    assetsFolderId: String,

    availability: {
        type: String,
        enum: AvailabilityEnum,
        default: AvailabilityEnum.pubic
    },
    allowComments: {
        type: String,
        enum: AllowCommentsEnum,
        default: AllowCommentsEnum.allow
    },

    tags: [{ type: Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedAt: Date,

    restoredBy: { type: Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,

}, {
    timestamps: true,
    strictQuery: true
})

postSchema.pre(["updateOne", "findOneAndUpdate"], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    } else {
        this.setQuery({ ...query, deletedAt: { $exists: false } });
    }
    next();
});

postSchema.post("save", async function (doc, next) {
    const userModel = new UserRepository(UserModel);
    const users = await userModel.find({
        filter: {
            _id: { $in: doc.tags }
        }
    })
    
    console.log({ users, tags: doc.tags });
    
    if (users?.length) {
        for (const user of users) {
            emailEvent.emit("MentionedYouInPost", {
                to: user.email,
                userName: user.userName,
                postContent: doc.content
            });
        }
    }
 
});


export const PostModel = models.Post || model<IPost>("Post", postSchema);
