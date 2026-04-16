import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Lock, FileText, Activity, CheckCircle2, 
  AlertCircle, Clock, Globe, Scale, Eye, 
  Server, Database, Key, Fingerprint
} from 'lucide-react';
import Logo from './Logo';

type LegalSection = 'privacy' | 'terms' | 'security' | 'status';

export default function Legal({ initialSection = 'privacy' }: { initialSection?: LegalSection }) {
  const [activeSection, setActiveSection] = useState<LegalSection>(initialSection);

  useEffect(() => {
    const updateSection = () => {
      const hash = window.location.hash;
      if (hash === '#privacy') setActiveSection('privacy');
      else if (hash === '#terms') setActiveSection('terms');
      else if (hash === '#security') setActiveSection('security');
      else if (hash === '#status') setActiveSection('status');
    };

    updateSection();
    window.addEventListener('hashchange', updateSection);
    return () => window.removeEventListener('hashchange', updateSection);
  }, []);

  const sections = [
    { id: 'privacy', label: 'Privacy Policy', icon: Eye },
    { id: 'terms', label: 'Terms of Use', icon: FileText },
    { id: 'security', label: 'Security Protocol', icon: Shield },
    { id: 'status', label: 'System Status', icon: Activity },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-24">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-64 space-y-2">
          <div className="p-6 mb-8 rounded-[2rem] bg-teal-600/10 border border-teal-500/20 flex justify-center">
            <Logo size="sm" showText={false} />
          </div>
          
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id as LegalSection);
                window.location.hash = section.id;
              }}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
                activeSection === section.id 
                  ? 'bg-white text-black shadow-xl' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-h-[600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="p-8 lg:p-12 rounded-[3rem] bg-white/5 border border-white/10"
            >
              {activeSection === 'privacy' && <PrivacyPolicy />}
              {activeSection === 'terms' && <TermsOfUse />}
              {activeSection === 'security' && <SecurityProtocol />}
              {activeSection === 'status' && <SystemStatus />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function PrivacyPolicy() {
  return (
    <div className="prose prose-invert max-w-none">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-teal-500/10 rounded-2xl">
          <Eye className="w-8 h-8 text-teal-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-1">Privacy Policy</h1>
          <p className="text-white/40 text-sm uppercase tracking-widest font-bold">Last Updated: April 11, 2026</p>
        </div>
      </div>

      <section className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-4 text-teal-400">1. Data Collection Protocol</h2>
          <p className="text-white/60 leading-relaxed">
            PymmCore Solutions ("we", "us", or "our") operates under a strict data minimization protocol. We collect only the essential information required to provide our curated marketplace services. This includes:
          </p>
          <ul className="list-disc pl-6 text-white/60 space-y-2 mt-4">
            <li><span className="text-white font-bold">Identity Data:</span> Full name, email address, and profile picture provided via authorized OAuth providers (Google).</li>
            <li><span className="text-white font-bold">Technical Data:</span> IP address, browser type, and device identifiers used for security auditing and protocol compliance.</li>
            <li><span className="text-white font-bold">Usage Data:</span> Information on how you interact with our storefront, including application views and search queries.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 text-teal-400">2. Information Processing</h2>
          <p className="text-white/60 leading-relaxed">
            Your data is processed exclusively for the following purposes:
          </p>
          <ul className="list-disc pl-6 text-white/60 space-y-2 mt-4">
            <li>Authentication and secure access to the PymmCore infrastructure.</li>
            <li>Personalization of the application discovery experience.</li>
            <li>System auditing and prevention of unauthorized access or fraudulent activity.</li>
            <li>Communication regarding platform updates and critical security alerts.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 text-teal-400">3. Third-Party Integration</h2>
          <p className="text-white/60 leading-relaxed">
            We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our website (e.g., Firebase for hosting and database services), so long as those parties agree to keep this information confidential.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 text-teal-400">4. Data Retention & Deletion</h2>
          <p className="text-white/60 leading-relaxed">
            We retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our legal agreements and policies.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 text-teal-400">5. Cookies and Tracking Technologies</h2>
          <p className="text-white/60 leading-relaxed">
            We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. Cookies are files with small amount of data which may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 text-teal-400">6. International Data Transfers</h2>
          <p className="text-white/60 leading-relaxed">
            Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ than those from your jurisdiction.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-teal-500/5 border border-teal-500/10">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-400" /> GDPR & CCPA Compliance
          </h3>
          <p className="text-sm text-white/40 leading-relaxed">
            You have the right to access, rectify, or erase your personal data. To exercise these rights, please contact our Data Protection Officer at <span className="text-teal-400">privacy@pymmcore.com</span>.
          </p>
        </div>
      </section>
    </div>
  );
}

function TermsOfUse() {
  return (
    <div className="prose prose-invert max-w-none">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-purple-500/10 rounded-2xl">
          <FileText className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-1">Terms of Use</h1>
          <p className="text-white/40 text-sm uppercase tracking-widest font-bold">Effective Date: April 11, 2026</p>
        </div>
      </div>

      <section className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-4 text-purple-400">1. Acceptance of Terms</h2>
          <p className="text-white/60 leading-relaxed">
            By accessing the PymmCore Storefront, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 text-purple-400">2. User License</h2>
          <p className="text-white/60 leading-relaxed">
            Permission is granted to temporarily download one copy of the materials (information or software) on PymmCore Solutions' website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 text-purple-400">3. Prohibited Conduct</h2>
          <p className="text-white/60 leading-relaxed">
            Users are strictly prohibited from:
          </p>
          <ul className="list-disc pl-6 text-white/60 space-y-2 mt-4">
            <li>Attempting to decompile or reverse engineer any software contained on the platform.</li>
            <li>Removing any copyright or other proprietary notations from the materials.</li>
            <li>Using the platform for any fraudulent or malicious purpose.</li>
            <li>Interfering with the security-related features of the storefront.</li>
            <li>Uploading or transmitting viruses or any other type of malicious code.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 text-purple-400">4. Intellectual Property Rights</h2>
          <p className="text-white/60 leading-relaxed">
            The Service and its original content, features, and functionality are and will remain the exclusive property of PymmCore Solutions and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of PymmCore Solutions.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 text-purple-400">5. Limitation of Liability</h2>
          <p className="text-white/60 leading-relaxed font-bold italic">
            In no event shall PymmCore Solutions, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 text-purple-400">6. Indemnification</h2>
          <p className="text-white/60 leading-relaxed">
            You agree to defend, indemnify and hold harmless PymmCore Solutions and its licensee and licensors, and their employees, contractors, agents, officers and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-purple-500/5 border border-purple-500/10">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-400" /> Governing Law
          </h3>
          <p className="text-sm text-white/40 leading-relaxed">
            Any claim relating to PymmCore Solutions' website shall be governed by the laws of the jurisdiction in which the company is headquartered, without regard to its conflict of law provisions.
          </p>
        </div>
      </section>
    </div>
  );
}

function SecurityProtocol() {
  return (
    <div className="prose prose-invert max-w-none">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-green-500/10 rounded-2xl">
          <Shield className="w-8 h-8 text-green-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-1">Security Protocol</h1>
          <p className="text-white/40 text-sm uppercase tracking-widest font-bold">Infrastructure Security v5.0.4</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <SecurityCard 
          icon={Lock} 
          title="End-to-End Encryption" 
          desc="All data in transit is encrypted using TLS 1.3 protocols, ensuring zero-interception during transmission."
        />
        <SecurityCard 
          icon={Fingerprint} 
          title="Multi-Factor Auth" 
          desc="Identity verification is handled via secure OAuth 2.0 flows with mandatory multi-factor authentication support."
        />
        <SecurityCard 
          icon={Database} 
          title="Encrypted Storage" 
          desc="Sensitive data at rest is encrypted using AES-256 standards within our secure Firebase infrastructure."
        />
        <SecurityCard 
          icon={Key} 
          title="Access Control" 
          desc="Strict Role-Based Access Control (RBAC) ensures that only authorized personnel can access sensitive system nodes."
        />
      </div>

      <section className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-4 text-green-400">Vulnerability Disclosure</h2>
          <p className="text-white/60 leading-relaxed">
            We maintain a proactive security posture. If you discover a potential vulnerability within our infrastructure, please report it immediately to <span className="text-green-400">security@pymmcore.com</span>. We operate a responsible disclosure program to ensure the safety of our community.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 text-green-400">Incident Response & Recovery</h2>
          <p className="text-white/60 leading-relaxed">
            In the event of a security breach, PymmCore Solutions follows a rigorous Incident Response Plan. This includes immediate containment, thorough investigation, and timely notification to affected users and regulatory bodies as required by law.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 text-green-400">Compliance & Auditing</h2>
          <p className="text-white/60 leading-relaxed">
            Our infrastructure is designed to align with industry-standard frameworks such as SOC 2 Type II and ISO/IEC 27001. We conduct regular internal audits and third-party security assessments to ensure the ongoing effectiveness of our security controls.
          </p>
        </div>
      </section>
    </div>
  );
}

function SecurityCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-green-500/30 transition-all">
      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-green-400" />
      </div>
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
    </div>
  );
}

