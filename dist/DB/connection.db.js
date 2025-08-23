"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const URL = process.env.DB_URL || "";
        const result = await mongoose_1.default.connect(URL, { serverSelectionTimeoutMS: 30000 });
        console.log(result.models);
        console.log("DB Connected Successfully ✅");
    }
    catch (error) {
        console.log("DB Fail To Connect ✖ ", error);
    }
};
exports.default = connectDB;
