import { HUserDocument } from "../../DB/models/User.model";

export interface IAuthGraphQl {
    user: HUserDocument;
}