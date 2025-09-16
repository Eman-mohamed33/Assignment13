import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { generateHash } from "../../utils/Security/Hash.security";
import { generateEncryption } from "../../utils/Security/Encryption.security";
import { emailEvent } from "../../utils/Events/email.event";

//import { emailEvent } from "../../utils/Events/email.event";




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
    slug: string;


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


    stepVerificationOtp?: string;
    enable2stepVerification?: boolean;

    extra: {
        name: string;
    };
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
    slug: {
        type: String,
        required: true,
        minLength: 5,
        maxLength: 51,
    }
    ,

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
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,
    restoredBy: { type: Schema.Types.ObjectId, ref: "User" },

    stepVerificationOtp: String,
    enable2stepVerification: Boolean,

    extra: {
        name: String
    },
},
    {
        strictQuery:true,
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    });

userSchema.virtual("userName").set(function (value: string) {
    const [firstName, lastName] = value?.split(" ") || [];
    this.set({ firstName, lastName, slug: value.replaceAll(/\s+/g, "-") });
});

userSchema.virtual("userName").get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// userSchema.pre("init", function (doc) {
//     console.log(this);
//     console.log(doc);
// });

// userSchema.pre("save", async function (this: HUserDocument & { wasNew: boolean }, next) {
//     this.isNew = this.wasNew || this.isModified("email");
//     console.log({
//         Pre_save: this, password: this.isModified("password"),
//         modifiedPaths: this.modifiedPaths(),
//         new: this.isNew,
//         DirectModifiedPaths: this.directModifiedPaths(),
//         IsDirectModified: this.isDirectModified("confirmEmailOtp.attempts"),
//         IsSelected: this.isSelected("extra"),
//         IsDirectSelected: this.isDirectSelected("extra"),
//         IsInit: this.isInit("lastName")
//     });
//     if (this.isModified("password")) {
//         this.password = await generateHash(this.password);
//     }
   
//     //next();
// });

// userSchema.post("save", function (doc, next) {
//     const that = this as HUserDocument & { wasNew: boolean };

//     console.log({
//         Post_save: this, doc,
//         new: that.wasNew
//     });
//     if (that.wasNew) {
//         emailEvent.emit("confirmEmail", { to: this.email, otp: 54545 });
        
//     }

//     next();
// })

// userSchema.pre("updateOne", { document: true, query: false }, function (next) {
//     console.log({ this: this });
//     next();
// });


// userSchema.pre("deleteOne", { document: true, query: false }, function (next) {
//     console.log({ this: this });
//     next();
// });

// userSchema.pre(["find","findOne"], function (next) {
//     const query = this.getQuery();
//     this.setOptions({ lean: true, skip: 0 });
    
//     console.log({
//         this: this,
//         query,
//         options: this.getOptions(),
//      //   op: this.op,
//         model: this.model,
//       //  document:this.model()
//     });

//     if (query.paranoid === false) {
//         this.setQuery({ ...query });
//     } else {
//         this.setQuery({ ...query, deletedAt: { $exists: false } });
//     }
//     this.populate([{ path: "deletedBy" }]);
    
//     console.log({fQ:this.getQuery()});
    
//     next();
// })


// userSchema.pre("updateOne", function (next) {
//     const query = this.getQuery();
//     const update = this.getUpdate() as UpdateQuery<HUserDocument>;
    
//     if (update.deletedAt) {
//     this.setUpdate({ ...update, changeCredentialsTime: new Date() });
        
//     }
//     console.log({ query,update });

//     next();
// })


// userSchema.post("updateOne", async function (doc, next) {
//     const query = this.getQuery();
//     const update = this.getUpdate() as UpdateQuery<HUserDocument>;
    
//     if (update['$set'].changeCredentialsTime) {
//         const tokenModel = new TokenRepository(TokenModel);
//         await tokenModel.deleteMany({
//             filter: { userId: query._id }
//         })
//     }
//     console.log({ query, update });
    
// });

// userSchema.pre(["findOneAndUpdate","updateOne"], function (next) {
//     const query = this.getQuery();
//     const update = this.getUpdate() as UpdateQuery<HUserDocument>;
    
//     if (update.deletedAt) {
//     this.setUpdate({ ...update, changeCredentialsTime: new Date() });
        
//     }
//     console.log({ query,update });

//     next();
// })


// userSchema.post(["findOneAndUpdate","updateOne"], async function (doc, next) {
//     const query = this.getQuery();
//     const update = this.getUpdate() as UpdateQuery<HUserDocument>;
    
//     if (update['$set'].changeCredentialsTime) {
//         const tokenModel = new TokenRepository(TokenModel);
//         await tokenModel.deleteMany({
//             filter: { userId: query._id }
//         })
//     }
//     console.log({ query, update });
    
// });

// userSchema.post(["deleteOne","findOneAndDelete"], async function (doc, next) {
//     const query = this.getQuery();
    
    
//         const tokenModel = new TokenRepository(TokenModel);
//         await tokenModel.deleteMany({
//             filter: { userId: query._id }
//         })
  
//     console.log({ query });
    
// });


// userSchema.pre("insertMany",async function (next,docs) {
//     console.log({ this: this, docs: docs });

//     for (const doc of docs) {
//         doc.password = await generateHash(doc.password);
//     }

    
// })

userSchema.pre("save", async function (this: HUserDocument & { wasNew: boolean, confirmEmailPlainOtp: string }, next) {
    this.wasNew = this.isNew;

    if (this.isModified("password")) {
        this.password = await generateHash(this.password);
    }

    if (this.isModified("confirmEmailOtp") && this.confirmEmailOtp) {
        this.confirmEmailPlainOtp = this.confirmEmailOtp.value;
        this.confirmEmailOtp.value = await generateHash(this.confirmEmailOtp?.value as string);
    }

    if (this.isModified("phone")) {
        this.phone = await generateEncryption({ plainText: this.phone });
    }
});

userSchema.post("save", function (doc, next) {
    const that = this as HUserDocument & { wasNew: boolean, confirmEmailPlainOtp: string };
    if (that.wasNew && that.confirmEmailPlainOtp) {
        emailEvent.emit("confirmEmail", { to: this.email, otp: that.confirmEmailPlainOtp, userEmail: this.email });
    }
    next(); 
});

userSchema.pre(["find", "findOne"], function (next) {
    
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    } else {
        this.setQuery({ ...query, deletedAt: { $exists: false } });
    }
    next();
});


export const UserModel = models.User || model<IUser>("User", userSchema);
export type HUserDocument = HydratedDocument<IUser>;


