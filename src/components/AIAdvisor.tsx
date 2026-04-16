import { useState } from 'react';
import { getAIAdvice } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, Loader2, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AIAdvisor({ isFullPage = false }: { isFullPage?: boolean }) {
  const [isOpen, setIsOpen] = useState(isFullPage);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    
    const advice = await getAIAdvice(userMsg);
    setMessages(prev => [...prev, { role: 'ai', content: advice }]);
    setLoading(false);
  };

  const ChatContent = (
    <div className={`flex flex-col overflow-hidden ${
      isFullPage 
        ? 'w-full h-[calc(100vh-200px)] bg-white/5 border border-white/10 rounded-3xl shadow-2xl' 
        : 'fixed bottom-24 right-8 w-[400px] h-[600px] bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl z-50'
    }`}>
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Product Consultant</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Marketplace Intelligence</p>
          </div>
        </div>
        {!isFullPage && (
          <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors">
            <Send className="w-4 h-4 rotate-45" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
              <Bot className="w-8 h-8 text-blue-400" />
            </div>
            <h4 className="font-bold mb-2">Marketplace Intelligence</h4>
            <p className="text-sm text-white/40 max-w-[240px]">Ask me about our premium applications, platform compatibility, or finding the right solution for your business.</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={idx} 
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`p-2 rounded-lg h-fit ${msg.role === 'user' ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'bg-white/10 border border-white/10'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' ? 'bg-blue-600/10 border border-blue-500/20 rounded-tr-none' : 'bg-white/5 border border-white/10 rounded-tl-none'
            }`}>
              <div className="markdown-body prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="p-2 rounded-lg bg-white/10 h-fit border border-white/10">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-white/10 bg-white/5">
        <div className="relative">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about our applications..."
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-4 text-sm focus:border-blue-500 outline-none transition-all shadow-inner"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {!isFullPage && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-2xl shadow-blue-600/40 z-50 transition-all hover:scale-110 active:scale-95"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {isFullPage ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tighter mb-2">Product Advisor</h2>
            <p className="text-white/40 text-sm">Intelligent guidance for selecting the perfect application for your needs.</p>
          </div>
          {ChatContent}
        </motion.div>
      ) : (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="z-50"
            >
              {ChatContent}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
