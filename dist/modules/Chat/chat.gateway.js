"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const chat_events_1 = require("./chat.events");
class ChatGateway {
    constructor() { }
    chatEvents = new chat_events_1.ChatEvents();
    register = (socket, io) => {
        this.chatEvents.sayWelcome(socket, io);
        this.chatEvents.sendMessage(socket, io);
        this.chatEvents.joinRoom(socket, io);
        this.chatEvents.sendGroupMessage(socket, io);
        this.chatEvents.userIsTyping(socket, io);
    };
}
exports.ChatGateway = ChatGateway;
