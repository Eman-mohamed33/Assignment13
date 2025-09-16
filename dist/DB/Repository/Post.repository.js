"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostRepository = void 0;
const DataBase_repository_1 = require("./DataBase.repository");
class PostRepository extends DataBase_repository_1.DatabaseRepository {
    model;
    constructor(model) {
        super(model);
        this.model = model;
    }
}
exports.PostRepository = PostRepository;
