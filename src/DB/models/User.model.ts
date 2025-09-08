import { HydratedDocument, model, models, Schema, Types } from "mongoose";

export enum GenderEnum {
    male = "male",
    female="female"
};

export enum RoleEnum{
    user = "user",
    admin="admin"
};

export enum ProviderEnum{
    google = "google",
    system = "system"
};

export interface IUser {
    _id: Types.ObjectId;

    userName?: string;
    firstName: string;
    lastName: string;


    email: string;
    confirmEmail: Date;
    confirmEmailOtp?: {
        value: string,
        attempts: number,
        expiredAt: Date,
        banUntil?: Date
    };


    password: string;
    resetPasswordOtp?:string,
    changeCredentialsTime: Date;


    gender: GenderEnum;
    role: RoleEnum;

    phone?: string;
    address?: string;
    age?: number;
    
    createdAt: Date;
    updatedAt?: Date;

    provider: ProviderEnum;
    profileImage?: string;
    tempOldProfileImage?:string
    profileCoverImages?: string[];


    deletedAt?: Date;
    deletedBy?: Types.ObjectId;
    restoredAt?: Date,
    restoredBy?: Types.ObjectId;

};


const userSchema = new Schema<IUser>({
    firstName: {
        type: String,
        required: true,
        minLength: [2, "The name must be more than or equal than 2"],
        maxLength: [20, "The name must be less than or equal than 20"],
    }
    ,
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
    tempOldProfileImage:String,
    profileCoverImages: [String],

    deletedAt: Date,
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,
    restoredBy: { type: Schema.Types.ObjectId, ref: "User" },

},
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    });

userSchema.virtual("userName").set(function (value: string) {
    const [firstName, lastName] = value?.split(" ") || [];
    this.set({ firstName, lastName });
});

userSchema.virtual("userName").get(function () {
    return `${this.firstName} ${this.lastName}`;
});


export const UserModel = models.User || model<IUser>("User", userSchema);
export type HUserDocument = HydratedDocument<IUser>;