import express from "express";
import type { Express, Request, Response } from "express";

import { resolve } from "node:path";
import { config } from "dotenv";
config({ path: resolve("./config/.env.development") });

import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import connectDB from "./DB/connection.db";

import authController from "./modules/Authentication/auth.controller";
import userController from "./modules/User/user.controller";
import { globalErrorHandling } from "./utils/Response/error.response";

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


    app.use(cors());
    app.use(helmet());
    app.use(limiter);

    
    app.use(express.json());

    //Routing
    app.get("/", (req: Request, res: Response) => {
        res.json({ message: "Welcome To Social Media App Backend Landing Page ➰💙" });
    })

    app.use("/auth", authController);
    app.use("/user", userController);

    app.use("{/*dummy}", (req: Request, res: Response) => {
        res.status(404).json({ message: "In-Valid Application Routing ❌" });
    })

    app.use(globalErrorHandling);


    app.listen(port, () => {
        console.log(`Server Is Running On Port ::: ${port}`);
    })

};

export default bootstrap;


 
