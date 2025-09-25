"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostModel = exports.postSchema = exports.LikeActionEnum = exports.AvailabilityEnum = exports.AllowCommentsEnum = void 0;
const mongoose_1 = require("mongoose");
const email_event_1 = require("../../utils/Events/email.event");
const Repository_1 = require("../Repository");
const User_model_1 = require("./User.model");
var AllowCommentsEnum;
(function (AllowCommentsEnum) {
    AllowCommentsEnum["allow"] = "allow";
    AllowCommentsEnum["deny"] = "deny";
})(AllowCommentsEnum || (exports.AllowCommentsEnum = AllowCommentsEnum = {}));
var AvailabilityEnum;
(function (AvailabilityEnum) {
    AvailabilityEnum["pubic"] = "public";
    AvailabilityEnum["friends"] = "friends";
    AvailabilityEnum["onlyMe"] = "only-Me";
    AvailabilityEnum["closeFriends"] = "close-Friends";
    AvailabilityEnum["friendsExcept"] = "Except";
    AvailabilityEnum["specificFriends"] = "Only";
})(AvailabilityEnum || (exports.AvailabilityEnum = AvailabilityEnum = {}));
var LikeActionEnum;
(function (LikeActionEnum) {
    LikeActionEnum["like"] = "like";
    LikeActionEnum["unlike"] = "unlike";
})(LikeActionEnum || (exports.LikeActionEnum = LikeActionEnum = {}));
exports.postSchema = new mongoose_1.Schema({
    content: {
        type: String, minlength: 2, maxlength: 500000, required: function () {
            return !this.attachments?.length ? true : false;
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
    tags: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    deletedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    deletedAt: Date,
    restoredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,
    Only: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    Except: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
exports.postSchema.pre(["updateOne", "findOneAndUpdate"], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, deletedAt: { $exists: false } });
    }
    next();
});
exports.postSchema.pre(["find", "findOne", "countDocuments"], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, deletedAt: { $exists: false } });
    }
    next();
});
exports.postSchema.post("save", async function (doc, next) {
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
                field: "post"
            });
        }
    }
});
exports.postSchema.virtual("comments", {
    localField: "_id",
    foreignField: "postId",
    ref: "Comment",
    justOne: true
});
exports.PostModel = mongoose_1.models.Post || (0, mongoose_1.model)("Post", exports.postSchema);
