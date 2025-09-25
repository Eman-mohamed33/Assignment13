import { Router } from "express";
import commentService from "./comment.service";
import { authentication } from "../../middleware/authentication.middleware";
import { cloudFileUpload, fileValidation } from "../../utils/Multer/cloud.multer";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./comment.validation";

const router: Router = Router({
    mergeParams: true
});


router.delete("/:commentId", authentication(),
    commentService.deleteComment);

router.post("/", authentication(),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 4),
    validation(validators.createComment),
    commentService.createComment);

router.post("/:commentId/reply", authentication(),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 4),
    validation(validators.replayOnComment),
    commentService.replayOnComment);


router.get("/:commentId", authentication(),
    validation(validators.getCommentById),
    commentService.getCommentById);

router.get("/:commentId/comment-with-reply", authentication(),
    validation(validators.getCommentWithReply),
    commentService.getCommentWithReply);




router.patch("/:commentId/update-comment", authentication(),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 4),
    validation(validators.updateComment),
    commentService.updateComment);




router.patch("/:commentId/delete", authentication(),
    validation(validators.freezeComment),
    commentService.freezeComment);

router.delete("/:commentId", authentication(),
    validation(validators.deleteComment),
    commentService.deleteComment);



export default router;