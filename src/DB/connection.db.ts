import { connect } from "mongoose";
import { UserModel } from "./models/User.model";

const connectDB = async (): Promise<void> => {
    try {
        const URI: string | undefined = process.env.DB_URL || "";
        const result = await connect(URI, { serverSelectionTimeoutMS: 30000 });
        UserModel.syncIndexes();
        console.log(result.models);
        console.log("DB Connected Successfully ✅");
    } catch (error) {
        console.log("DB Fail To Connect ✖ ", error);
    }
};

export default connectDB;