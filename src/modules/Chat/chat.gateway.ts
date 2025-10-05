import { Server } from "socket.io";
import { IAuthSocket } from "../Gateway";
import { ChatEvents } from "./chat.events";

export class ChatGateway{
    constructor() { }
    private chatEvents: ChatEvents = new ChatEvents();

    register = (socket: IAuthSocket, io: Server) => {
        this.chatEvents.sayWelcome(socket, io);
        this.chatEvents.sendMessage(socket, io);
        this.chatEvents.joinRoom(socket, io);
        this.chatEvents.sendGroupMessage(socket, io);
        this.chatEvents.userIsTyping(socket, io);
    }
}

