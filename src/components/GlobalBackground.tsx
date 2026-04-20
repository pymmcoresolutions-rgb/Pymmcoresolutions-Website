import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface BackgroundAsset {
  id: string;
  url: string;
  opacity: number;
  blur: number;
  grayscale: number;
  blendMode: string;
}

export default function GlobalBackground() {
  const [activeAssets, setActiveAssets] = useState<BackgroundAsset[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'background_assets'), 
      where('active', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActiveAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BackgroundAsset)));
    }, (err) => {
      console.error("GlobalBackground subscription error:", err);
      // If we hit permission denied, it might be a temporary auth sync issue
      // or a missing index. We'll set assets to empty instead of crashing.
      setActiveAssets([]);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[0] overflow-hidden">
      {activeAssets.map((asset) => (
        <div 
          key={asset.id}
          className="absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out"
          style={{
            backgroundImage: `url(${asset.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: asset.opacity / 100,
            filter: `blur(${asset.blur}px) grayscale(${asset.grayscale}%)`,
            mixBlendMode: (asset.blendMode || 'normal') as any,
          }}
        />
      ))}
    </div>
  );
}
