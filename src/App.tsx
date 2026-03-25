import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AppSidebar from './components/AppSidebar';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import UseCasesPage from './pages/UseCasesPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import BOLGeneratorPage from './pages/BOLGeneratorPage';
import FuelSurchargePage from './pages/FuelSurchargePage';
import IFTACalculatorPage from './pages/IFTACalculatorPage';
import './index.css';

// Layout wrapper to handle sidebar spacing
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen bg-dark dark:bg-dark light:bg-white flex flex-col transition-colors duration-300">
      <Navbar />
      <div className="flex flex-1">
        <AppSidebar />
        <main className={`flex-grow transition-all duration-300 ${isAuthenticated ? 'ml-72' : ''}`}>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

function App() {
  return (
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
              <Route path="/bol-generator" element={<ProtectedRoute component={BOLGeneratorPage} />} />
              <Route path="/fuel-surcharge" element={<ProtectedRoute component={FuelSurchargePage} />} />
              <Route path="/ifta-calculator" element={<ProtectedRoute component={IFTACalculatorPage} />} />
              {/* Redirect old tools route */}
              <Route path="/tools" element={<Navigate to="/fuel-surcharge" replace />} />
            </Routes>
          </AppLayout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
