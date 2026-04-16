import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { handleFirestoreError, OperationType } from './firestore-errors';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isSuspended: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, data: { name: string; phone: string; address: string }) => Promise<void>;
  logout: () => Promise<void>;
  logActivity: (action: string, details?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const logActivity = async (action: string, details: any = {}) => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'logs'), {
        action,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        timestamp: serverTimestamp(),
        details
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  };

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = null;
        }

        setUser(user);
        if (user) {
          const userDoc = doc(db, 'users', user.uid);
          let snap;
          try {
            snap = await getDoc(userDoc);
          } catch (error: any) {
            if (error.code === 'permission-denied') {
              console.warn("Permission denied for initial profile fetch.");
            } else {
              handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
            }
          }
          
          if (!snap || !snap.exists()) {
            const isDefaultAdmin = user.email === "pymmcoresolutions@gmail.com";
            const newProfile = {
              role: isDefaultAdmin ? 'admin' : 'viewer',
              email: user.email,
              status: 'active',
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(userDoc, newProfile);
              await logActivity('user_registered', { email: user.email });
              setProfile(newProfile);
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
            }
          } else {
            unsubProfile = onSnapshot(userDoc, (docSnap) => {
              setProfile(docSnap.data());
            }, (error) => {
              handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
            });
            await logActivity('user_login', { email: user.email });
          }
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const login = async () => {
    try {
      // Ensure auth is ready
      if (!auth) {
        throw new Error("Authentication system not initialized.");
      }
      
      const provider = new GoogleAuthProvider();
      // Add custom parameters to force account selection if needed
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        // Silently handle user cancellation
        return;
      }
      console.error("Detailed Auth Error:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string, data: { name: string; phone: string; address: string }) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, { displayName: data.name });
    
    // Create the user profile immediately with the extra data
    const userDoc = doc(db, 'users', userCredential.user.uid);
    await setDoc(userDoc, {
      role: 'viewer',
      email: email,
      name: data.name,
      phone: data.phone,
      address: data.address,
      status: 'active',
      createdAt: new Date().toISOString()
    });
  };

  const logout = async () => {
    await logActivity('user_logout');
    await signOut(auth);
  };

  const isAdmin = profile?.role === 'admin' || user?.email === "pymmcoresolutions@gmail.com";
  const isEditor = isAdmin || profile?.role === 'editor';
  const isSuspended = profile?.status === 'suspended';

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isAdmin, 
      isEditor, 
      isSuspended, 
      login, 
      loginWithEmail,
      registerWithEmail,
      logout, 
      logActivity 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
