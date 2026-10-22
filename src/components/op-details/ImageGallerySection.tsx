"use client";

import { useState } from "react";
import { Upload, X, ZoomIn } from "lucide-react";

interface ImageItem {
  name: string;
  date: string;
  thumbnailUrl?: string;
}

interface ImageGallerySectionProps {
  title: string;
  roleLabel?: string;
  images: ImageItem[];
  isEditable?: boolean;
}

export function ImageGallerySection({ title, roleLabel, images, isEditable }: ImageGallerySectionProps) {
  const [activeImage, setActiveImage] = useState<ImageItem | null>(null);

  return (
    <div>
      <h3 className="text-sm font-bold text-[var(--color-foreground)] mb-3">
        <span className="text-[#1e40af]">{title}</span>
        {roleLabel && (
          <span className="text-[var(--color-primary)] font-normal text-xs ml-1">
            ({roleLabel})
          </span>
        )}
      </h3>
      <div className="flex gap-3 items-start overflow-x-auto pb-2">
        {images.map((img, idx) => (
          <div key={idx} className="flex flex-col items-center shrink-0">
            <div 
              onClick={() => img.thumbnailUrl && setActiveImage(img)}
              className={`w-[120px] h-[90px] rounded-lg overflow-hidden border border-[var(--color-border)] bg-[#F0F4F8] flex items-center justify-center relative group ${
                img.thumbnailUrl ? "cursor-pointer hover:border-[var(--color-primary)] transition-all shadow-xs" : ""
              }`}
            >
              {img.thumbnailUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.thumbnailUrl}
                    alt={img.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1a3a5c] to-[#0f2844] flex items-center justify-center">
                  <span className="text-white/50 text-xs">Preview</span>
                </div>
              )}
            </div>
            <span className="text-[10px] text-[var(--color-muted)] mt-1 truncate max-w-[120px]" title={img.name}>
              {img.name}
            </span>
            <span className="text-[10px] text-[var(--color-muted)]">{img.date}</span>
          </div>
        ))}

        {images.length === 0 && !isEditable && (
          <div className="text-xs text-[var(--color-muted)] py-4">No images uploaded</div>
        )}

        {isEditable && (
          <div className="flex flex-col items-center shrink-0">
            <button className="w-[80px] h-[90px] rounded-lg border-2 border-dashed border-[var(--color-border)] bg-white flex flex-col items-center justify-center gap-2 hover:border-[var(--color-primary)] hover:bg-blue-50/30 transition-colors cursor-pointer">
              <Upload className="w-5 h-5 text-[var(--color-muted)]" />
              <span className="text-[10px] text-[var(--color-muted)] font-medium leading-tight text-center">Upload Images</span>
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {activeImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setActiveImage(null)}
        >
          <div 
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-gray-900 text-white flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold truncate max-w-md">{activeImage.name}</h4>
                <p className="text-xs text-gray-400">{activeImage.date}</p>
              </div>
              <button 
                onClick={() => setActiveImage(null)}
                className="p-1 rounded-full hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-black flex items-center justify-center p-2 overflow-auto max-h-[75vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage.thumbnailUrl}
                alt={activeImage.name}
                className="max-h-[70vh] max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
