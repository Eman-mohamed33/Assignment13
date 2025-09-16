import { Router } from "express";
import authService from "./auth.service";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./auth.validation";
const router: Router = Router();

router.post("/signup", validation(validators.signup), authService.signup);
router.post("/login", validation(validators.login), authService.login);
router.post("/login-confirmation", authService.loginConfirmation);

router.post("/signupWithGmail", validation(validators.gmailValidation), authService.signupWithGmail);
router.post("/loginWithGmail", validation(validators.gmailValidation), authService.loginWithGmail);

router.patch("/confirm-email", validation(validators.confirmEmail),authService.confirmEmail);
router.patch("/resend-confirm-email", authService.resendConfirmationEmail);

router.patch("/send-forgot-password-code", validation(validators.forgotPasswordCode), authService.findYourAccount_sendForgotPasswordCode);
router.patch("/verify-forgot-password-code", validation(validators.verifyForgotPasswordCode), authService.verifyForgotPasswordCode);
router.patch("/reset-your-new-password", validation(validators.resetYourNewPassword), authService.resetYourPassword);




export default router;




