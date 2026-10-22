"use client";

import { useState, useRef } from "react";
import { Camera, Image as ImageIcon, CheckCircle2, AlertCircle, ZoomIn, X, Loader2 } from "lucide-react";

interface MobileImageCardProps {
  title: string;
  subtitle?: string;
  category: "x-ray" | "treatment-plan" | "doctor-visit";
  opNumber: string;
  visitId?: string;
  existingImageUrl?: string;
  existingFilename?: string;
  existingUploadedAt?: string;
  onUploadSuccess: (newImageUrl: string) => void;
}

/**
 * Compresses an image client-side to preserve clinical contrast and sharpness
 * while reducing transfer size from 15MB+ to ~700KB - 1.2MB.
 */
async function compressImage(file: File, isXRay: boolean): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const MAX_DIM = 2560; // Up to 2.5K resolution preserves clinical detail
        let { width, height } = img;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file); // fallback to original
          return;
        }

        // Draw image with high quality interpolation
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Quality: 0.92 for X-rays (contrast critical), 0.88 for other clinical photos
        const quality = isXRay ? 0.92 : 0.88;
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image for processing"));
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
  });
}

export function MobileImageCard({
  title,
  subtitle,
  category,
  opNumber,
  visitId,
  existingImageUrl,
  existingFilename,
  existingUploadedAt,
  onUploadSuccess,
}: MobileImageCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showLightbox, setShowLightbox] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus(null);
    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    // Reset input so user can choose same file again if desired
    e.target.value = "";
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    setIsCompressing(true);
    setStatus(null);

    try {
      // 1. Client-side clinical compression
      const isXRay = category === "x-ray";
      const compressedBlob = await compressImage(selectedFile, isXRay);
      setIsCompressing(false);

      // 2. Prepare upload
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", compressedBlob, selectedFile.name || `${category}.jpg`);
      formData.append("category", category);
      formData.append("opNumber", opNumber);
      if (visitId) {
        formData.append("visitId", visitId);
      }

      // 3. Upload with XHR to track progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              setStatus({ type: "success", message: "Image uploaded successfully!" });
              onUploadSuccess(res.image.fileUrl);
              setSelectedFile(null);
              setPreviewUrl(null);
              resolve();
            } catch {
              reject(new Error("Invalid response from server"));
            }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.error || `Upload failed (${xhr.status})`));
            } catch {
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Network connection error during upload"));
        xhr.send(formData);
      });
    } catch (err) {
      console.error("Upload error:", err);
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Upload failed. Please try again.",
      });
    } finally {
      setIsCompressing(false);
      setIsUploading(false);
    }
  };

  const handleCancelSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setStatus(null);
  };

  const currentActiveUrl = previewUrl || existingImageUrl;

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-xs p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold text-[var(--color-foreground)]">{title}</h3>
          {subtitle && <p className="text-xs text-[var(--color-muted)] mt-0.5">{subtitle}</p>}
        </div>
        {existingImageUrl && !previewUrl && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Uploaded
          </span>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Status Alert */}
      {status && (
        <div
          className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
            status.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      {/* Image Preview Container */}
      <div className="relative w-full h-48 bg-[#F0F4F8] rounded-lg border border-[var(--color-border)] overflow-hidden flex items-center justify-center group">
        {currentActiveUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentActiveUrl}
              alt={title}
              className="w-full h-full object-contain"
            />
            {/* Lightbox Trigger */}
            <button
              type="button"
              onClick={() => setShowLightbox(currentActiveUrl)}
              className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-md opacity-80 hover:opacity-100 transition-opacity"
              title="Inspect Full Size"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {previewUrl && (
              <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-semibold rounded shadow-xs">
                Pending Confirmation
              </span>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-[var(--color-muted)] gap-1 p-4 text-center">
            <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
            <span className="text-xs font-medium">No image uploaded</span>
            <span className="text-[10px] opacity-70">Capture using camera or choose from gallery</span>
          </div>
        )}
      </div>

      {/* Metadata if existing */}
      {existingImageUrl && !previewUrl && (
        <div className="text-[11px] text-[var(--color-muted)] flex items-center justify-between px-1">
          <span className="truncate max-w-[200px]" title={existingFilename || ""}>
            {existingFilename || "Attached file"}
          </span>
          {existingUploadedAt && (
            <span>{new Date(existingUploadedAt).toLocaleDateString("en-IN")}</span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {(isCompressing || isUploading) && (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-medium text-[var(--color-foreground)]">
            <span>{isCompressing ? "Optimizing clinical resolution..." : "Uploading..."}</span>
            <span>{isCompressing ? "Processing" : `${uploadProgress}%`}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                isCompressing ? "bg-amber-500 animate-pulse w-full" : "bg-[var(--color-primary)]"
              }`}
              style={{ width: isCompressing ? "100%" : `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!previewUrl ? (
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isCompressing || isUploading}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#0F3157] text-white rounded-lg text-xs font-semibold hover:bg-[#1a4473] active:scale-98 transition-all disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            <span>Take Photo</span>
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={isCompressing || isUploading}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white border border-[var(--color-border)] text-[var(--color-foreground)] rounded-lg text-xs font-semibold hover:bg-gray-50 active:scale-98 transition-all disabled:opacity-50"
          >
            <ImageIcon className="w-4 h-4 text-[var(--color-primary)]" />
            <span>{existingImageUrl ? "Replace" : "Gallery"}</span>
          </button>
        </div>
      ) : (
        /* Confirmation Mode */
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            type="button"
            onClick={handleCancelSelection}
            disabled={isCompressing || isUploading}
            className="py-2 px-3 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmUpload}
            disabled={isCompressing || isUploading}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 active:scale-98 transition-all disabled:opacity-50"
          >
            {isCompressing || isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Upload</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col p-4 backdrop-blur-xs"
          onClick={() => setShowLightbox(null)}
        >
          <div className="flex items-center justify-between text-white pb-3 border-b border-gray-800">
            <span className="text-sm font-semibold truncate">{title}</span>
            <button
              onClick={() => setShowLightbox(null)}
              className="p-1 rounded-full hover:bg-gray-800 text-gray-300 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-2 overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={showLightbox}
              alt={title}
              className="max-h-[80vh] max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
