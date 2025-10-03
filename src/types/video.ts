import { UUID } from "crypto";
import { Tag } from "../models/Tag";
import { Genre } from "../models/Genre";

export enum UploadStatus {
    PENDING = "pending",
    UPLOADING = "uploading",
    COMPLETE = "complete"
}

export interface UploadVideoData {
    totalChunks: number;
    chunkIndex: number;
}

export interface UploadVideoFieldError {
    totalChunks?: string[];
    chunkIndex?: string[];
}

export interface ValidateVideoMetadata {
    description: string;
    title: string;
    tags?: string[];
    genres?: UUID[];
}

export interface ValidatedVideoMetadata {
    description: string;
    title: string;
    tags?: Tag[];
    genres?: Genre[];
}

export interface VidMetadateFieldError {
    description?: string[];
    title?: string[];
    tags?: string[];
    genres?: string[];
}

export interface VideoFilter {
    page?: number;
    size?: number;
    title?: string;
    status?: string;
    tag?: string;
    genreId?: string;
}
