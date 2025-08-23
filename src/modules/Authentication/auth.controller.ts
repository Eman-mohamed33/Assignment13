import { Router } from "express";
import authService from "./auth.service";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./auth.validation";
const router: Router = Router();

router.post("/signup", validation(validators.signup), authService.signup);
router.post("/login", validation(validators.login), authService.login);
router.patch("/confirm-email", authService.confirmEmail);
router.patch("/resend-confirm-email", authService.resendConfirmationEmail);


export default router;




