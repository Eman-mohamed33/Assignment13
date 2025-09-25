"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.ProviderEnum = exports.RoleEnum = exports.GenderEnum = exports.BlockActionEnum = void 0;
const mongoose_1 = require("mongoose");
const Hash_security_1 = require("../../utils/Security/Hash.security");
const Encryption_security_1 = require("../../utils/Security/Encryption.security");
const email_event_1 = require("../../utils/Events/email.event");
var BlockActionEnum;
(function (BlockActionEnum) {
    BlockActionEnum["block"] = "block";
    BlockActionEnum["unblock"] = "unblock";
})(BlockActionEnum || (exports.BlockActionEnum = BlockActionEnum = {}));
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
    RoleEnum["superAdmin"] = "super-admin";
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
    slug: {
        type: String,
        required: true,
        minLength: 5,
        maxLength: 51,
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
    tempOldProfileImage: String,
    profileCoverImages: [String],
    deletedAt: Date,
    deletedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,
    restoredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    BlockList: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    stepVerificationOtp: String,
    enable2stepVerification: Boolean,
    friends: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    extra: {
        name: String
    },
}, {
    strictQuery: true,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
userSchema.virtual("userName").set(function (value) {
    const [firstName, lastName] = value?.split(" ") || [];
    this.set({ firstName, lastName, slug: value.replaceAll(/\s+/g, "-") });
});
userSchema.virtual("userName").get(function () {
    return `${this.firstName} ${this.lastName}`;
});
userSchema.pre("save", async function (next) {
    this.wasNew = this.isNew;
    if (this.isModified("password")) {
        this.password = await (0, Hash_security_1.generateHash)(this.password);
    }
    if (this.isModified("confirmEmailOtp") && this.confirmEmailOtp) {
        this.confirmEmailPlainOtp = this.confirmEmailOtp.value;
        this.confirmEmailOtp.value = await (0, Hash_security_1.generateHash)(this.confirmEmailOtp?.value);
    }
    if (this.isModified("phone")) {
        this.phone = await (0, Encryption_security_1.generateEncryption)({ plainText: this.phone });
    }
});
userSchema.post("save", function (doc, next) {
    const that = this;
    if (that.wasNew && that.confirmEmailPlainOtp) {
        email_event_1.emailEvent.emit("confirmEmail", { to: this.email, otp: that.confirmEmailPlainOtp, userEmail: this.email });
    }
    next();
});
userSchema.pre(["find", "findOne"], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, deletedAt: { $exists: false } });
    }
    next();
});
exports.UserModel = mongoose_1.models.User || (0, mongoose_1.model)("User", userSchema);
