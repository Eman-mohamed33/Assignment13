import { postService } from "./post.service";
import { Router } from "express";
import { authentication, authorization } from "../../middleware/authentication.middleware";
import { cloudFileUpload, fileValidation } from "../../utils/Multer/cloud.multer";
import * as validators from "./post.validation";
import { validation } from "../../middleware/validation.middleware";
import { commentRouter } from "../Comment";
import { endPoint } from "./post.authorization";

const router: Router = Router();

router.use("/:postId/comment", commentRouter);

router.get("/posts", authentication(),
    postService.postsList
);

router.get("/posts-With-Comments", authentication(),
    postService.getPostWithComments
);

router.get("/:postId", authentication(),
    validation(validators.getPostById),
    postService.getPostById);

router.post("/", authentication(),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 4),
    validation(validators.createPost),
    postService.createPost);

    
router.patch("/:postId/like", authentication(),
    validation(validators.likePost),
    postService.likePost);


router.patch("/:postId", authentication(),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 4),
    validation(validators.updatePost),
    postService.updatePost);


router.patch("/:postId/delete", authentication(),
    validation(validators.freezePostAndDeletePost),
    postService.freezePost);

router.delete("/:postId", authorization(endPoint.deletePost),
    validation(validators.freezePostAndDeletePost),
    postService.deletePost);


export default router;