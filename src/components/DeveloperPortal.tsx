import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Rocket, Shield, CheckCircle2, AlertCircle, 
  Upload, Layout, Globe, Smartphone, Monitor,
  Plus, X, HelpCircle, Loader2, Sparkles,
  ExternalLink, CreditCard, DollarSign, Info,
  Save, Eye, History
} from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { useAuth } from '../lib/auth';
import { auditApplication } from '../services/geminiService';
import ImageUploader from './ui/ImageUploader';
import StoreLinksForm from './ui/StoreLinksForm';

interface AppSubmissionForm {
  id?: string;
  name: string;
  description: string;
  type: ('Web' | 'Mobile' | 'Desktop' | 'All')[];
  category: string;
  link: string;
  developer: string;
  price: string;
  tags: string[];
  features: string[];
  demoLink: string;
  appStoreLink: string;
  playStoreLink: string;
  expectedLaunchDate: string;
  icon: string;
  screenshots: string[];
  sourceCodeUrl: string;
  isDraft?: boolean;
}

const CATEGORIES = [
  'Productivity', 'Finance', 'Education', 'Entertainment', 
  'Health & Fitness', 'Lifestyle', 'Utilities', 'Social',
  'Business', 'Developer Tools', 'Other'
];

const GUIDELINES = [
  { title: "No Spam or Malware", desc: "Submissions containing malicious code, deceptive links, or spam will be immediately terminated." },
  { title: "Original Content", desc: "You must own the rights to the application or have explicit permission to list it." },
  { title: "Quality Standards", desc: "Provide high-quality descriptions and valid links. Broken apps will be rejected." },
  { title: "Offensive Content", desc: "No hate speech, explicit adult content, or highly offensive material." }
];

