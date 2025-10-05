"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const error_response_1 = require("../../utils/Response/error.response");
const success_response_1 = require("../../utils/Response/success.response");
const Repository_1 = require("../../DB/Repository");
const Chat_model_1 = require("../../DB/models/Chat.model");
const mongoose_1 = require("mongoose");
const User_model_1 = require("../../DB/models/User.model");
const Gateway_1 = require("../Gateway");
const S3_config_1 = require("../../utils/Multer/S3.config");
const nanoid_1 = require("nanoid");
class ChatService {
    chatModel = new Repository_1.ChatRepository(Chat_model_1.ChatModel);
    userModel = new Repository_1.UserRepository(User_model_1.UserModel);
    constructor() { }
    sayWelcome = ({ message, socket, callback, io }) => {
        try {
            console.log({ message });
            throw new error_response_1.BadRequestException("some error");
            callback ? callback("Welcome From BE to Fe") : undefined;
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
    getChat = async (req, res) => {
        const { userId } = req.params;
        const { page, size } = req.query;
        const chat = await this.chatModel.findOneChat({
            filter: {
                participants: {
                    $all: [
                        req.user?._id,
                        mongoose_1.Types.ObjectId.createFromHexString(userId)
                    ]
                },
                group: {
                    $exists: false
                }
            },
            options: {
                populate: [
                    {
                        path: "participants",
                        select: "firstName lastName email gender age profileImage",
                    }
                ]
            },
            page,
            size
        });
        if (!chat) {
            throw new error_response_1.BadRequestException("Fail to find this chat");
        }
        return (0, success_response_1.successResponse)({
            res, data: {
                chat
            }
        });
    };
    getChattingGroup = async (req, res) => {
        const { groupId } = req.params;
        const { page, size } = req.query;
        const chat = await this.chatModel.findOneChat({
            filter: {
                _id: mongoose_1.Types.ObjectId.createFromHexString(groupId),
                participants: { $in: req.user?._id },
                group: {
                    $exists: true
                }
            },
            options: {
                populate: [
                    {
                        path: "messages.createdBy",
                        select: "firstName lastName email gender age profileImage",
                    }
                ]
            },
            page,
            size
        });
        if (!chat) {
            throw new error_response_1.BadRequestException("Fail to find this chatting group");
        }
        return (0, success_response_1.successResponse)({
            res, data: {
                chat
            }
        });
    };
    sendMessage = async ({ content, sendTo, socket, io }) => {
        try {
            const createdBy = socket.credentials?.user._id;
            console.log({ content, sendTo, createdBy });
            if (socket.credentials?.user.BlockList?.includes(mongoose_1.Types.ObjectId.createFromHexString(sendTo))) {
                throw new error_response_1.BadRequestException("User is blocked");
            }
            const user = await this.userModel.findOne({
                filter: {
                    _id: mongoose_1.Types.ObjectId.createFromHexString(sendTo),
                    friends: {
                        $in: createdBy
                    },
                    BlockList: { $nin: createdBy }
                }
            });
            if (!user) {
                throw new error_response_1.NotFoundException("Invalid recipient friend");
            }
            const chat = await this.chatModel.findOneAndUpdate({
                filter: {
                    participants: {
                        $all: [
                            createdBy,
                            mongoose_1.Types.ObjectId.createFromHexString(sendTo)
                        ]
                    },
                    group: {
                        $exists: false
                    }
                },
                update: {
                    $addToSet: {
                        messages: {
                            content,
                            createdBy
                        }
                    }
                }
            });
            if (!chat) {
                const [newChat] = (await this.chatModel.create({
                    data: [
                        {
                            createdBy,
                            messages: [{
                                    content,
                                    createdBy
                                }],
                            participants: [
                                createdBy,
                                mongoose_1.Types.ObjectId.createFromHexString(sendTo)
                            ]
                        }
                    ]
                })) || [];
                if (!newChat) {
                    throw new error_response_1.BadRequestException("fail to create new chat");
                }
            }
            io?.to(Gateway_1.connectedSockets.get(createdBy.toString())).emit("successMessage", { content });
            io?.to(Gateway_1.connectedSockets.get(sendTo)).emit("newMessage", { content, from: socket.credentials?.user });
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
    createChattingGroup = async (req, res) => {
        const { group, participants } = req.body;
        let dbParticipants = participants.map((participant) => {
            return mongoose_1.Types.ObjectId.createFromHexString(participant);
        });
        if (dbParticipants.some(participant => {
            return req.user?.BlockList.includes(participant);
        })) {
            throw new error_response_1.BadRequestException("Some or all Users are Blocked");
        }
        const users = await this.userModel.find({
            filter: {
                _id: { $in: dbParticipants },
                friends: { $in: req.user?._id },
            }
        });
        if (participants.length !== users.length) {
            throw new error_response_1.NotFoundException("Some or all of recipient are invalid");
        }
        let group_image = undefined;
        let roomId = group.replaceAll(/\s+/g, "_") + "_" + (0, nanoid_1.nanoid)();
        if (req.file) {
            group_image = await (0, S3_config_1.uploadFile)({
                file: req.file,
                path: `chat/${roomId}`
            });
        }
        dbParticipants.push(req.user?._id);
        const [chat] = await this.chatModel.create({
            data: [{
                    createdBy: req.user?._id,
                    group,
                    participants: dbParticipants,
                    messages: [],
                    group_image: group_image,
                    roomId
                }]
        }) || [];
        if (!chat) {
            if (group_image) {
                await (0, S3_config_1.deleteFile)({ Key: group_image });
            }
            throw new error_response_1.BadRequestException("Fail to create this group");
        }
        return (0, success_response_1.successResponse)({
            res, statusCode: 201, data: {
                chat
            }
        });
    };
    joinRoom = async ({ roomId, socket, io }) => {
        try {
            const chat = await this.chatModel.findOne({
                filter: {
                    participants: { $in: socket.credentials?.user._id },
                    group: { $exists: true },
                    roomId
                }
            });
            if (!chat) {
                throw new error_response_1.NotFoundException("Fail to find matching chat");
            }
            console.log({ Join: roomId });
            socket.join(chat.roomId);
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
    sendGroupMessage = async ({ content, groupId, socket, io }) => {
        try {
            const createdBy = socket.credentials?.user._id;
            const chat = await this.chatModel.findOneAndUpdate({
                filter: {
                    _id: mongoose_1.Types.ObjectId.createFromHexString(groupId),
                    participants: { $in: createdBy },
                    group: { $exists: true },
                },
                update: {
                    $addToSet: {
                        messages: { content, createdBy }
                    }
                }
            });
            if (!chat) {
                throw new error_response_1.NotFoundException("Fail to find matching chat");
            }
            io?.to(Gateway_1.connectedSockets.get(createdBy.toString())).emit("successMessage", { content });
            io?.to(chat.roomId).emit("newMessage", { content, from: socket.credentials?.user, groupId });
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
    userIsTyping = async ({ roomId, isTyping, socket, io }) => {
        try {
            const userId = socket.credentials?.user._id;
            console.log("user is typing ...", { roomId, userId, isTyping });
            socket.to(roomId).emit("Typing_now", { userId, isTyping });
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
}
exports.ChatService = ChatService;
