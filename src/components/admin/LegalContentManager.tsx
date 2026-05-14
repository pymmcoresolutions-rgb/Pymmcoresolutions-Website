import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { motion } from 'motion/react';
import { 
  Shield, FileText, Star, Activity, Save, 
  Loader2, CheckCircle2, Eye, Lock, Globe
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const DEFAULTS = {
  privacyPolicy: `## 1. Data Collection Protocol
PymmCore Solutions ("we", "us", or "our") operates under a strict data minimization protocol. We collect only the essential information required to provide our curated marketplace services. This includes:

- **Identity Data:** Full name, email address, and profile picture provided via authorized OAuth providers (Google).
- **Technical Data:** IP address, browser type, and device identifiers used for security auditing and protocol compliance.
- **Usage Data:** Information on how you interact with our storefront, including application views and search queries.

## 2. Information Processing
Your data is processed exclusively for the following purposes:

- Authentication and secure access to the PymmCore infrastructure.
- Personalization of the application discovery experience.
- System auditing and prevention of unauthorized access or fraudulent activity.
- Communication regarding platform updates and critical security alerts.

## 3. Third-Party Integration
We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our website (e.g., Firebase for hosting and database services), so long as those parties agree to keep this information confidential.

## 4. Data Retention & Deletion
We retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our legal agreements and policies.

## 5. Cookies and Tracking Technologies
We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. Cookies are files with small amount of data which may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.

## 6. International Data Transfers
Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ than those from your jurisdiction.

### GDPR & CCPA Compliance
You have the right to access, rectify, or erase your personal data. To exercise these rights, please contact our Data Protection Officer at privacy@pymmcore.com.`,
  termsOfUse: `## 1. Acceptance of Terms
By accessing the PymmCore Storefront, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.

## 2. User License
Permission is granted to temporarily download one copy of the materials (information or software) on PymmCore Solutions' website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.

## 3. Prohibited Conduct
Users are strictly prohibited from:
- Attempting to decompile or reverse engineer any software contained on the platform.
- Removing any copyright or other proprietary notations from the materials.
- Using the platform for any fraudulent or malicious purpose.
- Interfering with the security-related features of the storefront.
- Uploading or transmitting viruses or any other type of malicious code.

## 4. Intellectual Property Rights
The Service and its original content, features, and functionality are and will remain the exclusive property of PymmCore Solutions and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of PymmCore Solutions.

## 5. Limitation of Liability
In no event shall PymmCore Solutions, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.

## 6. Indemnification
You agree to defend, indemnify and hold harmless PymmCore Solutions and its licensee and licensors, and their employees, contractors, agents, officers and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses.

### Governing Law
Any claim relating to PymmCore Solutions' website shall be governed by the laws of the jurisdiction in which the company is headquartered, without regard to its conflict of law provisions.`,
  securityProtocol: `## End-to-End Encryption
All data in transit is encrypted using TLS 1.3 protocols, ensuring zero-interception during transmission.

## Multi-Factor Auth
Identity verification is handled via secure OAuth 2.0 flows with mandatory multi-factor authentication support.

## Encrypted Storage
Sensitive data at rest is encrypted using AES-256 standards within our secure Firebase infrastructure.

## Access Control
Strict Role-Based Access Control (RBAC) ensures that only authorized personnel can access sensitive system nodes.

## Vulnerability Disclosure
We maintain a proactive security posture. If you discover a potential vulnerability within our infrastructure, please report it immediately to security@pymmcore.com. We operate a responsible disclosure program to ensure the safety of our community.

## Incident Response & Recovery
In the event of a security breach, PymmCore Solutions follows a rigorous Incident Response Plan. This includes immediate containment, thorough investigation, and timely notification to affected users and regulatory bodies as required by law.

## Compliance & Auditing
Our infrastructure is designed to align with industry-standard frameworks such as SOC 2 Type II and ISO/IEC 27001. We conduct regular internal audits and third-party security assessments to ensure the ongoing effectiveness of our security controls.`,
  qualityGuidelines: `## 1. Performance & Fluidity
Every application listed on PymmCore must meet rigorous speed benchmarks. Interaction latency must be sub-50ms, and critical rendering paths must be optimized for immediate feedback.

## 2. Intentional UX/UI
We reject generic design patterns. Applications must exhibit distinctive aesthetic choices, clear information hierarchy, and intuitive navigation flows that respect user cognitive load.

## 3. Security Zero-Trust
Security is not an afterthought. All applications must implement strict authentication guards, sanitized data inputs, and encrypted transmission protocols as per our Infrastructure v5 standards.

## 4. Reliability Matrix
Apps must handle edge cases gracefully. Error states must be informative, and system failures must be isolated through robust architecture to prevent cascade effects.

## Comprehensive Evaluation Criteria
- **Accessibility Compliance**: WCAG 2.1 Level AA color contrast and screen reader support is mandatory.
- **Code Integrity**: Vetted through automated linting and manual architect review for performance leaks.
- **Ethical Standards**: Strict prohibition of dark patterns, notification spam, or unauthorized data harvesting.

Failure to adhere to these guidelines results in immediate revocation of platform tokens and removal from the PymmCore discovery network.`,
  systemStatusMessage: 'All Systems Operational'
};

export default function LegalContentManager() {
  const { logActivity } = useAuth();
  const [form, setForm] = useState({
    privacyPolicy: DEFAULTS.privacyPolicy,
    termsOfUse: DEFAULTS.termsOfUse,
    securityProtocol: DEFAULTS.securityProtocol,
    qualityGuidelines: DEFAULTS.qualityGuidelines,
    systemStatusMessage: DEFAULTS.systemStatusMessage
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'security' | 'guidelines' | 'status'>('privacy');

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setForm({
          privacyPolicy: data.privacyPolicy || DEFAULTS.privacyPolicy,
          termsOfUse: data.termsOfUse || DEFAULTS.termsOfUse,
          securityProtocol: data.securityProtocol || DEFAULTS.securityProtocol,
          qualityGuidelines: data.qualityGuidelines || DEFAULTS.qualityGuidelines,
          systemStatusMessage: data.systemStatusMessage || DEFAULTS.systemStatusMessage
        });
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
      await logActivity('legal_content_updated', { section: activeTab });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Legal content update failed:", error);
    }
    setLoading(false);
  };

  const tabs = [
    { id: 'privacy', label: 'Privacy Policy', icon: Eye, color: 'text-teal-400' },
    { id: 'terms', label: 'Terms of Use', icon: FileText, color: 'text-purple-400' },
    { id: 'security', label: 'Security Protocol', icon: Lock, color: 'text-green-400' },
    { id: 'guidelines', label: 'Quality Guidelines', icon: Star, color: 'text-cyan-400' },
    { id: 'status', label: 'System Status', icon: Activity, color: 'text-yellow-400' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" /> Legal & Quality Management
        </h3>
        {saved && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-green-500 text-xs font-bold uppercase tracking-widest"
          >
            <CheckCircle2 className="w-4 h-4" /> Policy Saved
          </motion.div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white text-black shadow-lg' 
                : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-black' : tab.color}`} />
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
              <Globe className="w-3 h-3" /> Editor (Markdown)
            </label>
            <textarea
              value={
                activeTab === 'privacy' ? form.privacyPolicy :
                activeTab === 'terms' ? form.termsOfUse :
                activeTab === 'security' ? form.securityProtocol :
                activeTab === 'guidelines' ? form.qualityGuidelines :
                form.systemStatusMessage
              }
              onChange={e => {
                const val = e.target.value;
                setForm(prev => ({
                  ...prev,
                  privacyPolicy: activeTab === 'privacy' ? val : prev.privacyPolicy,
                  termsOfUse: activeTab === 'terms' ? val : prev.termsOfUse,
                  securityProtocol: activeTab === 'security' ? val : prev.securityProtocol,
                  qualityGuidelines: activeTab === 'guidelines' ? val : prev.qualityGuidelines,
                  systemStatusMessage: activeTab === 'status' ? val : prev.systemStatusMessage,
                }));
              }}
              className="w-full h-[500px] bg-black/40 border border-white/10 rounded-2xl px-6 py-4 focus:border-blue-500 outline-none transition-all text-sm font-mono resize-none leading-relaxed"
              placeholder={`Enter content for ${activeTab.replace(/([A-Z])/g, ' $1').toLowerCase()}...`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save {tabs.find(t => t.id === activeTab)?.label}
          </button>
        </div>

        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 overflow-y-auto max-h-[620px]">
          <div className="flex items-center gap-2 mb-8 text-white/40">
            <Eye className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Global Preview</span>
          </div>
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown>
              {
                (activeTab === 'privacy' ? form.privacyPolicy :
                activeTab === 'terms' ? form.termsOfUse :
                activeTab === 'security' ? form.securityProtocol :
                activeTab === 'guidelines' ? form.qualityGuidelines :
                form.systemStatusMessage) || '*No content defined yet for this section.*'
              }
            </ReactMarkdown>
          </div>
        </div>
      </form>
    </div>
  );
}
