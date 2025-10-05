import { Server } from "socket.io";
import { Server as httpServer } from "node:http";
import { decodeToken, TokenEnum } from "../../utils/Security/token.security";
import { IAuthSocket } from "./gateway.interface";
import { ChatGateway } from "../Chat/chat.gateway";
import { BadRequestException } from "../../utils/Response/error.response";
import z, { ZodError } from "zod";
import { messages } from "../Chat/chat.validation";


let io: undefined | Server = undefined;
export let connectedSockets = new Map<string, string[]>();


type SocketSchema = Record<string, z.ZodObject<any>>;

export const socketValidation = (schema: SocketSchema) => {
  return async (socket: IAuthSocket, next: (err?: any) => void) => {
    try {
    
      const originalOn = socket.on.bind(socket);

      socket.on = (event: string, listener: (...args: any[]) => void) => {
        
        if (!schema[event]) {
          return originalOn(event, listener);
        }

       
        const wrappedListener = (...args: any[]) => {
          const [data, ack] = args;

            const validation = schema[event]?.safeParse(data);
            
          if (!validation?.success) {
            const errors = validation?.error as ZodError;
            const formattedError = new BadRequestException("Validation Error", {
              key: event,
              issues: errors.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
              })),
            });

            if (typeof ack === "function") {
              return ack({ error: formattedError });
            }

            return socket.emit("custom_error", formattedError);
          }
          listener(validation.data, ack);
        };

        return originalOn(event, wrappedListener);
      };

      next();
    } catch (error:any) {
        next(error);
    }
  };
};

export const initializeIo = (httpServer: httpServer) => {

      //let connectedSockets: string[] = [];
    

    // Initialize Io
    io = new Server(httpServer, {
        cors: {
            origin: "*"
        }
    });


    // middleware 
    io.use(async (socket: IAuthSocket, next) => {
        try {

            //  console.log(socket.handshake?.auth.authorization);
            // next(new BadRequestException("Fail in auth middleware"));
          
            const { user, decoded } = await decodeToken({
                authorization: socket.handshake?.auth.authorization || "",
                tokenType: TokenEnum.access
            });
            
            let userTabs = connectedSockets.get(user._id.toString()) || [];
            userTabs.push(socket.id);
            connectedSockets.set(user._id.toString(), userTabs);
            socket.credentials = {
                user, decoded
                
            };
            
            next();
            
        } catch (error: any) {
            next(error);
        }
    
    });

    // validation
    io.use(socketValidation(messages))

    // Disconnection
    function disconnection(socket: IAuthSocket) {
        socket.on("disconnect", () => {
            const userId = socket.credentials?.user._id?.toString() as string;
            let remainingTabs = connectedSockets.get(userId)?.filter(tab => {
                return tab !== socket.id;
            });

            if (remainingTabs?.length) {
                connectedSockets.set(userId, remainingTabs);
            } else {
                connectedSockets.delete(userId);
                getIo().emit("offline_user", userId);
            }
           
            console.log(`logout from ::: ${socket.id}`);
            console.log({ afterDisconnect: connectedSockets });
        });

    }


    //Listen to http://localhost:3000/
    const chatGateway: ChatGateway = new ChatGateway();

    io.on("connection", (socket: IAuthSocket) => {
        
        console.log(`public channel :::`, socket.credentials?.user._id?.toString() as string);
        console.log({ connectedSockets });
       // console.log(connectedSockets.get("68c82a0ab185dd2b31a6efea"));

        chatGateway.register(socket, getIo());
        //connectedSockets.push(socket.id);
        
        disconnection(socket);
        

        // socket.broadcast.emit("productStock", { product: "5d5cd", quantity: "45" }, (res: string) => {
        //     console.log({ res });
            
        socket.emit("productStock", { product: "5d5cd", quantity: "45" }
            // , (res: string) => {
            // console.log({ res });
            // }
        );
        //  io.to(connectedSockets[connectedSockets.length-2] as string).emit("productStock", { product: "5d5cd", quantity: "45" }, (res: string) => {
        //     console.log({ res });
        // })

            
        //  io.to(connectedSockets).emit("productStock", { product: "5d5cd", quantity: "45" }, (res: string) => {
        //     console.log({ res });
        // })

        //  socket.to(connectedSockets).emit("productStock", { product: "5d5cd", quantity: "45" }, (res: string) => {
        //     console.log({ res });
        // })

        //   socket.to(connectedSockets[connectedSockets.length-2]as string).emit("productStock", { product: "5d5cd", quantity: "45" }, (res: string) => {
        //     console.log({ res });
        //   })
        
        //    socket.except(connectedSockets[connectedSockets.length-2]as string).emit("productStock", { product: "5d5cd", quantity: "45" }, (res: string) => {
        //     console.log({ res });
        // })

        //    socket.except(connectedSockets).emit("productStock", { product: "5d5cd", quantity: "45" }, (res: string) => {
        //     console.log({ res });
        // })

        //   io.except(connectedSockets).emit("productStock", { product: "5d5cd", quantity: "45" }, (res: string) => {
        //     console.log({ res });
        // })


        // io.except(connectedSockets[connectedSockets.length - 2] as string).emit("productStock", { product: "5d5cd", quantity: "45" }, (res: string) => {
        //     console.log({ res });
        // });
       
    });

  
// new Channel
    // io.of("/admin").on("connection", (socket: Socket) => {
    //     console.log(`admin channel ::: ${socket.id}`);
    //     socket.on("disconnect", () => {
    //         console.log(`logout from ::: ${socket.id}`);
    //     });
    // });


}


export const getIo = (): Server => {
    if (!io) {
        throw new BadRequestException("Fail to stablish server socket io");
    }
    return io;
}