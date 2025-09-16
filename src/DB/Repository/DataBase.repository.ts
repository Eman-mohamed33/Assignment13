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
        const doc = this.model.findOne(filter).select(select || " ");

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
            select?: ProjectionType<TDocument> | null,
            options?: QueryOptions<TDocument> | null
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
        const doc = this.model.findById(id).select(select || " ");

        if (options?.populate) {
            doc.populate(options.populate as PopulateOptions[]);
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
        return await this.model.updateOne(filter, { ...update, $inc: { __v: 1 } }, options);
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
};