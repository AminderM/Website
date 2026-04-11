import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import SavedDocumentsSidebar from './components/SavedDocumentsSidebar';
import './index.css';

// Layout wrapper
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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
            </Routes>
          </AppLayout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
