"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRepository = void 0;
class DatabaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async findOne({ filter, select, options }) {
        const doc = this.model.findOne(filter).select(select || " ");
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
        const doc = this.model.findById(id).select(select || " ");
        if (options?.populate) {
            doc.populate(options.populate);
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
        return await this.model.updateOne(filter, { ...update, $inc: { __v: 1 } }, options);
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
}
exports.DatabaseRepository = DatabaseRepository;
;
