import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, Linkedin, Twitter, Facebook, Send, Loader2, CheckCircle2, MapPin } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-4 py-24">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-24"
      >
        <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter mb-6">
          {settings?.contactTitle || "Contact Us"}
        </h1>
        <p className="text-xl text-white/40 max-w-2xl mx-auto leading-relaxed">
          {settings?.contactDescription || "Have a question or feedback? We'd love to hear from you. Our team is ready to assist with any inquiries."}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Contact Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-12 rounded-[3rem] bg-white/5 border border-white/10"
        >
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border border-green-500/30">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Message Received!</h3>
              <p className="text-white/40 mb-8">
                Your inquiry has been successfully saved to our database. Our team will review it and get back to you shortly.
              </p>
              <button 
                onClick={() => setSubmitted(false)}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Full Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all text-sm"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Email Address</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all text-sm"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Subject</label>
                <input
                  required
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="How can we help?"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Message</label>
                <textarea
                  required
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  className="w-full h-40 bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all resize-none text-sm"
                  placeholder="Your message here..."
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Send Message
              </button>
            </form>
          )}
        </motion.div>

        {/* Contact Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="p-12 rounded-[3rem] bg-white/5 border border-white/10 space-y-12">
            <div>
              <h3 className="text-2xl font-bold mb-8">Get in Touch</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <Mail className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Email Us</div>
                    <a href={`mailto:${settings?.contactEmail || 'pymmcoresolutions@gmail.com'}`} className="text-lg font-medium hover:text-blue-400 transition-colors">
                      {settings?.contactEmail || 'pymmcoresolutions@gmail.com'}
                    </a>
                  </div>
                </div>

                {settings?.phoneNumber && (
                  <div className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                      <Phone className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Call Us</div>
                      <a href={`tel:${settings.phoneNumber}`} className="text-lg font-medium hover:text-purple-400 transition-colors">
                        {settings.phoneNumber}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
                    <MapPin className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Location</div>
                    <div className="text-lg font-medium">Global Operations Hub</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-6">Follow Our Journey</h3>
              <div className="flex gap-4">
                {[
                  { icon: Linkedin, url: settings?.linkedin, color: 'hover:text-blue-400' },
                  { icon: Twitter, url: settings?.twitter, color: 'hover:text-sky-400' },
                  { icon: Facebook, url: settings?.facebook, color: 'hover:text-blue-600' }
                ].map((social, idx) => (
                  <a
                    key={idx}
                    href={social.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all ${social.color} hover:bg-white/10 hover:scale-110`}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="p-8 rounded-[2rem] bg-gradient-to-br from-blue-600/20 to-purple-600/10 border border-white/10">
            <h4 className="font-bold mb-2">Support Hours</h4>
            <p className="text-sm text-white/40">
              Our team is available 24/7 for critical infrastructure support. 
              General inquiries are typically handled within 24 business hours.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
