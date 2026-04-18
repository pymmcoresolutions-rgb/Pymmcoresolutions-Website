import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import Catalog from './components/Catalog';
import AdminDashboard from './components/AdminDashboard';
import AIAdvisor from './components/AIAdvisor';
import About from './components/About';
import Contact from './components/Contact';
import Reviews from './components/Reviews';
import Legal from './components/Legal';
import ErrorBoundary from './components/ErrorBoundary';

import AuthInterface from './components/AuthInterface';
import Documentation from './components/Documentation';
import CookieConsent from './components/CookieConsent';

function MainContent() {
  const { user, profile, isAdmin, isEditor, loading, isEmailVerified } = useAuth();
  const [isLaunched, setIsLaunched] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#');

  useEffect(() => {
    const handleHashChange = () => setCurrentPath(window.location.hash || '#');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isLegalPath = ['#privacy', '#terms', '#security', '#status'].includes(currentPath);

  if (!isLegalPath && (currentPath === '#home' || (!isLaunched && !user))) {
    return <LandingPage onLaunch={() => {
      setIsLaunched(true);
      setCurrentPath('#');
      window.location.hash = '#';
    }} />;
  }

  // Block access if not verified (only for password provider)
  const needsVerification = user && !isEmailVerified && user.providerData[0]?.providerId === 'password';

  return (
    <Layout currentPath={currentPath} onNavigate={setCurrentPath}>
      {isLegalPath ? (
        <Legal />
      ) : (!user || needsVerification) ? (
        <div className="py-20">
          <AuthInterface onComplete={() => setIsLaunched(true)} />
        </div>
      ) : currentPath === '#admin' && isEditor ? (
        <AdminDashboard />
      ) : currentPath === '#advisor' ? (
        <div className="max-w-7xl mx-auto px-4 py-12">
          <AIAdvisor isFullPage />
        </div>
      ) : currentPath === '#docs' ? (
        <Documentation />
      ) : currentPath === '#about' ? (
        <About />
      ) : currentPath === '#contact' ? (
        <Contact />
      ) : currentPath === '#reviews' ? (
        <Reviews />
      ) : (
        <div className="space-y-24 pb-24">
          <Catalog />
          <Reviews />
        </div>
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainContent />
        <CookieConsent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
