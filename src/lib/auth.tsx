import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail
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
  isDeveloper: boolean;
  isSuspended: boolean;
  isEmailVerified: boolean;
  loginLoading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, data: { name: string; phone: string; address: string }) => Promise<void>;
  logout: () => Promise<void>;
  logActivity: (action: string, details?: any) => Promise<void>;
  resendVerification: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  const logActivity = async (action: string, details: any = {}) => {
    if (!auth.currentUser) return;
    try {
      const deviceContext = {
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
        language: typeof window !== 'undefined' ? window.navigator.language : 'en',
        screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'unknown',
        platform: typeof window !== 'undefined' ? (window.navigator as any).platform || 'unknown' : 'unknown'
      };

      await addDoc(collection(db, 'logs'), {
        actorId: auth.currentUser.uid,
        userId: auth.currentUser.uid, // backward compatibility
        userEmail: auth.currentUser.email || 'unknown', // backward compatibility
        action,
        timestamp: serverTimestamp(),
        deviceContext,
        details
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  };

  useEffect(() => {
    // Set persistence explicitly to avoid internal assertion errors in some environments
    import('firebase/auth').then(({ setPersistence, browserLocalPersistence }) => {
      setPersistence(auth, browserLocalPersistence).catch(err => {
        console.error("Auth persistence error:", err);
      });
    });

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
            const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
            const isDefaultAdmin = adminEmail && user.email === adminEmail;
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
    setLoginLoading(true);
    try {
      console.log("Initiating Google Login...");
      const provider = new GoogleAuthProvider();
      
      // Attempt login
      const result = await signInWithPopup(auth, provider);
      console.log("Login successful:", result.user.email);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return;
      }

      console.error("Google Auth Error:", error);
      
      if (error.code === 'auth/internal-error') {
        alert("Authentication encountered an internal error. This can happen in sandboxed environments. Please try opening the app in a new tab if this persists.");
      }
      
      if (error.code === 'auth/popup-blocked') {
        alert("The login popup was blocked by your browser. Please allow popups for this site or open the application in a new tab to sign in.");
      }
      
      throw error;
    } finally {
      setLoginLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } finally {
      setLoginLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string, data: { name: string; phone: string; address: string }) => {
    setLoginLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(userCredential.user, { displayName: data.name });
      await sendEmailVerification(userCredential.user);
      
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
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = async () => {
    await logActivity('user_logout');
    await signOut(auth);
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      setLoginLoading(true);
      try {
        await sendEmailVerification(auth.currentUser);
      } finally {
        setLoginLoading(false);
      }
    }
  };

  const resetPassword = async (email: string) => {
    setLoginLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
    } finally {
      setLoginLoading(false);
    }
  };

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  const isAdmin = profile?.role === 'admin' || (adminEmail && user?.email === adminEmail);
  const isEditor = isAdmin || profile?.role === 'editor' || profile?.role === 'developer';
  const isDeveloper = isAdmin || profile?.role === 'developer';
  const isSuspended = profile?.status === 'suspended';
  const isEmailVerified = user?.emailVerified || false;

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      loginLoading,
      isAdmin, 
      isEditor, 
      isDeveloper,
      isSuspended, 
      isEmailVerified,
      login, 
      loginWithEmail,
      registerWithEmail,
      logout, 
      logActivity,
      resendVerification,
      resetPassword
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
