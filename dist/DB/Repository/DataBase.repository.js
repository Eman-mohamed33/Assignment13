"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRepository = void 0;
class DatabaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async findOne({ filter, select, options }) {
        let doc = this.model.findOne(filter);
        if (select) {
            doc = doc.select(select);
        }
        if (options?.populate) {
            doc.populate(options.populate);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }
    async find({ filter, select, options }) {
        const doc = this.model.find(filter || {}).select(select || " ");
        if (options?.populate) {
            doc.populate(options.populate);
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
    async findById({ id, select, options }) {
        let doc = this.model.findById(id).select(select || " ");
        if (options?.populate) {
            doc = doc.populate(options.populate);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }
    async create({ data, options }) {
        return await this.model.create(data, options);
    }
    ;
    async insertMany({ data }) {
        return (await this.model.insertMany(data));
    }
    ;
    async updateOne({ filter, update, options }) {
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
    }
    ;
    async updateMany({ filter, update, options }) {
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
    }
    ;
    async findByIdAndUpdate({ id, update = { new: true }, options }) {
        return await this.model.findByIdAndUpdate(id, { ...update, $inc: { __v: 1 } }, options);
    }
    ;
    async findOneAndUpdate({ filter, update = { new: true }, options }) {
        return await this.model.findOneAndUpdate(filter, { ...update, $inc: { __v: 1 } }, options);
    }
    ;
    async deleteOne({ filter }) {
        return await this.model.deleteOne(filter);
    }
    ;
    async deleteMany({ filter }) {
        return await this.model.deleteMany(filter);
    }
    ;
    async findOneAndDelete({ filter }) {
        return await this.model.findOneAndDelete(filter);
    }
    ;
    async paginate({ filter, select, options = {}, page = "all", size = 5, }) {
        let docsCount = undefined;
        let pages = undefined;
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
}
exports.DatabaseRepository = DatabaseRepository;
;
