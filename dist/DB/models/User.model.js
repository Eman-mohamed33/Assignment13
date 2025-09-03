"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.ProviderEnum = exports.RoleEnum = exports.GenderEnum = void 0;
const mongoose_1 = require("mongoose");
var GenderEnum;
(function (GenderEnum) {
    GenderEnum["male"] = "male";
    GenderEnum["female"] = "female";
})(GenderEnum || (exports.GenderEnum = GenderEnum = {}));
;
var RoleEnum;
(function (RoleEnum) {
    RoleEnum["user"] = "user";
    RoleEnum["admin"] = "admin";
})(RoleEnum || (exports.RoleEnum = RoleEnum = {}));
;
var ProviderEnum;
(function (ProviderEnum) {
    ProviderEnum["google"] = "google";
    ProviderEnum["system"] = "system";
})(ProviderEnum || (exports.ProviderEnum = ProviderEnum = {}));
;
;
const userSchema = new mongoose_1.Schema({
    firstName: {
        type: String,
        required: true,
        minLength: [2, "The name must be more than or equal than 2"],
        maxLength: [20, "The name must be less than or equal than 20"],
    },
    lastName: {
        type: String,
        required: true,
        minLength: [2, "The name must be more than or equal than 2"],
        maxLength: [20, "The name must be less than or equal than 20"],
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    confirmEmail: Date,
    confirmEmailOtp: {
        value: String,
        attempts: {
            type: Number, required: function () {
                return this.provider === ProviderEnum.google ? false : true;
            }
        },
        expiredAt: Date,
        banUntil: Date
    },
    password: {
        type: String,
        required: function () {
            return this.provider === ProviderEnum.google ? false : true;
        }
    },
    resetPasswordOtp: { type: String },
    changeCredentialsTime: { type: Date },
    gender: {
        type: String,
        enum: { values: Object.values(GenderEnum), message: `Gender Only Allow ${Object.values(GenderEnum)}` },
        default: GenderEnum.male
    },
    role: {
        type: String,
        enum: { values: Object.values(RoleEnum), message: `Role Only Allow ${Object.values(RoleEnum)}` },
        default: RoleEnum.user
    },
    provider: {
        type: String,
        enum: { values: Object.values(ProviderEnum), message: `Provider Only Allow ${Object.values(ProviderEnum)}` },
        default: ProviderEnum.system
    },
    phone: {
        type: String,
    },
    address: {
        type: String
    },
    age: {
        type: Number
    },
    profileImage: String,
    profileCoverImages: [String]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
userSchema.virtual("userName").set(function (value) {
    const [firstName, lastName] = value?.split(" ") || [];
    this.set({ firstName, lastName });
});
userSchema.virtual("userName").get(function () {
    return `${this.firstName} ${this.lastName}`;
});
exports.UserModel = mongoose_1.models.User || (0, mongoose_1.model)("User", userSchema);
