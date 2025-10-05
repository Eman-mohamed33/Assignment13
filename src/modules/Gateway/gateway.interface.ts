import { HUserDocument } from "../../DB/models/User.model";
import { JwtPayload } from "jsonwebtoken";
import { Socket } from "socket.io";


export interface IAuthSocket extends Socket{
        credentials?: {
            user: Partial<HUserDocument>,
            decoded: JwtPayload
        }
    }