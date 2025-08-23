import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const URL: string | undefined = process.env.DB_URL || "";
        const result = await mongoose.connect(URL, { serverSelectionTimeoutMS: 30000 });
        console.log(result.models);
        console.log("DB Connected Successfully ✅");
    } catch (error) {
        console.log("DB Fail To Connect ✖ ", error);
    }
};

export default connectDB;