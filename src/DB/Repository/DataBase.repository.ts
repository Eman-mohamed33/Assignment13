import {
    CreateOptions, DeleteResult, FlattenMaps, HydratedDocument,
    Model, MongooseUpdateQueryOptions,
    PopulateOptions,
    ProjectionType,
    QueryOptions,
    RootFilterQuery, Types, UpdateQuery, UpdateWriteOpResult
} from "mongoose";


export type lean<T> = HydratedDocument<FlattenMaps<T>>;

export abstract class DatabaseRepository<TDocument> {

    constructor(protected readonly model: Model<TDocument>) { }

    async findOne({ filter, select, options }:
        {
            filter: RootFilterQuery<TDocument>,
            select?: ProjectionType<TDocument> | null,
            options?: QueryOptions<TDocument> | null
        }): Promise<lean<TDocument> | HydratedDocument<TDocument> | null> {
        let doc = this.model.findOne(filter);
        
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


    async find({ filter, select, options }:
        {
            filter: RootFilterQuery<TDocument>,
            select?: ProjectionType<TDocument> | undefined,
            options?: QueryOptions<TDocument> | undefined
        }): Promise<lean<TDocument>[] | HydratedDocument<TDocument>[] | []> {
        const doc = this.model.find(filter || {}).select(select || " ");

        if (options?.populate) {
            doc.populate(options.populate as PopulateOptions[]);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }

        if (options?.skip) {
            doc.skip(options.skip);
        }

        if (options?.limit) {
            doc.limit(options.limit);
        }

        return await doc.exec();
    }

    async findById({ id, select, options }:
        {
            id: Types.ObjectId,
            select?: ProjectionType<TDocument> | null,
            options?: QueryOptions<TDocument> | null
        }): Promise<lean<TDocument> | HydratedDocument<TDocument> | null> {
        let doc = this.model.findById(id).select(select || " ");

        if (options?.populate) {
            doc = doc.populate(options.populate as PopulateOptions[]);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }

        return await doc.exec();
    }

    async create({ data, options }: { data: Partial<TDocument>[], options?: CreateOptions | undefined }): Promise<HydratedDocument<TDocument>[] | undefined> {
        return await this.model.create(data, options);
    };

    async insertMany({ data }: {
        data: Partial<TDocument>[]

    }): Promise<HydratedDocument<TDocument>[]> {
        return (await this.model.insertMany(data)) as HydratedDocument<TDocument>[];
    };

    async updateOne({
        filter,
        update,
        options
    }:
        {
            filter: RootFilterQuery<TDocument>,
            update: UpdateQuery<TDocument>,
            options?: MongooseUpdateQueryOptions<TDocument> | null
            
        }): Promise<UpdateWriteOpResult> {
        if (Array.isArray(update)) {
            update.push({
                $set: {
                    __v: {
                        $add: ["$__v", 1]
                    }
                }
            });
            return await this.model.updateOne(filter, update, options);
            
        }
        return await this.model.updateOne(filter, { ...update, $inc: { __v: 1 } }, options);
    };

    async updateMany({
        filter,
        update,
        options
    }:
        {
            filter: RootFilterQuery<TDocument>,
            update: UpdateQuery<TDocument>,
            options?: MongooseUpdateQueryOptions<TDocument> | null
            
        }): Promise<UpdateWriteOpResult> {
         
        if (Array.isArray(update)) {
            update.push({
                $set: {
                    __v: {
                        $add: ["$__v", 1]
                    }
                }
            });
            return await this.model.updateMany(filter, update, options);
            
        }
        return await this.model.updateMany(filter, { ...update, $inc: { __v: 1 } }, options);
    };

    async findByIdAndUpdate({
        id,
        update = { new: true },
        options
    }:
        {
            id: Types.ObjectId,
            update: UpdateQuery<TDocument>,
            options?: QueryOptions<TDocument> | null
            
        }): Promise<HydratedDocument<TDocument> | lean<TDocument> | null> {
        return await this.model.findByIdAndUpdate(id, { ...update, $inc: { __v: 1 } }, options);
    };

    async findOneAndUpdate({
        filter,
        update = { new: true },
        options
    }:
        {
            filter?: RootFilterQuery<TDocument>,
            update: UpdateQuery<TDocument>,
            options?: QueryOptions<TDocument> | null
            
        }): Promise<HydratedDocument<TDocument> | lean<TDocument> | null> {
        return await this.model.findOneAndUpdate(filter, { ...update, $inc: { __v: 1 } }, options);
    };

    async deleteOne({
        filter
    }:
        {
            filter: RootFilterQuery<TDocument>,

        }): Promise<DeleteResult> {
        return await this.model.deleteOne(filter);
    };

    async deleteMany({
        filter
    }:
        {
            filter: RootFilterQuery<TDocument>,

        }): Promise<DeleteResult> {
        return await this.model.deleteMany(filter);
    };

    async findOneAndDelete({
        filter
    }:
        {
            filter: RootFilterQuery<TDocument>,

        }): Promise<HydratedDocument<TDocument> | null> {
        return await this.model.findOneAndDelete(filter);
    };

    async paginate({ filter, select,
        options = {},
        page = "all",
        size = 5,
        
    }:
        {
            filter: RootFilterQuery<TDocument>,
            select?: ProjectionType<TDocument> | undefined,
            options?: QueryOptions<TDocument> | undefined,
            page?: number | "all",
            size?: number
        }): Promise<lean<TDocument>[] | HydratedDocument<TDocument>[] | [] | any> {
        let docsCount: number | undefined = undefined;
        let pages: number | undefined = undefined;

        if (page !== "all") {
            page = Math.floor(page < 0 ? 1 : page);
            options.limit = Math.floor(size < 0 || !size ? 5 : size);
            options.skip = Math.floor((page - 1) * options.limit);

            docsCount = await this.model.countDocuments(filter);
            pages = Math.ceil(docsCount / options.limit);
        }
        
        const result = await this.find({ filter, select, options });
      
        console.log(await this.model.estimatedDocumentCount());
        

        
        return { docsCount, pages, currentPage: page, limit: options.limit, result };
    }
};


