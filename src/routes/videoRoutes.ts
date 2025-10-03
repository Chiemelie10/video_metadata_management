import { Router } from "express";
import { validateToken } from "../middlewares/gate/validateToken";
import { assembleChunks, createVideoMetadata, deleteVideo, getVideo, getVideos, updateVideoMetadata, uploadVideo } from "../controllers/videoController";
import { upload } from "../config/videoUpload";
import { validateVideoMetadata } from "../middlewares/video/videoMetadataRequest";
import { validateUploadVideoData } from "../middlewares/video/uploadVideoRequest";
import { videoRoutePolicy } from "../middlewares/gate/videoRoute";

const router = Router();

router.get("", validateToken, getVideos);
router.get("/:id", validateToken, getVideo);
router.post("", [validateToken, validateVideoMetadata], createVideoMetadata);
router.post("/:id/upload", [validateToken, videoRoutePolicy, upload.single("video"), validateUploadVideoData], uploadVideo);
router.patch("/:id/complete", [validateToken, videoRoutePolicy], assembleChunks);
router.put("/:id/", [validateToken, videoRoutePolicy, validateVideoMetadata], updateVideoMetadata);
router.delete("/:id/", [validateToken, videoRoutePolicy], deleteVideo);

export default router;
