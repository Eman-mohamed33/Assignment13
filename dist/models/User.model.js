"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.genderEnum = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
var genderEnum;
(function (genderEnum) {
    genderEnum["male"] = "male";
    genderEnum["female"] = "female";
})(genderEnum || (exports.genderEnum = genderEnum = {}));
;
;
;
const userSchema = new mongoose_1.default.Schema({
    firstName: {
        type: String,
        required: true,
        min: [2, "The name must be more than or equal than 2"],
        max: [20, "The name must be less than or equal than 20"],
    },
    lastName: {
        type: String,
        required: true,
        min: [2, "The name must be more than or equal than 2"],
        max: [20, "The name must be less than or equal than 20"],
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: { values: Object.values(genderEnum), message: `Gender Only Allow ${Object.values(genderEnum)}` },
        default: genderEnum.male
    },
    phone: {
        type: String,
        required: true
    },
    confirmEmail: Date,
    confirmEmailOtp: {
        value: String,
        attempts: { type: Number, default: 0 },
        expiredAt: Date,
        banUntil: Date
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
userSchema.virtual("fullName").set(function (value) {
    const [firstName, lastName] = value?.split(" ") || [];
    this.set({ firstName, lastName });
});
userSchema.virtual("fullName").get(function () {
    return `${this.firstName} ${this.lastName}`;
});
exports.UserModel = mongoose_1.default.model("User", userSchema);
exports.UserModel.syncIndexes();
