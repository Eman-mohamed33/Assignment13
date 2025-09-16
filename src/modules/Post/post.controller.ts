import postService from "./post.service";
import { Router } from "express";
import { authentication } from "../../middleware/authentication.middleware";
import { cloudFileUpload, fileValidation } from "../../utils/Multer/cloud.multer";
import * as validators from "./post.validation";
import { validation } from "../../middleware/validation.middleware";
const router: Router = Router();

router.post("/", authentication(),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 4),
    validation(validators.createPost), postService.createPost);

    
router.patch("/:postId/like", authentication(),
    validation(validators.likePost),
    postService.likePost);

export default router;