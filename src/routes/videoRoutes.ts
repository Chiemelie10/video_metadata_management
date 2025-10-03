import { Router } from "express";
import { validateToken } from "../middlewares/gate/validateToken";
import { assembleChunks, createVideoMetadata, deleteVideo, getVideo, getVideos, updateVideoMetadata, uploadVideo } from "../controllers/videoController";
import { upload } from "../config/videoUpload";
import { validateVideoMetadata } from "../middlewares/video/videoMetadataRequest";
import { validateUploadVideoData } from "../middlewares/video/uploadVideoRequest";

const router = Router();

router.get("", validateToken, getVideos);
router.get("", validateToken, getVideo);
router.post("", [validateToken, validateVideoMetadata], createVideoMetadata);
router.post("/:id/upload", [upload.single("video"), validateUploadVideoData], uploadVideo);
router.post("/:id/complete", validateToken, assembleChunks);
router.put("/:id/", validateToken, updateVideoMetadata);
router.delete("/:id/", validateToken, deleteVideo);

export default router;
