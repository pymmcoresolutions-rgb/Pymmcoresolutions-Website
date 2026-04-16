import { useState, useRef } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Upload, Link as LinkIcon, X, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';

export default function LogoManager() {
  const [logoUrl, setLogoUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const base64String = reader.result as string;
        setPreviewUrl(base64String);
        setLogoUrl(''); // Clear URL input if file is uploaded
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message);
    }
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
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
              <ImageIcon className="w-3 h-3" /> Real-time Preview
            </h4>
            
            <div className="flex-1 flex items-center justify-center p-12 rounded-2xl bg-black/40 border border-white/5 relative group">
              {(previewUrl || logoUrl) ? (
                <div className="relative">
                  <img 
                    src={previewUrl || logoUrl} 
                    alt="Logo Preview" 
                    className="max-h-32 object-contain"
                    onError={() => setError('Invalid image URL or corrupted file.')}
                  />
                  <button 
                    onClick={() => {
                      setPreviewUrl(null);
                      setLogoUrl('');
                    }}
                    className="absolute -top-4 -right-4 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 text-white/10 mx-auto mb-4" />
                  <p className="text-xs text-white/20 italic">No logo provided for preview</p>
                </div>
              )}
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
