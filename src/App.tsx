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
import Pricing from './components/Pricing';
import MyWaitlist from './components/MyWaitlist';

import AuthInterface from './components/AuthInterface';
import Documentation from './components/Documentation';
import CookieConsent from './components/CookieConsent';
import ThemeManager from './components/ThemeManager';

import Global3DBackground from './components/Global3DBackground';

function MainContent() {
  const { user, profile, isAdmin, isEditor, loading, isEmailVerified } = useAuth();
  const [isLaunched, setIsLaunched] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
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

  const isPublicPath = ['#privacy', '#terms', '#security', '#status', '#docs', '#pricing', '#guidelines', '#about', '#reviews', '#contact'].includes(currentPath);

  const needsVerification = user && !isEmailVerified && user.providerData[0]?.providerId === 'password';

  const showLanding = !isPublicPath && (currentPath === '#home' || (!isLaunched && !user));

  return (
    <>
      <Global3DBackground 
        onSelectApp={showLanding ? setSelectedApp : undefined}
        selectedAppId={selectedApp?.id || null}
      />
      {showLanding ? (
        <LandingPage 
          onLaunch={() => {
            setIsLaunched(true);
            setCurrentPath('#');
            window.location.hash = '#';
          }} 
          selectedApp={selectedApp}
          setSelectedApp={setSelectedApp}
        />
      ) : (
        <Layout currentPath={currentPath} onNavigate={setCurrentPath}>
          {isPublicPath ? (
            currentPath === '#docs' ? <Documentation isEditor={isEditor} /> : 
            currentPath === '#pricing' ? <Pricing onStartListing={() => setCurrentPath('#')} /> :
            currentPath === '#about' ? <About /> :
            currentPath === '#reviews' ? <Reviews /> :
            currentPath === '#contact' ? <Contact /> :
            <Legal />
          ) : (!user || needsVerification) ? (
            <div className="py-20">
              <AuthInterface onComplete={() => setIsLaunched(true)} />
            </div>
          ) : currentPath === '#admin' && isEditor ? (
            <AdminDashboard />
          ) : currentPath === '#waitlist' && !isAdmin ? (
            <MyWaitlist />
          ) : (
            <div className="space-y-24 pb-24">
              <Catalog />
              <Reviews />
            </div>
          )}
        </Layout>
      )}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeManager />
        <MainContent />
        <CookieConsent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
