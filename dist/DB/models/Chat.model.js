"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModel = void 0;
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    content: {
        type: String,
        minlength: 2,
        max: 500000,
        required: true
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true
});
const chatSchema = new mongoose_1.Schema({
    participants: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true }],
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    group: String,
    group_image: String,
    roomId: {
        type: String,
        required: function () {
            return this.roomId;
        }
    },
    messages: [messageSchema]
}, {
    timestamps: true
});
exports.ChatModel = mongoose_1.models.Chat || (0, mongoose_1.model)("Chat", chatSchema);
