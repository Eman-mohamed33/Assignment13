import { HydratedDocument, Model, PopulateOptions, ProjectionType, QueryOptions, RootFilterQuery } from "mongoose"
import { IChat as TDocument } from "../models/Chat.model"
import { DatabaseRepository, lean } from "./DataBase.repository"



export class ChatRepository extends DatabaseRepository<TDocument> {
    constructor(protected override readonly model: Model<TDocument>) {
        super(model)
    }

    async findOneChat({ filter, select, options, page = 1, size = 5 }:
        {
            filter: RootFilterQuery<TDocument>,
            select?: ProjectionType<TDocument> | null,
            options?: QueryOptions<TDocument> | null,
            page?: number | undefined,
            size?: number | undefined
        }): Promise<lean<TDocument> | HydratedDocument<TDocument> | null> {
        
        page = Math.floor(!page || page < 1 ? 1 : page);
        size = Math.floor(size < 1 || !size ? 5 : size);
          
        let doc = this.model.findOne(filter, {
            messages: { $slice: [-(page * size), size] }
        });
            
    
        if (select) {
            doc = doc.select(select);
        }
        if (options?.populate) {
            doc.populate(options.populate as PopulateOptions[]);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }
    
        return await doc.exec();
    }
}