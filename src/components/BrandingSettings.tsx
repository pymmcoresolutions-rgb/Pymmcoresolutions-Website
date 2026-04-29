import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Layers, Palette, Monitor } from 'lucide-react';
import LogoManager from './admin/LogoManager';
import BackgroundManager from './admin/BackgroundManager';
import OnboardingManager from './admin/OnboardingManager';

export default function BrandingSettings() {
  const [activeTab, setActiveTab] = useState<'logo' | 'background' | 'onboarding'>('logo');

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap bg-white/5 border border-white/10 rounded-2xl p-1.5 w-fit">
        <button
          onClick={() => setActiveTab('logo')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === 'logo' 
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' 
              : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Brand Identity
        </button>
        <button
          onClick={() => setActiveTab('background')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === 'background' 
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' 
              : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          Environment
        </button>
        <button
          onClick={() => setActiveTab('onboarding')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === 'onboarding' 
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' 
              : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          <Monitor className="w-4 h-4" />
          Onboarding
        </button>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'logo' && <LogoManager />}
        {activeTab === 'background' && <BackgroundManager />}
        {activeTab === 'onboarding' && <OnboardingManager />}
      </motion.div>
    </div>
  );
}
