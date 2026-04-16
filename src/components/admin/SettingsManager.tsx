import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Save, Mail, Phone, Linkedin, Twitter, Facebook, Loader2, CheckCircle2, Send, AlertCircle } from 'lucide-react';

export default function SettingsManager() {
  const [form, setForm] = useState({
    contactEmail: 'pymmcoresolutions@gmail.com',
    phoneNumber: '',
    linkedin: '',
    twitter: '',
    facebook: ''
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setForm(prev => ({ ...prev, ...snapshot.data() }));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        ...form,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Settings update failed:", error);
    }
    setLoading(false);
  };

  const handleTestSMTP = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/admin/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      setTestResult({
        success: data.success,
        message: data.success ? data.message : (data.error || "SMTP Test Failed"),
        details: data.code ? { code: data.code, response: data.response } : null
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: "Failed to connect to the test endpoint.",
        details: error.message
      });
    }
    setTestLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" /> Global Settings
        </h3>
        {saved && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-green-500 text-xs font-bold uppercase tracking-widest"
          >
            <CheckCircle2 className="w-4 h-4" /> Changes Saved
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6 p-8 rounded-3xl bg-white/5 border border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Contact Details</h4>
            
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                <Mail className="w-3 h-3" /> Primary Contact Email
              </label>
              <input
                required
                type="email"
                value={form.contactEmail}
                onChange={e => setForm({ ...form, contactEmail: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                <Phone className="w-3 h-3" /> Phone Number (Optional)
              </label>
              <input
                value={form.phoneNumber}
                onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all text-sm"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="space-y-6 p-8 rounded-3xl bg-white/5 border border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Social Presence</h4>
            
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                <Linkedin className="w-3 h-3" /> LinkedIn URL
              </label>
              <input
                type="url"
                value={form.linkedin}
                onChange={e => setForm({ ...form, linkedin: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all text-sm"
                placeholder="https://linkedin.com/company/..."
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                <Twitter className="w-3 h-3" /> Twitter URL
              </label>
              <input
                type="url"
                value={form.twitter}
                onChange={e => setForm({ ...form, twitter: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all text-sm"
                placeholder="https://twitter.com/..."
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                <Facebook className="w-3 h-3" /> Facebook URL
              </label>
              <input
                type="url"
                value={form.facebook}
                onChange={e => setForm({ ...form, facebook: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all text-sm"
                placeholder="https://facebook.com/..."
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Global Configuration
            </button>
          </div>
        </form>

        {/* SMTP Diagnostics */}
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
              <Send className="w-3 h-3" /> SMTP Diagnostics
            </h4>
            <p className="text-xs text-white/40 mb-6 leading-relaxed">
              Test your current SMTP configuration. This will attempt to connect to the server and send a test email to your primary contact email.
              <br /><br />
              <strong className="text-blue-400">Note:</strong> SMTP credentials (HOST, USER, PASS) must be configured in the <span className="text-white">Secrets</span> panel of AI Studio for email delivery to work.
            </p>
            
            <button
              onClick={handleTestSMTP}
              disabled={testLoading}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Test Connection
            </button>

            <AnimatePresence>
              {testResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-6 p-4 rounded-xl border ${
                    testResult.success ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {testResult.success ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
                    <div className="flex-1">
                      <div className="text-sm font-bold mb-1">{testResult.success ? 'Success' : 'Error'}</div>
                      <div className="text-xs opacity-80 leading-relaxed">{testResult.message}</div>
                      {testResult.details && (
                        <div className="mt-3 p-2 bg-black/20 rounded-lg text-[10px] font-mono break-all">
                          {JSON.stringify(testResult.details, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 rounded-2xl bg-blue-600/10 border border-blue-500/20">
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">Pro Tip</h5>
            <p className="text-[10px] text-white/40 leading-relaxed">
              Using Gmail? Make sure to use an <strong>App Password</strong> and set the port to <strong>587</strong>. 2FA must be enabled on your Google account to generate App Passwords.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
