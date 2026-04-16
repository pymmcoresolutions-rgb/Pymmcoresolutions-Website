import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Trash2, Calendar, User, MessageSquare, ChevronDown, Send, Loader2, CheckCircle2, X } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

export default function InquiryManager() {
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyStatus, setReplyStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'messages', id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingTo || !replyMessage.trim()) return;

    setSendingReply(true);
    setReplyStatus(null);

    try {
      const response = await fetch('/api/admin/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: replyingTo.email,
          subject: replyingTo.subject,
          message: replyMessage,
          originalMessage: replyingTo.message
        })
      });

      const data = await response.json();
      if (data.success) {
        setReplyStatus({ success: true, message: "Reply sent successfully!" });
        setReplyMessage('');
        setTimeout(() => setReplyingTo(null), 2000);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      setReplyStatus({ success: false, message: error.message || "Failed to send reply." });
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-400" /> User Inquiries
        </h3>
        <span className="text-xs text-white/40 font-bold uppercase tracking-widest">
          {messages.length} Total Messages
        </span>
      </div>

      <div className="space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`p-6 rounded-2xl bg-white/5 border transition-all ${
              selectedId === msg.id ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex justify-between items-start gap-4">
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => setSelectedId(selectedId === msg.id ? null : msg.id)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-bold text-lg">{msg.subject}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/40 font-bold uppercase tracking-widest">
                    {msg.createdAt?.toDate().toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/40">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {msg.name}</span>
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {msg.email}</span>
                </div>
              </div>
              <button 
                onClick={() => setConfirmDelete(msg.id)}
                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-white/20 hover:text-red-500"
                title="Delete Inquiry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <AnimatePresence>
              {selectedId === msg.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-6 mt-6 border-t border-white/5">
                    <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-3 h-3" /> Message Content
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap bg-black/20 p-4 rounded-xl border border-white/5">
                      {msg.message}
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                      <a 
                        href={`mailto:${msg.email}?subject=Re: ${msg.subject}`}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
                      >
                        External Mail
                      </a>
                      <button 
                        onClick={() => {
                          setReplyingTo(msg);
                          setReplyStatus(null);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2"
                      >
                        <Send className="w-3 h-3" /> Reply Now
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
            <Mail className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <h4 className="font-bold text-white/40">No inquiries yet</h4>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      <AnimatePresence>
        {replyingTo && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !sendingReply && setReplyingTo(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0A0A0B] border border-white/10 rounded-[2rem] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold">Reply to Inquiry</h3>
                  <p className="text-sm text-white/40">Sending to: {replyingTo.email}</p>
                </div>
                <button 
                  onClick={() => setReplyingTo(null)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/20 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">Original Message</div>
                <p className="text-xs text-white/40 italic line-clamp-3">{replyingTo.message}</p>
              </div>

              <form onSubmit={handleSendReply} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Your Response</label>
                  <textarea
                    required
                    autoFocus
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    className="w-full h-48 bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all resize-none text-sm"
                    placeholder="Type your reply here..."
                  />
                </div>

                {replyStatus && (
                  <div className={`p-4 rounded-xl text-sm flex items-center gap-3 ${
                    replyStatus.success ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}>
                    {replyStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {replyStatus.message}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingReply || !replyMessage.trim()}
                    className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                  >
                    {sendingReply ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    Send Reply
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Inquiry"
        message="Are you sure you want to permanently delete this user inquiry? This action cannot be undone."
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
