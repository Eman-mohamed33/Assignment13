"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const DataBase_repository_1 = require("./DataBase.repository");
const error_response_1 = require("../../utils/Response/error.response");
class UserRepository extends DataBase_repository_1.DatabaseRepository {
    model;
    constructor(model) {
        super(model);
        this.model = model;
    }
    async createUser({ data, options }) {
        const [user] = (await this.create({ data, options })) || [];
        if (!user) {
            throw new error_response_1.BadRequestException("Fail To Create New User");
        }
        return user;
    }
    ;
}
exports.UserRepository = UserRepository;
