import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageUploaderProps {
  onUpload: (base64: string) => void;
  currentImage?: string;
  label?: string;
  id?: string;
  aspectRatio?: 'square' | 'video' | 'any';
  maxSizeMB?: number;
}

export default function ImageUploader({ 
  onUpload, 
  currentImage, 
  label, 
  id,
  aspectRatio = 'square',
  maxSizeMB = 0.8
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Limit dimensions for base64 storage
          const MAX_DIM = 800;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            } else {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Use WebP for better compression if supported, fallback to JPEG
            const compressedBase64 = canvas.toDataURL('image/webp', 0.7);
            onUpload(compressedBase64);
          }
          setIsProcessing(false);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        setError('Failed to process image transmission.');
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Critical failure in image rendering.');
      setIsProcessing(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2">
          {label}
        </label>
      )}

      <div
        id={id}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer transition-all duration-300 border-2 border-dashed rounded-3xl overflow-hidden ${
          isDragging ? 'border-blue-500 bg-blue-500/10' : 
          currentImage ? 'border-white/20 bg-white/5 hover:border-white/40' : 
          'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
        } ${aspectRatio === 'square' ? 'aspect-square' : aspectRatio === 'video' ? 'aspect-video' : 'min-h-[200px]'}`}
      >
        <input 
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
          accept="image/*"
        />

        <AnimatePresence mode="wait">
          {currentImage ? (
            <motion.div 
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <img src={currentImage} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <div className="p-3 bg-white/10 backdrop-blur-md rounded-full">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpload('');
                  }}
                  className="p-3 bg-red-500/20 backdrop-blur-md rounded-full hover:bg-red-500/40"
                >
                  <X className="w-5 h-5 text-red-500" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4"
            >
              <div className="p-4 rounded-full bg-white/5 group-hover:bg-blue-500/10 transition-colors">
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-white/20 group-hover:text-blue-500 transition-colors" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-white/40 group-hover:text-white transition-colors">
                  {isDragging ? 'Release to Transmit' : 'Drag & Drop Artwork'}
                </p>
                <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] mt-1">
                  Optimized for Cloud (Max {maxSizeMB}MB)
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold uppercase tracking-widest"
        >
          <AlertCircle className="w-3 h-3" /> {error}
        </motion.div>
      )}
    </div>
  );
}
