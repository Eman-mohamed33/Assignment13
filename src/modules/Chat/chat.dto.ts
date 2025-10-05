import { Server } from "socket.io";
import { IAuthSocket } from "../Gateway";
import z from "zod";
import { createChattingGroup, getChat, getChattingGroup } from "./chat.validation";

export interface IMainDto {
    socket: IAuthSocket,
    callback?: any,
    io: Server
}

export interface IChatDto extends IMainDto{
    message: string;
}

export interface ISendMessageDto extends IMainDto {
    content: string;
    sendTo: string;
}

export interface IJoinRoomDto extends IMainDto {
    roomId: string
}

export interface ISendGroupMessageDto extends IMainDto {
    groupId: string;
    content: string;
}

export interface IUserIsTypingDto extends IMainDto {
    roomId: string;
    isTyping: boolean;
}





export type IGetChatParamsDto = z.infer<typeof getChat.params>;
export type IGetChattingGroupParamsDto = z.infer<typeof getChattingGroup.params>;
export type IGetChatQueryDto = z.infer<typeof getChat.query>;
export type ICreateGroupChattingBodyDto = z.infer<typeof createChattingGroup.body>;



