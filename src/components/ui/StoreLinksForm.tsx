import { useState, useEffect } from 'react';

interface StoreLinksFormProps {
  playStoreLink: string;
  appStoreLink: string;
  onChange: (field: 'playStoreLink' | 'appStoreLink', value: string, isValid: boolean) => void;
}

export default function StoreLinksForm({ playStoreLink, appStoreLink, onChange }: StoreLinksFormProps) {
  const [playStoreError, setPlayStoreError] = useState<string | null>(null);
  const [appStoreError, setAppStoreError] = useState<string | null>(null);

  const validatePlayStore = (url: string): { isValid: boolean; error: string | null } => {
    const trimmed = url.trim();
    if (!trimmed) return { isValid: true, error: null };
    
    // Play Store links must start with or contain play.google.com/store/apps/details?id=
    const isValid = trimmed.includes('play.google.com/store/apps/details?id=');
    return {
      isValid,
      error: isValid ? null : 'Please enter a valid Google Play Store URL (containing play.google.com/store/apps/details?id=)'
    };
  };

  const validateAppStore = (url: string): { isValid: boolean; error: string | null } => {
    const trimmed = url.trim();
    if (!trimmed) return { isValid: true, error: null };
    
    // App Store links must start with or contain apps.apple.com/
    const isValid = trimmed.includes('apps.apple.com/');
    return {
      isValid,
      error: isValid ? null : 'Please enter a valid Apple App Store URL (containing apps.apple.com/)'
    };
  };

  const handlePlayStoreChange = (val: string) => {
    const { isValid, error } = validatePlayStore(val);
    setPlayStoreError(error);
    onChange('playStoreLink', val, isValid);
  };

  const handleAppStoreChange = (val: string) => {
    const { isValid, error } = validateAppStore(val);
    setAppStoreError(error);
    onChange('appStoreLink', val, isValid);
  };

  // Run initial validation check in case values are pre-loaded (e.g. from drafts)
  useEffect(() => {
    const playCheck = validatePlayStore(playStoreLink);
    setPlayStoreError(playCheck.error);
    const appCheck = validateAppStore(appStoreLink);
    setAppStoreError(appCheck.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Play Store Link */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2 block">
            Google Play Store Link <span className="text-white/20">(Optional)</span>
          </label>
          <input
            type="text"
            value={playStoreLink}
            onChange={(e) => handlePlayStoreChange(e.target.value)}
            className={`w-full px-5 py-4 bg-white/5 border rounded-2xl outline-none transition-all font-medium ${
              playStoreError 
                ? 'border-red-500 focus:border-red-500 text-red-200' 
                : 'border-white/10 focus:border-blue-500'
            }`}
            placeholder="e.g. https://play.google.com/store/apps/details?id=com.example"
          />
          {playStoreError && (
            <p className="text-xs text-red-500 px-2 mt-1 animate-pulse font-medium">
              {playStoreError}
            </p>
          )}
        </div>

        {/* Apple App Store Link */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2 block">
            Apple App Store Link <span className="text-white/20">(Optional)</span>
          </label>
          <input
            type="text"
            value={appStoreLink}
            onChange={(e) => handleAppStoreChange(e.target.value)}
            className={`w-full px-5 py-4 bg-white/5 border rounded-2xl outline-none transition-all font-medium ${
              appStoreError 
                ? 'border-red-500 focus:border-red-500 text-red-200' 
                : 'border-white/10 focus:border-blue-500'
            }`}
            placeholder="e.g. https://apps.apple.com/app/example/id12345678"
          />
          {appStoreError && (
            <p className="text-xs text-red-500 px-2 mt-1 animate-pulse font-medium">
              {appStoreError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
