import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Logo({ className = '', showText = true, variant = 'light', size = 'md' }: LogoProps) {
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [hideEmblem, setHideEmblem] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCustomLogoUrl(data.customLogoUrl || null);
        setHideEmblem(data.hideEmblem || false);
      }
      setIsLoaded(true);
    }, (error) => {
      console.warn("Error loading logo settings:", error);
      setIsLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  if (!isLoaded) return null;

  const sizes = {
    sm: 'h-10',
    md: 'h-16',
    lg: 'h-24',
    xl: 'h-32'
  };

  const textColor = variant === 'light' ? 'text-white' : 'text-slate-900';
  const subTextColor = variant === 'light' ? 'text-white/40' : 'text-slate-500';

  if (customLogoUrl && !hideEmblem) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <img 
          src={customLogoUrl} 
          alt="pymmcoresolutions" 
          className={`${sizes[size]} object-contain`}
          referrerPolicy="no-referrer"
        />
        {showText && (
          <div className="flex flex-col z-10">
            <h1 className={`text-lg md:text-2xl font-bold tracking-tighter leading-none ${textColor}`}>
              pymmcore<span className="text-teal-500">solutions</span>
            </h1>
            <p className={`text-[8px] md:text-[11px] font-black uppercase tracking-[0.3em] ${subTextColor} mt-1`}>
              Integrated Business Solutions
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Emblem Section */}
      {!hideEmblem && (
        <div className={`${sizes[size]} aspect-[1.5/1] relative flex items-center`}>
          <svg viewBox="0 0 300 200" className="w-full h-full drop-shadow-2xl overflow-visible">
          <defs>
            <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#134e4a" />
              <stop offset="50%" stopColor="#0f766e" />
              <stop offset="100%" stopColor="#115e59" />
            </linearGradient>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Swirling Tail / Flowing Forms */}
          <path 
            d="M80,130 C120,150 200,180 280,140 C240,120 160,130 120,135 Z" 
            fill="url(#tealGrad)" 
            stroke="url(#goldGrad)" 
            strokeWidth="1"
            className="opacity-90"
          />
          
          <path 
            d="M100,140 Q180,165 260,145" 
            fill="none" 
            stroke="url(#goldGrad)" 
            strokeWidth="0.5" 
            strokeDasharray="2 4"
            className="opacity-40"
          />

          {/* Main Emblem Body */}
          <g transform="translate(10, 10)">
            {/* Layered Leaves */}
            <path 
              d="M50,20 C20,20 10,60 30,100 C50,140 90,140 110,100 C90,60 80,20 50,20 Z" 
              fill="url(#tealGrad)" 
              stroke="url(#goldGrad)" 
              strokeWidth="1.5" 
            />
            <path 
              d="M30,40 C0,40 -10,80 10,120 C30,160 70,160 90,120 C70,80 60,40 30,40 Z" 
              fill="url(#tealGrad)" 
              stroke="url(#goldGrad)" 
              strokeWidth="1" 
              opacity="0.6" 
            />
            
            {/* Mechanical Gear */}
            <g transform="translate(60, 60) scale(0.45)" fill="url(#goldGrad)" opacity="0.9">
              <path d="M44.5,29.8c-0.2-1.1-0.6-2.2-1.2-3.2l5.7-5.7c0.5-0.5,0.5-1.3,0-1.8l-4.2-4.2c-0.5-0.5-1.3-0.5-1.8,0l-4.2,4.2c-0.5,0.5-0.5,1.3,0,1.8l5.7,5.7c-0.6,1-1,2.1-1.2,3.2H11.2c-0.7,0-1.2,0.6-1.2,1.2v6c0,0.7,0.6,1.2,1.2,1.2h8.2c0.2,1.1,0.6,2.2,1.2,3.2l-5.7,5.7c-0.5,0.5-0.5,1.3,0,1.8l4.2,4.2c0.5,0.5,1.3,0.5,1.8,0l5.7-5.7c1,0.6,2.1,1,3.2,1.2v8.2c0,0.7,0.6,1.2,1.2,1.2h6c0.7,0,1.2-0.6,1.2-1.2v-8.2c1.1-0.2,2.2-0.6,3.2-1.2l5.7,5.7c0.5,0.5,1.3,0.5,1.8,0l4.2-4.2c0.5-0.5,0.5-1.3,0-1.8l-5.7-5.7c0.6-1,1-2.1,1.2-3.2h8.2c0.7,0,1.2-0.6,1.2-1.2v-6c0-0.7-0.6-1.2-1.2-1.2H44.5z M30,38c-4.4,0-8-3.6-8-8s3.6-8,8-8s8,3.6,8,8S34.4,38,30,38z" />
            </g>

            {/* Circuit Patterns on Leaves */}
            <g stroke="url(#goldGrad)" strokeWidth="0.5" fill="none" className="opacity-60">
              <path d="M40,50 L60,30 M30,70 L50,50 M20,90 L40,70" />
              <circle cx="60" cy="30" r="1" fill="#fbbf24" />
              <circle cx="50" cy="50" r="1" fill="#fbbf24" />
              <circle cx="40" cy="70" r="1" fill="#fbbf24" />
            </g>

            {/* Identifier Plate */}
            <path 
              d="M40,105 L100,105 L115,140 L55,140 Z" 
              fill="#0f172a" 
              stroke="url(#goldGrad)" 
              strokeWidth="2" 
            />
            <text 
              x="77" 
              y="130" 
              textAnchor="middle" 
              fill="url(#goldGrad)" 
              fontSize="20" 
              fontWeight="900" 
              style={{fontFamily: 'sans-serif', letterSpacing: '1px'}}
            >
              PC
            </text>

            {/* Circuit Patterns / Glowing Nodes */}
            <g filter="url(#glow)">
              <circle cx="140" cy="130" r="3" fill="#fbbf24" />
              <circle cx="210" cy="145" r="2.5" fill="#fbbf24" />
              <circle cx="260" cy="125" r="3" fill="#fbbf24" />
            </g>
          </g>
        </svg>
      </div>
      )}

      {/* Text Section */}
      {showText && (
        <div className={`flex flex-col ${!hideEmblem ? 'ml-[-15px]' : ''} z-10`}>
          <h1 className={`text-lg md:text-2xl font-bold tracking-tighter leading-none ${textColor}`}>
            pymmcore<span className="text-teal-500">solutions</span>
          </h1>
          <p className={`text-[8px] md:text-[11px] font-black uppercase tracking-[0.3em] ${subTextColor} mt-1`}>
            Integrated Business Solutions
          </p>
        </div>
      )}
    </div>
  );
}
