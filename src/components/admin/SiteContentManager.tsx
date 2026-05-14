import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { motion, AnimatePresence } from 'motion/react';
import Cropper from 'react-easy-crop';
import { 
  Layout, Save, Loader2, CheckCircle2, 
  Info, Target, Eye, User, Image as ImageIcon,
  MessageSquare, FileText, Upload, Trash2, X,
  Maximize2, MousePointer2, Shield
} from 'lucide-react';
import LegalContentManager from './LegalContentManager';

// Helper for image cropping
const getCroppedImg = async (imageSrc: string, pixelCrop: any, rotation = 0): Promise<string> => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  const rotRad = (rotation * Math.PI) / 180;
  const { width: bWidth, height: bHeight } = {
    width: Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height),
    height: Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height),
  };

  canvas.width = bWidth;
  canvas.height = bHeight;

  ctx.translate(bWidth / 2, bHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.putImageData(data, 0, 0);

  return canvas.toDataURL('image/jpeg', 0.85);
};

export default function SiteContentManager() {
  const { logActivity } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    aboutMission: '',
    aboutVision: '',
    aboutBackground: '',
    founderName: '',
    founderTitle: '',
    founderBio: '',
    founderPhotoUrl: '',
    contactTitle: '',
    contactDescription: ''
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<'general' | 'legal'>('general');

  // Cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setForm(prev => ({
          ...prev,
          aboutMission: data.aboutMission || '',
          aboutVision: data.aboutVision || '',
          aboutBackground: data.aboutBackground || '',
          founderName: data.founderName || '',
          founderTitle: data.founderTitle || '',
          founderBio: data.founderBio || '',
          founderPhotoUrl: data.founderPhotoUrl || '',
          contactTitle: data.contactTitle || '',
          contactDescription: data.contactDescription || ''
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        ...form,
        updatedAt: serverTimestamp()
      }, { merge: true });
      await logActivity('site_content_updated', { sections: ['About', 'Contact', 'Founder'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Content update failed:", error);
    }
    setLoading(false);
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // Increase to 2MB for raw, we will crop to < 1MB
      alert("Source image too large. Max 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result as string);
      setShowCropper(true);
      setZoom(1);
      setRotation(0);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCrop = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    
    setIsProcessing(true);
    try {
      const croppedBase64 = await getCroppedImg(imageToCrop, croppedAreaPixels, rotation);
      setForm(prev => ({ ...prev, founderPhotoUrl: croppedBase64 }));
      setShowCropper(false);
      setImageToCrop(null);
    } catch (err) {
      console.error("Cropping failed:", err);
    }
    setIsProcessing(false);
  };

  const savePhotoOnly = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        founderPhotoUrl: form.founderPhotoUrl,
        updatedAt: serverTimestamp()
      }, { merge: true });
      await logActivity('site_founder_photo_updated');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Photo update failed:", error);
    }
    setLoading(false);
  };

  const removePhoto = () => {
    setForm(prev => ({ ...prev, founderPhotoUrl: '' }));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Layout className="w-5 h-5 text-blue-400" /> Site Content Manager
        </h3>
        
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setActiveSubMenu('general')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSubMenu === 'general' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
          >
            General
          </button>
          <button 
            onClick={() => setActiveSubMenu('legal')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSubMenu === 'legal' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
          >
            Legal & Quality
          </button>
        </div>

        {saved && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-green-500 text-xs font-bold uppercase tracking-widest"
          >
            <CheckCircle2 className="w-4 h-4" /> Content Saved
          </motion.div>
        )}
      </div>

      {activeSubMenu === 'legal' ? (
        <LegalContentManager />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-12">
        {/* About Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Info className="w-5 h-5 text-blue-400" />
            <h4 className="text-lg font-bold">About Section</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                <Target className="w-3 h-3" /> Our Mission
              </label>
              <textarea
                value={form.aboutMission}
                onChange={e => setForm({ ...form, aboutMission: e.target.value })}
                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all text-sm resize-none"
                placeholder="Enter mission statement..."
              />
            </div>
            <div className="space-y-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                <Eye className="w-3 h-3" /> Our Vision
              </label>
              <textarea
                value={form.aboutVision}
                onChange={e => setForm({ ...form, aboutVision: e.target.value })}
                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all text-sm resize-none"
                placeholder="Enter vision statement..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
              <FileText className="w-3 h-3" /> Our Background
            </label>
            <textarea
              value={form.aboutBackground}
              onChange={e => setForm({ ...form, aboutBackground: e.target.value })}
              className="w-full h-48 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all text-sm resize-none"
              placeholder="Enter background story..."
            />
          </div>
        </section>

        {/* Founder Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <User className="w-5 h-5 text-purple-400" />
            <h4 className="text-lg font-bold">Founder Profile</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Founder Name</label>
                  <input
                    value={form.founderName}
                    onChange={e => setForm({ ...form, founderName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Title</label>
                  <input
                    value={form.founderTitle}
                    onChange={e => setForm({ ...form, founderTitle: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Founder Photo</label>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center relative group">
                      {form.founderPhotoUrl ? (
                        <>
                          <img src={form.founderPhotoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button 
                            type="button"
                            onClick={removePhoto}
                            className="absolute inset-0 bg-red-500/80 items-center justify-center hidden group-hover:flex transition-all"
                          >
                            <Trash2 className="w-6 h-6 text-white" />
                          </button>
                        </>
                      ) : (
                        <User className="w-8 h-8 text-white/10" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                          <Upload className="w-3 h-3" /> Select Asset
                        </button>
                        {form.founderPhotoUrl && (
                          <button
                            type="button"
                            onClick={savePhotoOnly}
                            disabled={loading}
                            className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white border border-purple-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} 
                            Activate Photo
                          </button>
                        )}
                        {form.founderPhotoUrl && (
                          <button
                            type="button"
                            onClick={removePhoto}
                            className="p-2 aspect-square bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-500 transition-all flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-[9px] text-white/30 uppercase tracking-[0.2em]">PNG, JPG, or SVG • Max 1MB • 1:1 Recommended</p>
                    </div>
                  </div>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <div className="flex gap-2">
                      <input
                        value={form.founderPhotoUrl}
                        onChange={e => setForm({ ...form, founderPhotoUrl: e.target.value })}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:border-purple-500 outline-none transition-all text-sm"
                        placeholder="Or enter image URL..."
                      />
                      {form.founderPhotoUrl && !form.founderPhotoUrl.startsWith('data:') && (
                        <button
                          type="button"
                          onClick={savePhotoOnly}
                          disabled={loading}
                          className="px-4 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                          Save
                        </button>
                      )}
                    </div>
                  </div>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Founder Bio</label>
              <textarea
                value={form.founderBio}
                onChange={e => setForm({ ...form, founderBio: e.target.value })}
                className="w-full h-full min-h-[160px] bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all text-sm resize-none"
                placeholder="Enter founder's biography..."
              />
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <MessageSquare className="w-5 h-5 text-pink-400" />
            <h4 className="text-lg font-bold">Contact Page Content</h4>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Page Title</label>
              <input
                value={form.contactTitle}
                onChange={e => setForm({ ...form, contactTitle: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-pink-500 outline-none transition-all text-sm"
                placeholder="e.g. Contact Us"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Description</label>
              <textarea
                value={form.contactDescription}
                onChange={e => setForm({ ...form, contactDescription: e.target.value })}
                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-pink-500 outline-none transition-all text-sm resize-none"
                placeholder="Enter contact page description..."
              />
            </div>
          </div>
        </section>

        <div className="pt-8">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Update Site Content
          </button>
        </div>
      </form>
      )}

      {/* Photo Adjustment Modal */}
      <AnimatePresence>
        {showCropper && imageToCrop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Maximize2 className="w-5 h-5 text-purple-400" /> Adjust Founder Photo
                  </h3>
                  <p className="text-xs text-white/40 mt-1">Scale and position the asset to align with the interface grid.</p>
                </div>
                <button
                  onClick={() => setShowCropper(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-all text-white/40 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="relative h-[400px] bg-black/50">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1} // 1:1 aspect for bio photos
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                />
              </div>

              <div className="p-8 space-y-8 bg-white/[0.02]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <span>Digital Zoom Protocol</span>
                      <span>{Math.round(zoom * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      aria-labelledby="Zoom"
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full accent-purple-500 bg-white/10 h-1 rounded-full appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <span>Angular Vector Shift</span>
                      <span>{rotation}°</span>
                    </div>
                    <input
                      type="range"
                      value={rotation}
                      min={0}
                      max={360}
                      step={1}
                      aria-labelledby="Rotation"
                      onChange={(e) => setRotation(Number(e.target.value))}
                      className="w-full accent-purple-500 bg-white/10 h-1 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowCropper(false)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyCrop}
                    disabled={isProcessing}
                    className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <MousePointer2 className="w-5 h-5" />
                    )}
                    Apply {isProcessing ? 'Processing...' : 'Photo Asset'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
