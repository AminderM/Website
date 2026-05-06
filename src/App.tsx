import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import UseCasesPage from './pages/UseCasesPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyOTPPage from './pages/VerifyOTPPage';
import BOLGeneratorPage from './pages/BOLGeneratorPage';
import FuelSurchargePage from './pages/FuelSurchargePage';
import IFTACalculatorPage from './pages/IFTACalculatorPage';
import InvoiceGeneratorPage from './pages/InvoiceGeneratorPage';
import PdfToWordPage from './pages/PdfToWordPage';
import WordToPdfPage from './pages/WordToPdfPage';
import ESignaturePage from './pages/ESignaturePage';
import AccountPage from './pages/AccountPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import CheckoutCancelPage from './pages/CheckoutCancelPage';
import ToolsDashboardPage from './pages/ToolsDashboardPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import FreightCalculatorPage from './pages/FreightCalculatorPage';
import LetterheadPage from './pages/LetterheadPage';
import SavedDocumentsSidebar from './components/SavedDocumentsSidebar';
import ScrollToTop from './components/ScrollToTop';
import './index.css';

const ANALYTICS_BASE = 'https://api.staging.integratedtech.ca';

function useAnalyticsTracking() {
  const location = useLocation();

  // Session start → then pageview with fresh IDs (fires on every route change)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    fetch(`${ANALYTICS_BASE}/api/customer-analytics/track/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        landing_page: window.location.href,
        visitor_id: localStorage.getItem('_vid'),
        referrer: document.referrer || null,
        utm_source: params.get('utm_source'),
        utm_medium: params.get('utm_medium'),
        utm_campaign: params.get('utm_campaign'),
        user_agent: navigator.userAgent,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.session_id) localStorage.setItem('_sid', data.session_id);
        if (data.visitor_id) localStorage.setItem('_vid', data.visitor_id);
        fetch(`${ANALYTICS_BASE}/api/customer-analytics/track/pageview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page_url: window.location.href,
            page_title: document.title,
            referrer: document.referrer || null,
            session_id: data.session_id,
            visitor_id: data.visitor_id,
            utm_source: params.get('utm_source'),
            utm_medium: params.get('utm_medium'),
            utm_campaign: params.get('utm_campaign'),
          }),
        }).catch(() => {});
      })
      .catch(() => {});
  }, [location.pathname, location.search]);

  // Click tracking — single global listener, mounted once for lifetime of app
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      fetch(`${ANALYTICS_BASE}/api/customer-analytics/track/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_url: window.location.href,
          x_position: e.clientX,
          y_position: e.clientY,
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight,
          element_id: target.id || null,
          element_tag: target.tagName?.toLowerCase() || null,
          element_text: target.innerText?.slice(0, 100) || null,
          session_id: localStorage.getItem('_sid'),
          visitor_id: localStorage.getItem('_vid'),
        }),
      }).catch(() => {});
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Scroll depth — re-arms on each route change, reports milestones + on navigate/tab-hide
  useEffect(() => {
    const pageUrl = window.location.href;
    const startTime = Date.now();
    let maxDepth = 0;
    const milestonesFired = new Set<number>();

    const getDepth = () => {
      const scrollable = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      return scrollable > 0 ? Math.round((window.scrollY / scrollable) * 100) : 0;
    };

    const report = (depth: number) => {
      fetch(`${ANALYTICS_BASE}/api/customer-analytics/track/scroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_url: pageUrl,
          scroll_depth_percent: depth,
          max_scroll_depth: depth,
          time_on_page: Math.round((Date.now() - startTime) / 1000),
          session_id: localStorage.getItem('_sid'),
          visitor_id: localStorage.getItem('_vid'),
        }),
      }).catch(() => {});
    };

    const handleScroll = () => {
      const depth = getDepth();
      if (depth > maxDepth) maxDepth = depth;
      for (const m of [25, 50, 75, 100]) {
        if (depth >= m && !milestonesFired.has(m)) {
          milestonesFired.add(m);
          report(m);
        }
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') report(maxDepth);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (maxDepth > 0) report(maxDepth);
    };
  }, [location.pathname]);
}

// Layout wrapper
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  useAnalyticsTracking();
  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-dark' : 'bg-white'}`}>
      <Navbar />
      <main className="flex-1 pt-20">
        {children}
      </main>
      <SavedDocumentsSidebar />
      <Footer />
    </div>
  );
};

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}>
    <ThemeProvider>
      <AuthProvider>
        <Router basename="">
          <ScrollToTop />
          <AppLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/product" element={<ProductPage />} />
              <Route path="/use-cases" element={<UseCasesPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/verify-otp" element={<VerifyOTPPage />} />
              <Route path="/bol-generator" element={<ProtectedRoute component={BOLGeneratorPage} />} />
              <Route path="/fuel-surcharge" element={<ProtectedRoute component={FuelSurchargePage} />} />
              <Route path="/ifta-calculator" element={<ProtectedRoute component={IFTACalculatorPage} />} />
              <Route path="/invoice-generator" element={<ProtectedRoute component={InvoiceGeneratorPage} />} />
              <Route path="/pdf-to-word" element={<ProtectedRoute component={PdfToWordPage} />} />
              <Route path="/word-to-pdf" element={<ProtectedRoute component={WordToPdfPage} />} />
              <Route path="/e-signature" element={<ProtectedRoute component={ESignaturePage} />} />
              <Route path="/account" element={<ProtectedRoute component={AccountPage} />} />
              <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
              <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
              <Route path="/tools" element={<ProtectedRoute component={ToolsDashboardPage} />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/freight-calculator" element={<ProtectedRoute component={FreightCalculatorPage} />} />
              <Route path="/letterhead" element={<ProtectedRoute component={LetterheadPage} />} />
            </Routes>
          </AppLayout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
