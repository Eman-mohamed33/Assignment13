import { Request, Response } from "express";
import { BadRequestException, NotFoundException } from "../../utils/Response/error.response";
import { IChatDto, ICreateGroupChattingBodyDto, IGetChatParamsDto, IGetChatQueryDto, IGetChattingGroupParamsDto, IJoinRoomDto, ISendGroupMessageDto, ISendMessageDto, IUserIsTypingDto } from "./chat.dto";
import { successResponse } from "../../utils/Response/success.response";
import { ChatRepository, UserRepository } from "../../DB/Repository";
import { ChatModel } from "../../DB/models/Chat.model";
import { Types } from "mongoose";
import { IGetChatResponse } from "./chat.entities";
import { UserModel } from "../../DB/models/User.model";
import { connectedSockets } from "../Gateway";
import { deleteFile, uploadFile } from "../../utils/Multer/S3.config";
import { nanoid } from "nanoid";

export class ChatService{
    private chatModel = new ChatRepository(ChatModel);
    private userModel = new UserRepository(UserModel);

    constructor() { }
    
    sayWelcome = ({ message, socket, callback, io }: IChatDto) => {
      try {
          console.log({ message });
          throw new BadRequestException("some error");
         callback ? callback("Welcome From BE to Fe") : undefined;
          
      } catch (error) {
          socket.emit("custom_error", error);
      }
    }

    getChat = async (req: Request, res: Response): Promise<Response> => {
        const { userId } = req.params as IGetChatParamsDto;
        const { page, size } = req.query as IGetChatQueryDto;

        const chat = await this.chatModel.findOneChat({
            filter: {
                participants: {
                    $all: [
                        req.user?._id,
                        Types.ObjectId.createFromHexString(userId)
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
            throw new BadRequestException("Fail to find this chat");
        }
      
        
        return successResponse<IGetChatResponse>({
            res, data: {
                chat
            }
        });
    }


    getChattingGroup = async (req: Request, res: Response): Promise<Response> => {
        const { groupId } = req.params as IGetChattingGroupParamsDto;
        const { page, size } = req.query as IGetChatQueryDto;

        const chat = await this.chatModel.findOneChat({
            filter: {
                _id: Types.ObjectId.createFromHexString(groupId),
                participants: { $in: req.user?._id as Types.ObjectId },
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
            throw new BadRequestException("Fail to find this chatting group");
        }
      
        
        return successResponse<IGetChatResponse>({
            res, data: {
                chat
            }
        });
    }

    sendMessage = async({ content, sendTo, socket, io }: ISendMessageDto) => {

        try {
            const createdBy = socket.credentials?.user._id as Types.ObjectId;
            console.log({ content, sendTo, createdBy });

            if (socket.credentials?.user.BlockList?.includes(Types.ObjectId.createFromHexString(sendTo))) {
                throw new BadRequestException("User is blocked");
            }

            const user = await this.userModel.findOne({
                filter: {
                    _id: Types.ObjectId.createFromHexString(sendTo),
                    friends: {
                        $in: createdBy
                    },
                    BlockList: { $nin: createdBy }
                    
                }
            });

            if (!user) {
                throw new NotFoundException("Invalid recipient friend");
            }

            const chat = await this.chatModel.findOneAndUpdate({
                filter: {
                    participants: {
                        $all: [
                            createdBy as Types.ObjectId,
                            Types.ObjectId.createFromHexString(sendTo)
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
                                createdBy as Types.ObjectId,
                                Types.ObjectId.createFromHexString(sendTo)
                            ]
                            
                        }
                    ]
                })) || [];

                if (!newChat) {
                    throw new BadRequestException("fail to create new chat");
                }

            }

            io?.to(connectedSockets.get(createdBy.toString() as string) as string[]).emit("successMessage", { content });
         

            io?.to(connectedSockets.get(sendTo as string) as string[]).emit("newMessage", { content, from: socket.credentials?.user });
         
        }
        catch (error) {
            socket.emit("custom_error", error);
        }

    }

    createChattingGroup = async (req: Request, res: Response): Promise<Response> => {
        
        const { group, participants }: ICreateGroupChattingBodyDto = req.body;

        let dbParticipants = participants.map((participant: string) => {
            return Types.ObjectId.createFromHexString(participant);
        });

        if (dbParticipants.some(participant => {
            return req.user?.BlockList.includes(participant)
        })) {
            throw new BadRequestException("Some or all Users are Blocked");
        }

        const users = await this.userModel.find({
            filter: {
                _id: { $in: dbParticipants },
                friends: { $in: req.user?._id as Types.ObjectId },
            }
        });

        if (participants.length!==users.length) {
            throw new NotFoundException("Some or all of recipient are invalid");
        }

        let group_image: string | undefined = undefined;
        let roomId = group.replaceAll(/\s+/g, "_") + "_" + nanoid();

        if (req.file) {
            group_image = await uploadFile({
                file: req.file as Express.Multer.File,
                path: `chat/${roomId}`
            });
        }

        dbParticipants.push(req.user?._id as Types.ObjectId);

        const [chat] = await this.chatModel.create({
            data: [{
                createdBy: req.user?._id as Types.ObjectId,
                group,
                participants: dbParticipants,
                messages: [],
                group_image: group_image as string,
                roomId
            }]
        }) || [];

        if (!chat) {
            if (group_image) {
                await deleteFile({ Key: group_image });
            }
            throw new BadRequestException("Fail to create this group");
        }

        return successResponse<IGetChatResponse>({
            res, statusCode: 201, data: {
                chat
        }});
    }


    joinRoom = async ({ roomId, socket, io }: IJoinRoomDto) => {
        try {
            const chat = await this.chatModel.findOne({

                filter: {
                    participants: { $in: socket.credentials?.user._id },
                    group: { $exists: true },
                    roomId
                }
            });

            if (!chat) {
                throw new NotFoundException("Fail to find matching chat");
            }

            console.log({ Join: roomId });
            

            socket.join(chat.roomId as string);
        }
        catch (error) {
            socket.emit("custom_error", error);
        }

    }

    sendGroupMessage = async ({ content, groupId,socket, io }: ISendGroupMessageDto) => {
        try {
            const createdBy = socket.credentials?.user._id as Types.ObjectId;
            const chat = await this.chatModel.findOneAndUpdate({

                filter: {
                    _id: Types.ObjectId.createFromHexString(groupId),
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
                throw new NotFoundException("Fail to find matching chat");
            }

           
            io?.to(connectedSockets.get(createdBy.toString() as string) as string[]).emit("successMessage", { content });
         

            io?.to(chat.roomId as string).emit("newMessage", { content, from: socket.credentials?.user, groupId });
         
        }
        catch (error) {
            socket.emit("custom_error", error);
        }

    }

    userIsTyping = async ({ roomId,isTyping, socket, io }: IUserIsTypingDto) => {
        try {
            const userId = socket.credentials?.user._id;
    console.log("user is typing ...", { roomId, userId, isTyping });
            socket.to(roomId).emit("Typing_now", { userId, isTyping });
        }
        catch (error) {
            socket.emit("custom_error", error);
        }

    }
}

