"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const User_model_1 = require("./models/User.model");
const connectDB = async () => {
    try {
        const URI = process.env.DB_URL || "";
        const result = await (0, mongoose_1.connect)(URI, { serverSelectionTimeoutMS: 30000 });
        User_model_1.UserModel.syncIndexes();
        console.log(result.models);
        console.log("DB Connected Successfully ✅");
    }
    catch (error) {
        console.log("DB Fail To Connect ✖ ", error);
    }
};
exports.default = connectDB;
