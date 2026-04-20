import { useState, useRef } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Upload, Link as LinkIcon, X, CheckCircle2, AlertCircle, Loader2, Trash2, Sparkles, ShieldCheck } from 'lucide-react';

export default function LogoManager() {
  const [logoUrl, setLogoUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewBg, setPreviewBg] = useState<'black' | 'white' | 'teal'>('black');

  const validateFile = (file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    const maxSize = 500 * 1024; // 500KB

    if (!validTypes.includes(file.type)) {
      throw new Error('Unsupported format. Please use PNG, JPG, or SVG.');
    }
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 500KB.');
    }
  };

  const handleFile = async (file: File) => {
    try {
      setError(null);
      validateFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const processedDataUrl = processLogo(img);
          setPreviewUrl(processedDataUrl);
          setLogoUrl('');
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const processLogo = (img: HTMLImageElement): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return img.src;

    // Set initial size
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 1. Identify background color (sample corners)
    const corners = [
      getPixel(data, 0, 0, canvas.width),
      getPixel(data, canvas.width - 1, 0, canvas.width),
      getPixel(data, 0, canvas.height - 1, canvas.width),
      getPixel(data, canvas.width - 1, canvas.height - 1, canvas.width)
    ];
    
    // Use the most frequent corner color as the background key
    const bgKey = getAverageColor(corners);

    // 2. Remove background with tolerance
    const tolerance = 30;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      
      const diff = Math.sqrt(
        Math.pow(r - bgKey.r, 2) +
        Math.pow(g - bgKey.g, 2) +
        Math.pow(b - bgKey.b, 2)
      );

      if (diff < tolerance) {
        data[i+3] = 0; // Set alpha to 0
      }
    }
    ctx.putImageData(imageData, 0, 0);

    // 3. Auto-crop to content
    const bounds = getContentBounds(data, canvas.width, canvas.height);
    const cropWidth = bounds.right - bounds.left + 1;
    const cropHeight = bounds.bottom - bounds.top + 1;

    if (cropWidth > 0 && cropHeight > 0) {
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = cropWidth;
      cropCanvas.height = cropHeight;
      const cropCtx = cropCanvas.getContext('2d');
      if (cropCtx) {
        cropCtx.drawImage(canvas, bounds.left, bounds.top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        return cropCanvas.toDataURL('image/png');
      }
    }

    return canvas.toDataURL('image/png');
  };

  const getPixel = (data: Uint8ClampedArray, x: number, y: number, width: number) => {
    const i = (y * width + x) * 4;
    return { r: data[i], g: data[i+1], b: data[i+2], a: data[i+3] };
  };

  const getAverageColor = (colors: {r: number, g: number, b: number}[]) => {
    const sum = colors.reduce((acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }), { r:0, g:0, b:0 });
    return { r: sum.r / colors.length, g: sum.g / colors.length, b: sum.b / colors.length };
  };

  const getContentBounds = (data: Uint8ClampedArray, width: number, height: number) => {
    let top = height, bottom = 0, left = width, right = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 0) {
          if (x < left) left = x;
          if (x > right) right = x;
          if (y < top) top = y;
          if (y > bottom) bottom = y;
        }
      }
    }
    return { top, bottom, left, right };
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async () => {
    const finalUrl = previewUrl || logoUrl;
    if (!finalUrl) {
      setError('Please provide a logo URL or upload a file.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updateDoc(doc(db, 'settings', 'global'), {
        customLogoUrl: finalUrl,
        updatedAt: serverTimestamp()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError('Failed to update logo. Please try again.');
      console.error(err);
    }
    setLoading(false);
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'settings', 'global'), {
        customLogoUrl: null,
        updatedAt: serverTimestamp()
      });
      setPreviewUrl(null);
      setLogoUrl('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to reset logo.');
    }
    setLoading(false);
  };

  const bgColors = {
    black: 'bg-[#0a0a0a]',
    white: 'bg-white',
    teal: 'bg-teal-900'
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-teal-400" /> Logo Management
        </h3>
        {success && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-teal-500 text-xs font-bold uppercase tracking-widest"
          >
            <CheckCircle2 className="w-4 h-4" /> Logo Updated
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* URL Input */}
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
              <LinkIcon className="w-3 h-3" /> Option 1: Image URL
            </h4>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="url"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => {
                  setLogoUrl(e.target.value);
                  setPreviewUrl(null); // Clear file preview if URL is entered
                }}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-teal-500 outline-none transition-all text-sm"
              />
            </div>
          </div>

          {/* File Upload */}
          <div 
            className={`p-8 rounded-3xl border-2 border-dashed transition-all ${
              dragActive ? 'border-teal-500 bg-teal-500/5' : 'border-white/10 bg-white/5'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
              <Upload className="w-3 h-3" /> Option 2: Direct Upload
            </h4>
            
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-sm font-medium mb-2">Drag and drop your logo here</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-6">
                PNG, JPG, or SVG (Max 500KB)
              </p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
              >
                Browse Files
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept=".png,.jpg,.jpeg,.svg"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                <ImageIcon className="w-3 h-3" /> Alpha Transparency Protocol
              </h4>
              <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                {(['black', 'white', 'teal'] as const).map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setPreviewBg(bg)}
                    className={`w-6 h-6 rounded ${bg === 'black' ? 'bg-[#0a0a0a]' : bg === 'white' ? 'bg-white' : 'bg-teal-600'} ${
                      previewBg === bg ? 'ring-2 ring-teal-500 ring-offset-2 ring-offset-black' : 'opacity-40'
                    } transition-all`}
                    title={`Preview on ${bg} background`}
                  />
                ))}
              </div>
            </div>
            
            <div className={`flex-1 flex items-center justify-center p-12 rounded-2xl border transition-colors duration-500 relative group overflow-hidden ${bgColors[previewBg]} ${previewBg === 'white' ? 'border-black/10' : 'border-white/5'}`}>
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
              
              {(previewUrl || logoUrl) ? (
                <div className="relative z-10">
                  <img 
                    src={previewUrl || logoUrl} 
                    alt="Logo Preview" 
                    className="max-h-32 w-auto object-contain transition-transform duration-500 group-hover:scale-110"
                    onError={() => setError('Invalid image URL or corrupted file.')}
                  />
                  {previewUrl && (
                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-[8px] font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> Background Removed & Auto-Cropped
                    </div>
                  )}
                  <button 
                    onClick={() => {
                      setPreviewUrl(null);
                      setLogoUrl('');
                    }}
                    className="absolute -top-4 -right-4 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-xl"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center relative z-10">
                  <ImageIcon className="w-12 h-12 text-white/10 mx-auto mb-4" />
                  <p className="text-xs text-white/20 italic">Awaiting asset upload for optimization...</p>
                </div>
              )}
            </div>

            <div className="mt-8 p-4 rounded-2xl bg-teal-500/5 border border-teal-500/10">
              <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" /> Dynamic Scaling Active
              </p>
              <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-widest font-normal">
                Uploaded assets are automatically stripped of edge-borders and solid backgrounds to ensure perfect integration with dark, light, and themed infrastructure panels.
              </p>
            </div>

            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                onClick={handleReset}
                disabled={loading}
                className="py-4 bg-white/5 hover:bg-red-500/10 hover:text-red-500 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Reset Default
              </button>
              <button
                onClick={handleSave}
                disabled={loading || (!previewUrl && !logoUrl)}
                className="py-4 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-900/20 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Activate Logo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
