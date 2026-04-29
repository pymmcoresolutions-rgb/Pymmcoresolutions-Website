import { useState, useEffect } from 'react';
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
import { useAuth } from '../lib/auth';
import { auditApplication } from '../services/geminiService';
import ImageUploader from './ui/ImageUploader';

interface AppSubmissionForm {
  id?: string;
  name: string;
  description: string;
  type: 'Web' | 'Mobile' | 'Desktop';
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
  
  const [drafts, setDrafts] = useState<AppSubmissionForm[]>([]);
  
  const [form, setForm] = useState<AppSubmissionForm>({
    name: '',
    description: '',
    type: 'Web',
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

  const startNewSubmission = () => {
    setForm({
      name: '',
      description: '',
      type: 'Web',
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

  // Paystack Configuration
  const config = {
    reference: (new Date()).getTime().toString(),
    email: user?.email || '',
    amount: 25 * 100 * 1600, // $25 in Kobo (1600 NGN exchange rate approx or use flat USD if supported)
    // AI Studio uses NGN for Paystack usually if in NG, otherwise depends on public key currency.
    // Let's assume NGN for the demo or base it on $25 equivalent.
    publicKey: (import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY || '',
  };

  const onSuccess = (reference: any) => {
    handleSubmit(reference.reference);
  };

  const onClose = () => {
    setError("Payment was cancelled. Completion required to deploy.");
  };

  const initializePayment = usePaystackPayment(config);

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

  const validateForm = () => {
    if (!form.name || !form.description || !form.category || !form.developer || !form.price) {
      setError("Please fill in all required operational fields.");
      return false;
    }
    if (form.description.length < 50) {
      setError("Description is too brief. Provide more technical details.");
      return false;
    }
    // Simple automated spam check
    const spamWords = ['buy now', 'cheap', 'viagra', 'casino', 'free money'];
    const content = (form.name + ' ' + form.description).toLowerCase();
    if (spamWords.some(word => content.includes(word))) {
      setError("Content flagged by Spam Filter. Please revise your metadata.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    setSaveStatus('saving');
    try {
      if (form.id) {
        await updateDoc(doc(db, 'apps', form.id), {
          ...form,
          updatedAt: serverTimestamp()
        });
      } else {
        const newDoc = await addDoc(collection(db, 'apps'), {
          ...form,
          authorUid: user.uid,
          createdAt: serverTimestamp(),
          isDraft: true,
          approvalStatus: 'pending',
          paymentStatus: 'unpaid',
          status: 'inactive'
        });
        setForm(prev => ({ ...prev, id: newDoc.id }));
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
    try {
      // Stage: AI Auditor 
      const audit = await auditApplication({
        name: form.name,
        description: form.description,
        link: form.link,
        developer: form.developer,
        sourceCodeUrl: form.sourceCodeUrl
      });

      const submissionData = {
        ...form,
        authorUid: user?.uid,
        updatedAt: serverTimestamp(),
        approvalStatus: 'pending',
        paymentStatus: 'paid',
        paymentReference: paymentRef,
        status: 'inactive',
        isDraft: false, // NO LONGER A DRAFT
        aiRiskScore: audit.riskScore,
        aiReport: audit.report
      };

      if (form.id) {
        await updateDoc(doc(db, 'apps', form.id), submissionData);
      } else {
        await addDoc(collection(db, 'apps'), {
          ...submissionData,
          createdAt: serverTimestamp()
        });
      }
      setStep('success');
    } catch (err) {
      console.error("Submission failed:", err);
      setError("Critical failure in submission uplink.");
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
          <p className="text-white/40">Your application has been uploaded to the Matrix Review Protocol. Our administrators will verify the deployment within 24-48 hours.</p>
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
                <p className="text-sm font-bold">Listing Fee Protocol</p>
                <p className="text-xs text-white/40">A flat listing fee of $25 is required to process your submission. This covers the human technical review and global matrix indexing.</p>
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
              if (validateForm()) setStep('payment');
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2">Platform Type *</label>
                  <select 
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value as any })}
                    className="w-full px-5 py-4 bg-[#0a0a0a] border border-white/10 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium appearance-none"
                  >
                    <option value="Web">Web (SPA/SaaS)</option>
                    <option value="Mobile">Mobile (iOS/Android)</option>
                    <option value="Desktop">Desktop (macOS/Windows)</option>
                  </select>
                </div>
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

            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-3">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-5 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all"
            >
              Validate & Proceed to Payment
            </button>
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
              <p className="text-white/40">Technical Audit & Listing Fee</p>
            </div>

            <div className="text-6xl font-black tracking-tighter py-4">
              <span className="text-2xl align-top mr-1 font-bold text-blue-500">$</span>25
            </div>

            <div className="space-y-4 pt-4">
              <button 
                onClick={() => initializePayment({onSuccess, onClose})}
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
