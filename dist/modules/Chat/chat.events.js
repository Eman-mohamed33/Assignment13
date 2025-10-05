"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatEvents = void 0;
const chat_service_1 = require("./chat.service");
class ChatEvents {
    chatService = new chat_service_1.ChatService();
    constructor() { }
    sayWelcome = (socket, io) => {
        return socket.on("Welcome", (data, callback) => {
            this.chatService.sayWelcome({ message: data, socket, callback, io });
        });
    };
    sendMessage = (socket, io) => {
        return socket.on("sendMessage", (data) => {
            this.chatService.sendMessage({ ...data, socket, io });
        });
    };
    joinRoom = (socket, io) => {
        return socket.on("join_room", (data) => {
            this.chatService.joinRoom({ ...data, socket, io });
        });
    };
    sendGroupMessage = (socket, io) => {
        return socket.on("sendGroupMessage", (data) => {
            this.chatService.sendGroupMessage({ ...data, socket, io });
        });
    };
    userIsTyping = (socket, io) => {
        return socket.on("user_typing", (data) => {
            this.chatService.userIsTyping({ ...data, socket, io });
        });
    };
}
exports.ChatEvents = ChatEvents;
