import { HChatDocument } from "../../DB/models/Chat.model";

export interface IGetChatResponse{
    chat: Partial<HChatDocument>;
}