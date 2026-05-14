import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, Twitter, Facebook, Send, Loader2, CheckCircle2, MapPin, Music2, Instagram, Linkedin } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data());
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Save to Firestore for archival
      await addDoc(collection(db, 'messages'), {
        ...form,
        createdAt: serverTimestamp()
      });

      // 2. Send via SMTP API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      setSubmitted(true);
      if (result.warning || result.emailStatus === 'skipped' || result.emailStatus === 'failed') {
        console.warn("SMTP Delivery Issue:", result.warning || result.debug);
      }
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      console.error("Failed to send message:", error);
      alert(error.message || "There was an error sending your message. Please try again later.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-32 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-32 space-y-8"
      >
        <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-cyan-500/5 border border-cyan-500/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">Communication.Uplink</span>
        </div>
        
        <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[0.75] uppercase flex flex-col items-center">
          <motion.span 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
          >
            {settings?.contactTitle?.split(' ')[0] || "Get"}
          </motion.span>
          <motion.span 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-cyan-500 drop-shadow-[0_0_30px_rgba(0,255,255,0.3)]"
          >
            {settings?.contactTitle?.split(' ').slice(1).join(' ') || "Connected."}
          </motion.span>
        </h1>

        <p className="text-xl text-white/30 max-w-2xl mx-auto leading-relaxed font-light italic">
          "{settings?.contactDescription || "Initialize a direct neural link to our operations hub. We process complex inquiries with algorithmic precision."}"
        </p>

        <div className="flex justify-center gap-12 pt-8">
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 mb-2">Channel.Status</span>
            <span className="text-xs font-mono text-cyan-500">ENCRYPTED</span>
          </div>
          <div className="w-[1px] h-10 bg-white/5" />
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 mb-2">Response.Rate</span>
            <span className="text-xs font-mono text-cyan-500">&lt; 24H</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Contact Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="p-12 rounded-[3.5rem] bg-black/40 border border-white/10 shadow-2xl backdrop-blur-2xl relative overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-600/10 blur-[80px] rounded-full pointer-events-none" />
          
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-24 h-24 bg-cyan-500/20 rounded-[2rem] flex items-center justify-center mb-8 border border-cyan-500/30">
                <CheckCircle2 className="w-12 h-12 text-cyan-500" />
              </div>
              <h3 className="text-3xl font-black tracking-tighter mb-4 uppercase">Message Logged</h3>
              <p className="text-white/40 mb-10 font-light leading-relaxed">
                Your inquiry has been successfully transmitted to the PymmCore archives. 
                Our team will process the directive and respond in kind.
              </p>
              <button 
                onClick={() => setSubmitted(false)}
                className="px-10 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95"
              >
                New Transmission
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500/60 ml-1">Identity.Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-cyan-500/50 focus:bg-cyan-500/5 outline-none transition-all text-sm font-mono placeholder:text-white/20"
                    placeholder="ENTER NAME"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500/60 ml-1">Identity.Email</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-cyan-500/50 focus:bg-cyan-500/5 outline-none transition-all text-sm font-mono placeholder:text-white/20"
                    placeholder="EMAIL_ADDRESS"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500/60 ml-1">Protocol.Subject</label>
                <input
                  required
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-cyan-500/50 focus:bg-cyan-500/5 outline-none transition-all text-sm font-mono placeholder:text-white/20"
                  placeholder="INQUIRY TYPE"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500/60 ml-1">Payload.Message</label>
                <textarea
                  required
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-cyan-500/50 focus:bg-cyan-500/5 outline-none transition-all resize-none text-sm font-mono placeholder:text-white/20 scrollbar-hide"
                  placeholder="TYPE MESSAGE HERE..."
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-[0.4em] rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:shadow-cyan-500/40 disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 group-hover:translate-x-1" />}
                Transmit Data
              </button>
            </form>
          )}
        </motion.div>

        {/* Contact Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <div className="p-12 rounded-[3.5rem] bg-black/20 border border-white/10 backdrop-blur-xl space-y-12 relative overflow-hidden">
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />
            
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-500 mb-10 ml-1 italic">// GRID CHANNELS</h3>
              <div className="space-y-10">
                <div className="flex items-center gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/20 transition-all duration-500 group-hover:rotate-12">
                    <Mail className="w-6 h-6 text-cyan-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Secured.Mail</div>
                    <a href={`mailto:${settings?.contactEmail || 'pymmcoresolutions@gmail.com'}`} className="text-xs md:text-base font-mono text-white/80 hover:text-cyan-400 transition-colors break-all">
                      {settings?.contactEmail || 'pymmcoresolutions@gmail.com'}
                    </a>
                  </div>
                </div>

                {settings?.phoneNumber && (
                  <div className="flex items-center gap-6 group">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-all duration-500 group-hover:-rotate-12">
                      <Phone className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Voice.Uplink</div>
                      <a href={`tel:${settings.phoneNumber}`} className="text-xl font-mono text-white/80 hover:text-purple-400 transition-colors">
                        {settings.phoneNumber}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all duration-500 group-hover:scale-110">
                    <MapPin className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Spatial.Origin</div>
                    <div className="text-xl font-mono text-white/80">GLOBAL_OPERATIONS_HUB</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500 mb-8 ml-1 italic">// SOCIAL FREQUENCIES</h3>
              <div className="flex gap-4">
                {[
                  { icon: Music2, url: settings?.tiktok, color: 'text-rose-500 border-rose-500/20 shadow-rose-500/10' },
                  { icon: Instagram, url: settings?.instagram, color: 'text-pink-500 border-pink-500/20 shadow-pink-500/10' },
                  { icon: Linkedin, url: settings?.linkedin, color: 'text-cyan-500 border-cyan-500/20 shadow-cyan-500/10' },
                  { icon: Twitter, url: settings?.twitter, color: 'text-sky-400 border-sky-400/20 shadow-sky-400/10' },
                  { icon: Facebook, url: settings?.facebook, color: 'text-indigo-500 border-indigo-500/20 shadow-indigo-500/10' }
                ].map((social, idx) => (
                  <a
                    key={idx}
                    href={social.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className={`w-14 h-14 rounded-2xl bg-white/5 border flex items-center justify-center transition-all duration-500 ${social.color} hover:bg-white/10 hover:scale-110 active:scale-95 group shadow-lg`}
                  >
                    <social.icon className="w-6 h-6 transition-transform group-hover:scale-125" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-cyan-600/10 via-black/40 to-emerald-600/10 border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 opacity-60">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              Runtime Support Status
            </div>
            <p className="text-sm font-light text-white/40 leading-relaxed italic">
              "Matrix protocols optimized for 24/7 infrastructure monitoring. 
              General node inquiries integrated within 1440 standard chronometric units."
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
