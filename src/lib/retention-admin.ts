import { getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

/**
 * Safely initialize firebase-admin using the project credentials
 */
export function initAdminDb() {
  const adminApp = getApps().length === 0 
    ? initializeApp({ projectId: "gen-lang-client-0743092130" }) 
    : getApp();
  return getFirestore(adminApp, "ai-studio-10dff0fb-9fbd-4922-9bbc-85fb892764c5");
}

/**
 * Deletes any log entries older than 30 days from the main Firestore database.
 */
export async function runRetentionPolicy() {
  console.log("[Retention Job] Initiating 30-day logs retention check...");
  try {
    const db = initAdminDb();
    
    // Calculate cutoff (30 days ago)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffTimestamp = Timestamp.fromDate(thirtyDaysAgo);
    
    const logsRef = db.collection('logs');
    // Fetch logs older than 30 days (limited to 500 per batch for transaction limits)
    const snapshot = await logsRef.where('timestamp', '<', cutoffTimestamp).limit(500).get();
    
    if (snapshot.empty) {
      console.log("[Retention Job] No logs older than 30 days found.");
      return { purgedCount: 0 };
    }
    
    console.log(`[Retention Job] Found ${snapshot.size} logs older than 30 days. Purging...`);
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`[Retention Job] Successfully purged ${snapshot.size} obsolete log entries.`);
    return { purgedCount: snapshot.size };
  } catch (error) {
    console.error("[Retention Job] Error running logs retention clean-up:", error);
    throw error;
  }
}

// Standalone script execution check
if (typeof process !== 'undefined' && process.argv && process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  console.log("[Retention Job] Running standalone retention script execution...");
  runRetentionPolicy()
    .then(res => {
      console.log(`[Retention Job] Completed standalone run. Purged: ${res.purgedCount}`);
      process.exit(0);
    })
    .catch(err => {
      console.error("[Retention Job] Standalone clean-up failure:", err);
      process.exit(1);
    });
}
