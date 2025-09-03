"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenRepository = void 0;
const DataBase_repository_1 = require("./DataBase.repository");
class TokenRepository extends DataBase_repository_1.DatabaseRepository {
    model;
    constructor(model) {
        super(model);
        this.model = model;
    }
}
exports.TokenRepository = TokenRepository;