export default function DeveloperPortal() {
  const { user } = useAuth();
  const [step, setStep] = useState<'guidelines' | 'form' | 'payment' | 'success'>('guidelines');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  
  const [drafts, setDrafts] = useState<AppSubmissionForm[]>([]);
  const [economy, setEconomy] = useState({ listingFee: 25, exchangeRate: 1600 });
  const [playStoreLinkValid, setPlayStoreLinkValid] = useState(true);
  const [appStoreLinkValid, setAppStoreLinkValid] = useState(true);
  
  const [form, setForm] = useState<AppSubmissionForm>({
    name: '',
    description: '',
    type: ['Web'],
    category: '',
    link: '',
    developer: '',
    price: 'Free',
    tags: [],
    features: [],
    demoLink: '',
    appStoreLink: '',
    playStoreLink: '',
    expectedLaunchDate: '',
    icon: '',
    screenshots: [],
    sourceCodeUrl: '',
    isDraft: true
  });

  useEffect(() => {
    if (!user) return;

    // Check for existing drafts
    const q = query(
      collection(db, 'apps'), 
      where('authorUid', '==', user.uid),
      where('isDraft', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const draftList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AppSubmissionForm));
      setDrafts(draftList);
      
      // If we don't have an active form ID yet, and we found drafts, auto-load the first one
      // BUT only if the form hasn't been touched much. 
      // Actually, let's let the user choose if multiple exist.
      if (!form.id && draftList.length === 1) {
        setForm(draftList[0]);
      }
    });

    return () => unsubscribe();
  }, [user, form.id]);

  useEffect(() => {
    return onSnapshot(doc(db, 'config', 'marketplace'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        setEconomy({
          listingFee: data.listingFee || 25,
          exchangeRate: data.exchangeRate || 1600
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'config/marketplace');
    });
  }, []);

  const startNewSubmission = () => {
    setForm({
      name: '',
      description: '',
      type: ['Web'],
      category: '',
      link: '',
      developer: '',
      price: 'Free',
      tags: [],
      features: [],
      demoLink: '',
      appStoreLink: '',
      playStoreLink: '',
      expectedLaunchDate: '',
      icon: '',
      screenshots: [],
      sourceCodeUrl: '',
      isDraft: true
    });
    setStep('form');
  };

  const [tagInput, setTagInput] = useState('');

  // Paystack Configuration - Stable via useMemo
  const paymentRefId = (useState(() => `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)[0]);
  
  const paystackConfig = useMemo(() => ({
    reference: paymentRefId,
    email: user?.email || '',
    amount: economy.listingFee * economy.exchangeRate * 100,
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
    currency: 'NGN'
  }), [user?.email, economy.listingFee, economy.exchangeRate, paymentRefId]);

  const onSuccess = useCallback((reference: any) => {
    console.log("Paystack Success Protocol:", reference);
    setPaymentReference(reference.reference);
    setIsPaymentConfirmed(true);
    setError(null);
  }, []);

  const onClose = useCallback(() => {
    console.warn("Paystack Session Terminated by User");
    setError("Payment session closed. Listing fee must be processed to finalize submission.");
  }, []);

  const initializePayment = usePaystackPayment(paystackConfig);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!form.tags.includes(tagInput.trim())) {
        setForm(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleStoreLinksChange = (field: 'playStoreLink' | 'appStoreLink', value: string, isValid: boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'playStoreLink') {
      setPlayStoreLinkValid(isValid);
    } else {
      setAppStoreLinkValid(isValid);
    }
  };

  const validateForm = () => {
    // 1. Mandatory Core Fields
    if (!form.name.trim() || !form.description.trim() || !form.category || !form.developer.trim() || !form.price.trim()) {
      setError("Protocols Incomplete: All core identity fields (Name, Description, Category, Developer, Price) are required.");
      return false;
    }

    // 2. Platform Node Selection
    if (!form.type || form.type.length === 0) {
      setError("Topology Error: Select at least one target platform node for deployment.");
      return false;
    }

    // 3. Technical Links & Assets
    if (!form.link.trim() || !form.link.startsWith('http')) {
      setError("Resource Error: A valid production/target URL is required for the audit protocol.");
      return false;
    }

    if (!form.icon) {
      setError("Visual Identity Missing: An application icon is mandatory for matrix indexing.");
      return false;
    }

    // 4. Content Depth
    if (form.description.length < 100) {
      setError("Description Insufficient: Provide at least 100 characters detailing the application's utility and architecture.");
      return false;
    }

    if (form.features.length < 2) {
      setError("Functional Specifications Missing: Define at least 2 key features of the application.");
      return false;
    }

    // 5. Store links validations
    if (!playStoreLinkValid) {
      setError("Please enter a valid Google Play Store URL.");
      return false;
    }

    if (!appStoreLinkValid) {
      setError("Please enter a valid Apple App Store URL.");
      return false;
    }

    if (form.playStoreLink?.trim() && !form.playStoreLink.trim().includes('play.google.com/store/apps/details?id=')) {
      setError("Please enter a valid Google Play Store URL.");
      return false;
    }

    if (form.appStoreLink?.trim() && !form.appStoreLink.trim().includes('apps.apple.com/')) {
      setError("Please enter a valid Apple App Store URL.");
      return false;
    }

    // 6. Spam/Malice Filtering
    const spamWords = ['buy now', 'cheap', 'viagra', 'casino', 'free money', 'lottery', 'winner', 'cash prize'];
    const content = (form.name + ' ' + form.description).toLowerCase();
    if (spamWords.some(word => content.includes(word))) {
      setError("Security Alert: Content flagged by Anti-Spam heuristic. Please revise your metadata for compliance.");
      return false;
    }

    setError(null);
    return true;
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    setSaveStatus('saving');
    try {
      const sanitizedForm = {
        ...form,
        playStoreLink: form.playStoreLink ? form.playStoreLink.trim() : '',
        appStoreLink: form.appStoreLink ? form.appStoreLink.trim() : '',
      };
      if (form.id) {
        await updateDoc(doc(db, 'apps', form.id), {
          ...sanitizedForm,
          updatedAt: serverTimestamp()
        });
      } else {
        const newDoc = await addDoc(collection(db, 'apps'), {
          ...sanitizedForm,
          authorUid: user.uid,
          createdAt: serverTimestamp(),
          isDraft: true,
          approvalStatus: 'pending',
          paymentStatus: 'unpaid',
          status: 'inactive'
        });
        setForm(prev => ({ ...prev, ...sanitizedForm, id: newDoc.id }));
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error("Draft save failed:", err);
      setError("Failed to synchronize draft with cloud storage.");
    }
  };

  const handleSubmit = async (paymentRef: string) => {
    setLoading(true);
    setError(null);
    
    // We prioritize getting the record into the DB as soon as payment is confirmed.
    // The AI audit is secondary and shouldn't block the core record creation if it fails.
    try {
      let auditResult: { riskScore: 'Safe' | 'Suspicious' | 'Dangerous'; report: string } = { 
        riskScore: 'Suspicious', 
        report: 'Audit pending...' 
      };
      
      try {
        // Stage: AI Auditor (Attemtp)
        const audit = await auditApplication({
          name: form.name,
          description: form.description,
          link: form.link,
          developer: form.developer,
          sourceCodeUrl: form.sourceCodeUrl
        });
        auditResult = { riskScore: audit.riskScore, report: audit.report };
      } catch (auditErr) {
        console.warn("AI Audit Protocol Interrupted:", auditErr);
        // We continue anyway, the admin can manually audit or re-trigger.
      }

      const submissionData = {
        ...form,
        playStoreLink: form.playStoreLink ? form.playStoreLink.trim() : '',
        appStoreLink: form.appStoreLink ? form.appStoreLink.trim() : '',
        authorUid: user?.uid,
        updatedAt: serverTimestamp(),
        approvalStatus: 'pending',
        paymentStatus: 'paid',
        paymentReference: paymentRef,
        status: 'staging',
        isDraft: false, 
        aiRiskScore: auditResult.riskScore,
        aiReport: auditResult.report
      };

      let finalAppId = form.id;

      if (form.id) {
        await updateDoc(doc(db, 'apps', form.id), submissionData);
        console.log("Submission successful (Update):", form.id);
      } else {
        const newDoc = await addDoc(collection(db, 'apps'), {
          ...submissionData,
          createdAt: serverTimestamp()
        });
        finalAppId = newDoc.id;
        console.log("Submission successful (Create):", finalAppId);
      }

      // 3. Notify Administration
      try {
        await addDoc(collection(db, 'notifications'), {
          title: 'New Deployment Pending',
          message: `New application "${form.name}" has been submitted for review by ${form.developer}. Payment Ref: ${paymentRef}`,
          type: 'submission',
          appId: finalAppId || 'new',
          read: false,
          createdAt: serverTimestamp(),
          targetRole: 'admin' 
        });
      } catch (notifErr) {
        console.warn("Failed to dispatch admin notification:", notifErr);
      }
      
      setStep('success');
    } catch (err) {
      console.error("Critical Submission failure:", err);
      setError("CRITICAL ERROR: Payment confirmed but database uplink failed. Please contact support with Ref: " + paymentRef);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto p-12 text-center space-y-8"
      >
        <div className="w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-4">Transmission Successful</h2>
          <p className="text-white/40">Your app has been successfully submitted for review. The review process can take up to 24 hours.</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-4 bg-white text-black font-bold rounded-2xl"
        >
          Return to Hub
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tighter flex items-center gap-3">
          <Rocket className="w-8 h-8 text-blue-500" /> Developer Onboarding
        </h1>
        <p className="text-white/40 max-w-xl">Deploy your innovation to the PymmCore ecosystem. Every submission undergoes human-led technical review for quality assurance.</p>
      </div>

      <AnimatePresence mode="wait">
        {step === 'guidelines' && (
          <motion.div 
            key="guidelines"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            {drafts.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5 text-blue-400" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">In-Progress Recovered Sessions</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {drafts.map(draft => (
                    <button
                      key={draft.id}
                      onClick={() => {
                        setForm(draft);
                        setStep('form');
                      }}
                      className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 text-left transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{draft.name || 'Untitled Draft'}</h4>
                        <span className="text-[10px] font-bold text-white/20">{draft.type}</span>
                      </div>
                      <p className="text-[10px] text-white/40 line-clamp-1 italic mb-4">{draft.description || 'No description provided yet.'}</p>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400">
                        Resume Session <ExternalLink className="w-3 h-3" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {GUIDELINES.map((g, i) => (
                <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-2">
                  <h3 className="font-bold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" /> {g.title}
                  </h3>
                  <p className="text-xs text-white/40 leading-relaxed">{g.desc}</p>
                </div>
              ))}
            </div>
            
            <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-4">
              <Info className="w-6 h-6 text-blue-400 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-bold">Listing Fee Protocol (Per Application)</p>
                <p className="text-xs text-white/40">A one-time listing fee of ${economy.listingFee} is required per application to process your submission. This covers the human technical review and global matrix indexing.</p>
              </div>
            </div>

            <button 
              onClick={startNewSubmission}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-600/20"
            >
              {drafts.length > 0 ? 'Initialize New Infrastructure Node' : 'Initialize Submission Matrix'}
            </button>
          </motion.div>
        )}

        {step === 'form' && (
          <motion.form 
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (validateForm()) {
                (initializePayment as any)(onSuccess, onClose);
              }
            }}
            className="space-y-10"
          >
            {/* Basic Info */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Layout className="w-5 h-5 text-blue-400" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Core Identity</h3>
                </div>
                <button 
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saveStatus === 'saving'}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  {saveStatus === 'saving' ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                   saveStatus === 'saved' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Save className="w-3 h-3" />}
                  {saveStatus === 'saved' ? 'Synchronized' : 'Save as Draft'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-1">
                  <ImageUploader 
                    label="App Icon *"
                    currentImage={form.icon}
                    onUpload={(base64) => setForm({ ...form, icon: base64 })}
                    maxSizeMB={0.5}
                  />
                </div>
                
                <div className="md:col-span-3 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2">App Name *</label>
                      <input 
                        required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium"
                        placeholder="Enter application title"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2">Developer / Company *</label>
                      <input 
                        required
                        value={form.developer}
                        onChange={e => setForm({ ...form, developer: e.target.value })}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium"
                        placeholder="e.g. Acme Innovations"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2">Platform Coverage *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Web', 'Mobile', 'Desktop', 'All'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        const next = [...form.type];
                        if (p === 'All') {
                          if (next.includes('All')) {
                             setForm({ ...form, type: next.filter(t => t !== 'All') as any });
                          } else {
                             setForm({ ...form, type: ['All'] as any });
                          }
                        } else {
                          let filtered = (next as string[]).filter(t => t !== 'All');
                          if (filtered.includes(p)) {
                            filtered = filtered.filter(t => t !== p);
                          } else {
                            filtered.push(p);
                          }
                          setForm({ ...form, type: filtered as any });
                        }
                      }}
                      className={`px-5 py-4 rounded-2xl border transition-all flex items-center justify-center gap-2 group ${
                        form.type.includes(p as any) 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                          : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      {p === 'Web' && <Globe className={`w-4 h-4 ${form.type.includes('Web') ? 'text-white' : 'text-blue-400 opacity-40 group-hover:opacity-100'}`} />}
                      {p === 'Mobile' && <Smartphone className={`w-4 h-4 ${form.type.includes('Mobile') ? 'text-white' : 'text-purple-400 opacity-40 group-hover:opacity-100'}`} />}
                      {p === 'Desktop' && <Monitor className={`w-4 h-4 ${form.type.includes('Desktop') ? 'text-white' : 'text-teal-400 opacity-40 group-hover:opacity-100'}`} />}
                      {p === 'All' && <Sparkles className={`w-4 h-4 ${form.type.includes('All') ? 'text-white' : 'text-amber-400 opacity-40 group-hover:opacity-100'}`} />}
                      <span className="text-[10px] font-black uppercase tracking-widest">{p}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2">Category *</label>
                  <select 
                    required
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-5 py-4 bg-[#0a0a0a] border border-white/10 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium appearance-none"
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2">Pricing *</label>
                  <input 
                    required
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium"
                    placeholder="e.g. Free, $19.99, Freemium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2">Production / Target Link *</label>
                <input 
                  required
                  type="url"
                  value={form.link}
                  onChange={e => setForm({ ...form, link: e.target.value })}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium"
                  placeholder="https://app-landing-page.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2">Source Code Repository (GitHub/GitLab) - Required for AI Audit</label>
                <input 
                  type="url"
                  value={form.sourceCodeUrl}
                  onChange={e => setForm({ ...form, sourceCodeUrl: e.target.value })}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium"
                  placeholder="https://github.com/username/project"
                />
              </div>

              <StoreLinksForm
                playStoreLink={form.playStoreLink || ''}
                appStoreLink={form.appStoreLink || ''}
                onChange={handleStoreLinksChange}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2">Full Description * (Min 50 chars)</label>
              <textarea 
                required
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={6}
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-3xl outline-none focus:border-blue-500 transition-all font-medium resize-none"
                placeholder="Explain the value proposition, tech stack, and modular benefits..."
              />
            </div>

            {/* Screenshots */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2">Visual Proof / Screenshots (Up to 4)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map(idx => (
                  <ImageUploader 
                    key={idx}
                    aspectRatio="video"
                    currentImage={form.screenshots[idx]}
                    onUpload={(base64) => {
                      const next = [...form.screenshots];
                      if (base64) next[idx] = base64;
                      else next.splice(idx, 1);
                      setForm({ ...form, screenshots: next });
                    }}
                    maxSizeMB={0.5}
                  />
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2">Discovery Tags (Enter to add)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-full flex items-center gap-2">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <input 
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium"
                placeholder="e.g. AI-Powered, Analytics, Node.js"
              />
            </div>

            {/* Features */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2">Key Features (Enter to add)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                {form.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl group/feat">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="text-xs text-white/70">{feature}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setForm(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }))}
                      className="text-white/20 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  id="feature-input"
                  className="flex-1 px-5 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium"
                  placeholder="e.g. Real-time data synchronization"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val && !form.features.includes(val)) {
                        setForm(prev => ({ ...prev, features: [...prev.features, val] }));
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('feature-input') as HTMLInputElement;
                    const val = input.value.trim();
                    if (val && !form.features.includes(val)) {
                      setForm(prev => ({ ...prev, features: [...prev.features, val] }));
                      input.value = '';
                    }
                  }}
                  className="px-6 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 rounded-2xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-3">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <div className="space-y-6 pt-4">
              {!isPaymentConfirmed ? (
                <div className="space-y-4">
                  <div className="p-6 rounded-[2rem] bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold">Listing & Audit Protocol</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Network Entry Fee: ${economy.listingFee}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (validateForm()) {
                          (initializePayment as any)(onSuccess, onClose);
                        }
                      }}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/20"
                    >
                      Initialize Payment
                    </button>
                  </div>
                  <button 
                    disabled
                    className="w-full py-5 bg-white/5 border border-white/5 text-white/20 font-bold rounded-2xl cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    <Shield className="w-5 h-5 opacity-20" /> Submit for Review (Locked)
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-[2rem] bg-green-500/10 border border-green-500/20 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-green-400">Payment successful.</p>
                      <p className="text-xs text-green-500/60 font-medium">Ref: {paymentReference}. You may now proceed to submit your work for review.</p>
                    </div>
                  </motion.div>
                  <button 
                    type="button"
                    onClick={() => handleSubmit(paymentReference || '')}
                    disabled={loading}
                    className="w-full py-5 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3 relative overflow-hidden group shadow-2xl shadow-white/10"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Rocket className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        Finalize Submission
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.form>
        )}

        {step === 'payment' && (
          <motion.div 
            key="payment"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8 p-12 rounded-[3.5rem] bg-white/5 border border-white/10 text-center"
          >
            <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-10 h-10 text-blue-500" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight">Deploy to Matrix</h3>
              <p className="text-white/40">Technical Audit & Listing Fee (Per Application)</p>
            </div>

            <div className="text-6xl font-black tracking-tighter py-4">
              <span className="text-2xl align-top mr-1 font-bold text-blue-500">$</span>{economy.listingFee}
            </div>

            <div className="space-y-4 pt-4">
              <button 
                onClick={() => (initializePayment as any)(onSuccess, onClose)}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20"
              >
                <DollarSign className="w-5 h-5" /> Execute Payment with Paystack
              </button>
              <button 
                onClick={() => setStep('form')}
                className="text-xs font-bold uppercase tracking-widest text-white/30 hover:text-white"
              >
                Return to Editor
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-8 opacity-20 filter grayscale">
              <img src="https://static-00.iconduck.com/assets.00/visa-icon-512x171-shshhsh.png" className="h-4" alt="Visa" />
              <img src="https://static-00.iconduck.com/assets.00/mastercard-icon-512x315-shshhsh.png" className="h-6" alt="Mastercard" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
