import { HydratedDocument, Model } from "mongoose";
import { IUser as TDocument} from "../models/User.model";
import { DatabaseRepository } from "./DataBase.repository";
import { CreateOptions } from "mongoose";
import { BadRequestException } from "../../utils/Response/error.response";

export class UserRepository extends DatabaseRepository<TDocument>{
    constructor(protected override readonly model: Model<TDocument>) {
        super(model);
    }


    async createUser({ data, options }: { data: Partial<TDocument>[], options?: CreateOptions }): Promise<HydratedDocument<TDocument>> {
           const [user] = (await this.create({ data, options })) || [];
           if (!user) {
               throw new BadRequestException("Fail To Create New User");
           }
           return user;
    };
   

}