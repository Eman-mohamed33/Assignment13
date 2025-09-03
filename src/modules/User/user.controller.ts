import { Router } from "express";
import { authentication, authorization } from "../../middleware/authentication.middleware";
import userService from "./user.service";
import { endPoint } from "./user.authorization";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./user.validation";
import { TokenEnum } from "../../utils/Security/token.security";
const router: Router = Router();

router.get("/", authorization(endPoint.profile), userService.profile);


router.post("/logout", authentication(), validation(validators.logout), userService.logout);
router.post("/refresh-token", authentication(TokenEnum.refresh), userService.refreshToken);



export default router;