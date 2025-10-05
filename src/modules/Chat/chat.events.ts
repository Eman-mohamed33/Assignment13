import { Server } from "socket.io";
import { IAuthSocket } from "../Gateway";
import { ChatService } from "./chat.service";

export class ChatEvents {
    private chatService: ChatService = new ChatService();

    constructor() { }
    
    sayWelcome = (socket: IAuthSocket, io: Server) => {
        return socket.on("Welcome", (data, callback) => {
            this.chatService.sayWelcome({ message: data, socket, callback, io });
        });
    }

    sendMessage = (socket: IAuthSocket, io: Server) => {
        return socket.on("sendMessage", (data: { content: string, sendTo: string }) => {
            this.chatService.sendMessage({ ...data, socket, io });
        });
    }

    joinRoom = (socket: IAuthSocket, io: Server) => {
        return socket.on("join_room", (data: { roomId: string }) => {
            this.chatService.joinRoom({ ...data, socket, io });
        });
    }

    sendGroupMessage = (socket: IAuthSocket, io: Server) => {
        return socket.on("sendGroupMessage", (data: { content: string, groupId: string }) => {
            this.chatService.sendGroupMessage({ ...data, socket, io });
        });
    }

    userIsTyping = (socket: IAuthSocket, io: Server) => {
        return socket.on("user_typing", (data: { roomId: string, isTyping: boolean, chatType: string }) => {
            this.chatService.userIsTyping({ ...data, socket, io });
        });
    }

}