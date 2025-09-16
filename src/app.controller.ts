import express from "express";
import type { Express, Request, Response } from "express";

import { resolve } from "node:path";
import { config } from "dotenv";
config({ path: resolve("./config/.env.development") });

import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import connectDB from "./DB/connection.db";


import { authRouter, userRouter, postRouter } from "./modules";
// import { router as authRouter } from "./modules/Authentication";
// import { router as userRouter } from "./modules/User";

// import authController from "./modules/Authentication/auth.controller";
// import userController from "./modules/User/user.controller";
import { BadRequestException, globalErrorHandling } from "./utils/Response/error.response";

import { pipeline } from "node:stream";
import { promisify } from "node:util";
import { getFile } from "./utils/Multer/S3.config";

const createS3WriteStream = promisify(pipeline);

const limiter = rateLimit({
    windowMs: 60 * 60000,
    limit: 2000,
    message: { error: "Too Many Failed Requests ,Please Try Again later ❗" }
})

const bootstrap = async (): Promise<void> => {
    const app: Express = express();
    const port: number | string = process.env.PORT || 5000;

    
    //DB
    await connectDB();

    // Application-middleware
    app.use(cors());
    app.use(helmet());
    app.use(limiter);

    
    app.use(express.json());

    //App-Routing
    app.get("/", (req: Request, res: Response) => {
        res.json({ message: "Welcome To Social Media App Backend Landing Page ➰💙" });
    })

    //sub-Routing-modules
    app.use("/auth", authRouter);
    app.use("/user", userRouter);
    app.use("/post", postRouter);

    //get-Asset
    app.get("/upload/*path", async (req, res: Response): Promise<void> => {
        const { path } = req.params as { path: string[] };
        if (!path?.length) {
            throw new BadRequestException("")
        }

        const key = path?.join("/");
        const s3Response = await getFile({ Key: key });
        if (!s3Response?.Body) {
            throw new BadRequestException("Fail to fetch this resource");
        }
        res.setHeader(
            "Content-Type",
            s3Response.ContentType || "application/octet-stream");

        // for-download
       // res.setHeader("Content-Disposition", `attachments; filename="${key?.split("/").pop()}"`);
        return await createS3WriteStream(s3Response.Body as NodeJS.ReadableStream, res);
    });

    //test
    // app.get("/test", async (req, res): Promise<Response> => {
    //     // const { Key } = req.query as { Key: string };
    //     // const result = await deleteFile({ Key });
    //     // const result = await deleteFiles({
    //     //     urls: [
    //     //         "SOCIAL_MEDIA_APP/users/68b789d047e84b417fd2fef2/xkh_PXBbXAackgpXgcgQ7_pre_girl.jfif",
    //     //         "SOCIAL_MEDIA_APP/users/68b789d047e84b417fd2fef2/ssfk-nKH5y-kgCXKy_PDV_Colourful Calpe.jfif",
    //     //         "SOCIAL_MEDIA_APP/users/68b789d047e84b417fd2fef2/ES4PzB1NOs4XFgZ0U8L0P_442db73f-986c-4410-9de1-3457db141bc0.jfif"

    //     //     ],
    //     // })
    //     const result = await deleteFolderByPrefix({ path: "users/68b789d047e84b417fd2fef2/cover" });
    //     return res.json({ message: "Done", result });
    // })


    //get-Asset-By-preSignedUrl
    // app.get("/upload/signed/*path", async (req, res: Response): Promise<Response> => {
    //     const { path } = req.params as { path: string[] };
    //     if (!path?.length) {
    //         throw new BadRequestException("Validation Error", {
    //             validationErrors: {
    //                 key: "params",
    //                 issues: [{ path: "path", message: "missing asset path" }]
    //             }
    //         });
    //     }
    //     const key = path?.join("/");
    //     const url = await createPreSignedGetUrl({ Key: key });
    //     return res.json({ url });
    // });


    // test Hook
    // async function test() {
    //     try {
            
    //         const userModel =new UserRepository(UserModel);
    //         // const user = await userModel.findOne({
    //         //     filter: {
    //         //         gender: GenderEnum.male,
    //         //         paranoid:false
    //         //     },
    //         //     options: {
    //         //         lean:true
    //         //     }
                
    //         // }) as HUserDocument;

    //         //  const user = await userModel.findById({
    //         //      id: {
    //         //          _id: "68c6c11a914de992be7ca35d" as unknown as Types.ObjectId,
    //         //         paranoid:false
    //         //     }as unknown as Types.ObjectId,
                
    //         // }) as HUserDocument;

    //         // const user = await userModel.find({
    //         //     filter: {
    //         //         paranoid:false
    //         //     },
    //         //     options: { skip: 0, limit: 1 }
                

                
    //         // }) as HUserDocument[];
    //         // console.log(user);
    //         // const user = await userModel.updateOne({
    //         //     filter: {
    //         //         _id:"68c6f5bc45ce85076ea834bd"
    //         //     },
    //         //     update: {
    //         //         deletedAt: new Date()
    //         //     }
    //         // })

    //         //  const user = await userModel.findByIdAndUpdate({
                
    //         //      id: "68c6f5bc45ce85076ea834bd" as unknown as Types.ObjectId,
    //         //     update: {
    //         //         deletedAt: new Date()
    //         //     }
    //         // })

    //         // const user = await userModel.deleteOne({
    //         //     filter: {
    //         //         _id: "68c6f5bc45ce85076ea834bd" as unknown as Types.ObjectId,
        
    //         //     }
    //         // });

    //         // const user = await userModel.findOneAndDelete({
    //         //     filter: {
    //         //         _id: "68c81467a459bf69482994bf" as unknown as Types.ObjectId,
        
    //         //     }
    //         // });

    //         // const user = await userModel.insertMany({
    //         //     data: [
    //         //         {
    //         //             userName: "mohamed Emad",
    //         //             email: "eman.gesraha13@gmail.com",
    //         //             password: "dj486555",
    //         //             phone: "01065435554",
    //         //             gender: GenderEnum.male,
    //         //             age: 21,
    //         //             confirmEmailOtp: {
    //         //                 value: "569888",
    //         //                 attempts: 2,
    //         //                 expiredAt: new Date()
    //         //             }
    //         //         },
    //         //         {
    //         //             userName: "Ibra Emad",
    //         //             email: "gesraha13@gmail.com",
    //         //             password: "jh10462",
    //         //             phone: "0125556655",
    //         //             gender: GenderEnum.male,
    //         //             age: 21,
    //         //             confirmEmailOtp: {
    //         //                 value: "5552555",
    //         //                 attempts: 0,
    //         //                 expiredAt: new Date()
    //         //             }
    //         //         },
    //         //         {
    //         //             userName: "Emad Ges",
    //         //             email: "_Gesraha55@gmail.com",
    //         //             password: "aaw85545",
    //         //             phone: "0112469655",
    //         //             gender: GenderEnum.male,
    //         //             age: 40,
    //         //             confirmEmailOtp: {
    //         //                 value: "443222",
    //         //                 attempts: 4,
    //         //                 expiredAt: new Date()
    //         //             }
    //         //         }
    //         //     ]
    //         // });
    //         // console.log({ result: user });

    //     } catch (error) {
    //         console.log(error);
    //     }
        
    // }

    // test();

    //In-valid router
    app.use("{/*dummy}", (req: Request, res: Response) => {
        res.status(404).json({ message: "In-Valid Application Routing ❌" });
    })

    //global-error-handling
    app.use(globalErrorHandling);


    app.listen(port, () => {
        console.log(`Server Is Running On Port ::: ${port}`);
    })

};

export default bootstrap;


 

