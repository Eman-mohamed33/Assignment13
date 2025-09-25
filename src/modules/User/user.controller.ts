import { Router } from "express";
import { authentication, authorization } from "../../middleware/authentication.middleware";
import userService from "./user.service";
import { endPoint } from "./user.authorization";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./user.validation";
import { TokenEnum } from "../../utils/Security/token.security";
import { cloudFileUpload, fileValidation, StorageEnum } from "../../utils/Multer/cloud.multer";
const router: Router = Router();

router.get("/", authorization(endPoint.profile), userService.profile);
router.get("/dashboard", authorization(endPoint.dashboard), userService.dashboard);
router.get("/:userId", validation(validators.shareProfile),
    userService.shareProfile);


router.post("/logout", authentication(), validation(validators.logout), userService.logout);
router.post("/refresh-token", authentication(TokenEnum.refresh), userService.refreshToken);
router.post("/:userId/send-friend-request", authentication(),
    validation(validators.sentFriendRequest),
    userService.sendFriendRequest);



//router.patch("/profile-Photo", authentication(), cloudFileUpload({ validation: fileValidation.image, storageApproach: StorageEnum.memory }).single("photo"), userService.profilePhoto);
router.patch("/profile-Photo", authentication(), userService.profilePhoto);
router.patch("/profile-Cover-Photos", authentication(), cloudFileUpload({ validation: fileValidation.image, storageApproach: StorageEnum.disk }).array("photos", 5), userService.profileCoverPhotos);
router.patch("/:userId/restore-Account", authorization(endPoint.restore), validation(validators.restoreAccount), userService.restoreAccount);
router.patch("/:userId/change-role", authorization(endPoint.dashboard),
    validation(validators.changeRole),
    userService.changeRole);

router.patch("/update-password", authentication(), validation(validators.updatePassword), userService.updatePassword);
router.patch("/update-Personal-Info", authentication(), validation(validators.updateBasicInfo), userService.updateBasicInfo);
router.patch("/update-Email", authentication(), validation(validators.updateEmail), userService.updateEmail);

router.patch("/accept-friend-request/:requestId", authentication(),
    validation(validators.acceptFriendRequest),
    userService.acceptFriendRequest);

router.patch("/:userId/unfriend", authentication(),
    validation(validators.unfriend),
    userService.unfriend);

router.patch("/:userId/block", authentication(),
    validation(validators.blockUser),
    userService.blockUser);

router.delete("/delete-friend-request/:requestId", authentication(),
    validation(validators.deleteFriendRequest),
    userService.deleteFriendRequest);

    
router.delete("{/:userId}/freeze-Account", authentication(), validation(validators.freezeAccount), userService.freezeAccount);
router.delete("/:userId", authorization(endPoint.hardDelete), validation(validators.hardDelete), userService.hardDelete);


export default router;


