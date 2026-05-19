import { motion, AnimatePresence } from 'motion/react';
import { 
  Book, Code, Terminal, Cpu, Shield, 
  Zap, Layers, Globe, Smartphone, Monitor,
  ArrowRight, CheckCircle2, Copy, Search,
  ExternalLink, FileText, Settings, Activity,
  Heart
} from 'lucide-react';
import { useState } from 'react';

export default function Documentation({ isEditor = false }: { isEditor?: boolean }) {
  const userSections = [
    {
      id: 'user-welcome',
      title: 'Welcome',
      icon: Book,
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold mb-4 tracking-tight">Marketplace Guide</h2>
            <p className="text-xl text-white/40 leading-relaxed max-w-2xl">
              Discover how to navigate the PymmCore ecosystem and find the perfect digital solutions for your workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
            <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-teal-500/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-6">
                <Search className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Discovery</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                Use our global search and multi-platform filters to drill down into specific environments including Web, iOS, and Desktop.
              </p>
            </div>
            <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
                <Heart className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Your Collection</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                Synchronize your wishlist across all devices. Save applications you're interested in and receive updates on version releases.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'browsing-apps',
      title: 'Browsing Apps',
      icon: Globe,
      content: (
        <div className="space-y-8">
          <h2 className="text-3xl font-bold tracking-tight">Navigating the Catalog</h2>
          <div className="space-y-6">
            <div className="flex gap-6 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">1</div>
              <div>
                <h4 className="font-bold mb-2">Category Selection</h4>
                <p className="text-sm text-white/40">Use the platform badges (iOS, Android, Web, Desktop) to filter the marketplace for compatible software.</p>
              </div>
            </div>
            <div className="flex gap-6 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">2</div>
              <div>
                <h4 className="font-bold mb-2">Detailed Analytics</h4>
                <p className="text-sm text-white/40">Click any application card to see detailed specifications, screenshots, and developer information.</p>
              </div>
            </div>
            <div className="flex gap-6 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">3</div>
              <div>
                <h4 className="font-bold mb-2">Reviews & Community</h4>
                <p className="text-sm text-white/40">Consult the community rating system to gauge performance and stability before deployment.</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const adminSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Zap,
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold mb-4 tracking-tight">System Initialization</h2>
            <p className="text-white/60 leading-relaxed">
              Welcome to the PymmCore Solutions technical documentation. Our ecosystem is designed for enterprise-grade performance and seamless integration across all digital nodes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-bold mb-2">Secure Access</h3>
              <p className="text-xs text-white/40 leading-relaxed">
                All API requests require a valid Protocol Key. Ensure your environment variables are configured with the latest PymmCore Auth tokens.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-bold mb-2">Real-time Sync</h3>
              <p className="text-xs text-white/40 leading-relaxed">
                Our Mesh Network ensures sub-100ms latency for global state synchronization across all connected devices.
              </p>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-black border border-white/10 font-mono text-sm relative group">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 mb-4 text-white/20">
              <Terminal className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Terminal Initialization</span>
            </div>
            <div className="space-y-1">
              <p className="text-blue-400">$ npm install @pymmcore/sdk</p>
              <p className="text-green-400">✓ Package synchronized</p>
              <p className="text-white/60">$ pymmcore init --protocol-v5</p>
              <p className="text-yellow-400">! Warning: Ensure HELIOS_PHASE is active</p>
              <p className="text-white/60">Initializing secure uplink...</p>
              <p className="text-blue-400">Done. System ready.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      icon: Code,
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold mb-4 tracking-tight">Core API Toolkit</h2>
            <p className="text-white/60 leading-relaxed">
              Interact with the PymmCore infrastructure using our standardized REST and GraphQL endpoints.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { method: 'GET', path: '/v5/nodes', desc: 'Retrieve all active infrastructure nodes.' },
              { method: 'POST', path: '/v5/uplink', desc: 'Establish a secure data bridge to the MAAY Hub.' },
              { method: 'PUT', path: '/v5/settings', desc: 'Update global environment configuration.' },
              { method: 'DELETE', path: '/v5/session', desc: 'Terminate active protocol session.' }
            ].map((api, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-black ${
                    api.method === 'GET' ? 'bg-green-500/10 text-green-500' :
                    api.method === 'POST' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-yellow-500/10 text-yellow-500'
                  }`}>{api.method}</span>
                  <code className="text-sm font-mono text-white/80">{api.path}</code>
                </div>
                <span className="text-xs text-white/40">{api.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'architecture',
      title: 'Architecture',
      icon: Layers,
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold mb-4 tracking-tight">Mesh Network Design</h2>
            <p className="text-white/60 leading-relaxed">
              PymmCore utilizes a decentralized mesh topology to ensure zero single points of failure.
            </p>
          </div>

          <div className="relative p-12 rounded-[3rem] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
            <div className="relative z-10 flex flex-col items-center gap-8">
              <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/40">
                <Cpu className="w-10 h-10 text-white" />
              </div>
              <div className="flex gap-12">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white/60" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Mobile</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-white/60" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Web</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                    <Monitor className="w-6 h-6 text-white/60" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Desktop</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const sections = isEditor ? [...userSections, ...adminSections] : userSections;
  const [activeSection, setActiveSection] = useState(sections[0].id);

  return (
    <div className="min-h-screen bg-transparent text-white pt-24 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="sticky top-32 space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Book className="w-4 h-4" />
                  </div>
                  <span className="text-lg font-bold tracking-tighter">DOCS V5.0</span>
                </div>
                <div className="space-y-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        activeSection === section.id 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                          : 'text-white/40 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <section.icon className="w-4 h-4" />
                      {section.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">Need Help?</h4>
                <p className="text-xs text-white/40 leading-relaxed mb-4">
                  Our {isEditor ? 'engineering' : 'customer success'} team is available 24/7 for protocol support.
                </p>
                <a href="#contact" className="text-xs font-bold text-white hover:text-blue-400 transition-colors flex items-center gap-2">
                  Contact Support <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {sections.find(s => s.id === activeSection)?.content}
              </motion.div>
            </AnimatePresence>

            <div className="mt-20 pt-10 border-t border-white/5 flex justify-between items-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                Last updated: April 14, 2026
              </div>
              <div className="flex gap-4">
                <button className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all">
                  <Settings className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all">
                  <Globe className="w-4 h-4" />
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
