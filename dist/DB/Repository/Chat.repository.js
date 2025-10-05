"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRepository = void 0;
const DataBase_repository_1 = require("./DataBase.repository");
class ChatRepository extends DataBase_repository_1.DatabaseRepository {
    model;
    constructor(model) {
        super(model);
        this.model = model;
    }
    async findOneChat({ filter, select, options, page = 1, size = 5 }) {
        page = Math.floor(!page || page < 1 ? 1 : page);
        size = Math.floor(size < 1 || !size ? 5 : size);
        let doc = this.model.findOne(filter, {
            messages: { $slice: [-(page * size), size] }
        });
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
}
exports.ChatRepository = ChatRepository;