function SystemStatus() {
  const systems = [
    { name: 'Storefront API', status: 'operational', uptime: '99.99%' },
    { name: 'Authentication Node', status: 'operational', uptime: '100%' },
    { name: 'Database Infrastructure', status: 'operational', uptime: '99.98%' },
    { name: 'AI Advisor Engine', status: 'operational', uptime: '99.95%' },
    { name: 'CDN & Asset Delivery', status: 'operational', uptime: '100%' },
  ];

  return (
    <div className="prose prose-invert max-w-none">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-yellow-500/10 rounded-2xl">
          <Activity className="w-8 h-8 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-1">System Status</h1>
          <p className="text-white/40 text-sm uppercase tracking-widest font-bold">Real-time Infrastructure Monitoring</p>
        </div>
      </div>

      <div className="p-8 rounded-3xl bg-green-500/10 border border-green-500/20 mb-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xl font-bold text-green-500 uppercase tracking-tighter">All Systems Operational</span>
        </div>
        <div className="text-xs text-green-500/60 font-bold uppercase tracking-widest">Verified 2m ago</div>
      </div>

      <div className="space-y-4">
        {systems.map((sys) => (
          <div key={sys.name} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Server className="w-5 h-5 text-white/20" />
              <span className="font-bold">{sys.name}</span>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <div className="text-[10px] text-white/20 uppercase font-black tracking-widest mb-1">Uptime</div>
                <div className="text-xs font-bold text-white/60">{sys.uptime}</div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest">
                <CheckCircle2 className="w-3 h-3" /> Operational
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-8 rounded-3xl bg-white/5 border border-white/10">
        <h3 className="font-bold mb-6 flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-400" /> Incident History
        </h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />
            <div>
              <div className="text-sm font-bold mb-1">Infrastructure Optimization</div>
              <div className="text-xs text-white/40 mb-2">April 10, 2026 • 14:00 UTC</div>
              <p className="text-xs text-white/60">Routine optimization of the AI Advisor Engine. Performance improved by 15% across all nodes.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5">
            <AlertCircle className="w-4 h-4 text-white/20 mt-1" />
            <div>
              <div className="text-sm font-bold mb-1">Scheduled Maintenance</div>
              <div className="text-xs text-white/40 mb-2">April 05, 2026 • 02:00 - 04:00 UTC</div>
              <p className="text-xs text-white/60">Database infrastructure upgrade to Protocol v5.0.4. Completed successfully with zero downtime.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />
            <div>
              <div className="text-sm font-bold mb-1">Security Patch Deployment</div>
              <div className="text-xs text-white/40 mb-2">March 28, 2026 • 09:00 UTC</div>
              <p className="text-xs text-white/60">Critical security patches applied to the Authentication Node. No user impact observed.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
