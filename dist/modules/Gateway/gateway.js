"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIo = exports.initializeIo = exports.socketValidation = exports.connectedSockets = void 0;
const socket_io_1 = require("socket.io");
const token_security_1 = require("../../utils/Security/token.security");
const chat_gateway_1 = require("../Chat/chat.gateway");
const error_response_1 = require("../../utils/Response/error.response");
const chat_validation_1 = require("../Chat/chat.validation");
let io = undefined;
exports.connectedSockets = new Map();
const socketValidation = (schema) => {
    return async (socket, next) => {
        try {
            const originalOn = socket.on.bind(socket);
            socket.on = (event, listener) => {
                if (!schema[event]) {
                    return originalOn(event, listener);
                }
                const wrappedListener = (...args) => {
                    const [data, ack] = args;
                    const validation = schema[event]?.safeParse(data);
                    if (!validation?.success) {
                        const errors = validation?.error;
                        const formattedError = new error_response_1.BadRequestException("Validation Error", {
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
        }
        catch (error) {
            next(error);
        }
    };
};
exports.socketValidation = socketValidation;
const initializeIo = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "*"
        }
    });
    io.use(async (socket, next) => {
        try {
            const { user, decoded } = await (0, token_security_1.decodeToken)({
                authorization: socket.handshake?.auth.authorization || "",
                tokenType: token_security_1.TokenEnum.access
            });
            let userTabs = exports.connectedSockets.get(user._id.toString()) || [];
            userTabs.push(socket.id);
            exports.connectedSockets.set(user._id.toString(), userTabs);
            socket.credentials = {
                user, decoded
            };
            next();
        }
        catch (error) {
            next(error);
        }
    });
    io.use((0, exports.socketValidation)(chat_validation_1.messages));
    function disconnection(socket) {
        socket.on("disconnect", () => {
            const userId = socket.credentials?.user._id?.toString();
            let remainingTabs = exports.connectedSockets.get(userId)?.filter(tab => {
                return tab !== socket.id;
            });
            if (remainingTabs?.length) {
                exports.connectedSockets.set(userId, remainingTabs);
            }
            else {
                exports.connectedSockets.delete(userId);
                (0, exports.getIo)().emit("offline_user", userId);
            }
            console.log(`logout from ::: ${socket.id}`);
            console.log({ afterDisconnect: exports.connectedSockets });
        });
    }
    const chatGateway = new chat_gateway_1.ChatGateway();
    io.on("connection", (socket) => {
        console.log(`public channel :::`, socket.credentials?.user._id?.toString());
        console.log({ connectedSockets: exports.connectedSockets });
        chatGateway.register(socket, (0, exports.getIo)());
        disconnection(socket);
        socket.emit("productStock", { product: "5d5cd", quantity: "45" });
    });
};
exports.initializeIo = initializeIo;
const getIo = () => {
    if (!io) {
        throw new error_response_1.BadRequestException("Fail to stablish server socket io");
    }
    return io;
};
exports.getIo = getIo;
