import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  images: File[];
  existingImages?: { url: string; publicId: string }[];
  onChange: (files: File[]) => void;
  onRemoveExisting?: (publicId: string) => void;
  maxImages?: number;
  error?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  existingImages = [],
  onChange,
  onRemoveExisting,
  maxImages = 5,
  error,
}) => {
  const [dragActive, setDragActive] = useState(false);

  const totalImages = existingImages.length + images.length;
  const canAdd = totalImages < maxImages;

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (!canAdd) return;

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/')
      );
      const slotsAvailable = maxImages - totalImages;
      const newFiles = files.slice(0, slotsAvailable);

      onChange([...images, ...newFiles]);
    },
    [canAdd, images, maxImages, totalImages, onChange]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;

      const files = Array.from(e.target.files).filter((f) =>
        f.type.startsWith('image/')
      );
      const slotsAvailable = maxImages - totalImages;
      const newFiles = files.slice(0, slotsAvailable);

      onChange([...images, ...newFiles]);
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [images, maxImages, totalImages, onChange]
  );

  const removeNewImage = useCallback(
    (index: number) => {
      const updated = images.filter((_, i) => i !== index);
      onChange(updated);
    },
    [images, onChange]
  );

  return (
    <div>
      <label className="text-[11px] font-black uppercase tracking-widest mb-4 block opacity-50">
        Product Images ({totalImages}/{maxImages})
      </label>

      {/* Existing + New image previews */}
      {(existingImages.length > 0 || images.length > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
          {/* Existing images */}
          {existingImages.map((img) => (
            <div
              key={img.publicId}
              className="relative aspect-square border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] overflow-hidden group"
            >
              <img
                src={img.url}
                alt="Product"
                className="w-full h-full object-cover"
              />
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={() => onRemoveExisting(img.publicId)}
                  className="absolute top-1 right-1 bg-[var(--bulletin-accent)] text-white border border-[var(--bulletin-border)] p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {/* New images (File objects) */}
          {images.map((file, index) => (
            <div
              key={`new-${index}`}
              className="relative aspect-square border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] overflow-hidden group"
            >
              <img
                src={URL.createObjectURL(file)}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeNewImage(index)}
                className="absolute top-1 right-1 bg-[var(--bulletin-accent)] text-white border border-[var(--bulletin-border)] p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] text-[8px] font-black uppercase text-center py-0.5 tracking-tighter">
                NEW ENTRY
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {canAdd && (
        <div
          className={`border-4 border-dashed p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-[var(--bulletin-accent)] bg-[var(--bulletin-accent)]/5'
              : 'border-[var(--bulletin-border)] opacity-30 hover:opacity-100 hover:bg-[var(--bulletin-text)]/5'
          } ${error ? 'border-red-500' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('image-upload-input')?.click()}
        >
          <input
            id="image-upload-input"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-3">
            {totalImages === 0 ? (
              <ImageIcon className="h-10 w-10 opacity-30" />
            ) : (
              <Upload className="h-8 w-8 opacity-30" />
            )}
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest">
                {totalImages === 0
                  ? 'UPLOAD VISUAL PROOF'
                  : `ADD MORE IMAGES (${maxImages - totalImages} REMAINING)`}
              </p>
              <p className="text-[9px] font-bold uppercase opacity-30 mt-2">
                JPEG, PNG, or WebP up to 5MB each
              </p>
            </div>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-[11px] font-black italic text-red-500">{error}</p>}
    </div>
  );
};

export default ImageUpload;
