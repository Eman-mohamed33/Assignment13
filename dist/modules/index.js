"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postRouter = exports.userRouter = exports.authRouter = void 0;
var Authentication_1 = require("./Authentication");
Object.defineProperty(exports, "authRouter", { enumerable: true, get: function () { return Authentication_1.router; } });
var User_1 = require("./User");
Object.defineProperty(exports, "userRouter", { enumerable: true, get: function () { return User_1.router; } });
var Post_1 = require("./Post");
Object.defineProperty(exports, "postRouter", { enumerable: true, get: function () { return Post_1.router; } });
