import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  increment, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { triggerMAAY } from '../components/MAAYFeedback';

export interface DownloadEvent {
  appId: string;
  appName: string;
  userId?: string;
  sessionId: string;
  platform: string;
  timestamp: any;
}

class AnalyticsService {
  private sessionId: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    let sid = localStorage.getItem('pymmcore_session_id');
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem('pymmcore_session_id', sid);
    }
    return sid;
  }

  async trackDownload(appId: string, appName: string) {
    try {
      const downloadData: DownloadEvent = {
        appId,
        appName,
        userId: auth.currentUser?.uid || undefined,
        sessionId: this.sessionId,
        platform: navigator.platform,
        timestamp: serverTimestamp()
      };

      // 1. Log the individual event
      const downloadsRef = collection(db, 'downloads');
      const addPromise = addDoc(downloadsRef, downloadData);

      // 2. Increment the global counter for the app
      const appRef = doc(db, 'apps', appId);
      const incrementPromise = updateDoc(appRef, {
        downloadCount: increment(1)
      });

      // Execute both without blocking UI
      await Promise.allSettled([addPromise, incrementPromise]);
      
      triggerMAAY(`Download started. Your journey with ${appName} begins now.`);
      console.log(`[Analytics] Tracked download for ${appName}`);
    } catch (error) {
      console.error('[Analytics] Failed to track download:', error);
    }
  }
}

export const analyticsService = new AnalyticsService();
