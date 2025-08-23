import mongoose, { Document } from "mongoose";

export enum genderEnum {
    male = "male",
    female="female"
};

interface IUser extends Document{
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    gender: genderEnum,
    phone: string,
    confirmEmail: Date,
    confirmEmailOtp: {
        value: string,
        attempts: number,
        expiredAt: Date,
        banUntil: Date
    }
    
};

// interface IUserModel extends Model<IUser>{

//     findByObjectId(_id: Types.ObjectId): Promise<IUser | null>;
    
// };


const userSchema = new mongoose.Schema<IUser>({
    firstName: {
        type: String,
        required: true,
        min: [2, "The name must be more than or equal than 2"],
        max: [20, "The name must be less than or equal than 20"],
    }
    ,
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
    

},
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    });

userSchema.virtual("fullName").set(function (value: string) {
    const [firstName, lastName] = value?.split(" ") || [];
    this.set({ firstName, lastName });
});

userSchema.virtual("fullName").get(function () {
    return `${this.firstName} ${this.lastName}`;
});


export const UserModel =  mongoose.model<IUser>("User", userSchema);
UserModel.syncIndexes();