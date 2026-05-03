import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, Fuel, Calculator, Receipt,
  FileType, FileDown, PenTool, Truck, LayoutTemplate, Lock, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { isPaidUser } from '../types/auth';

/* ── Variants ─────────────────────────────────────────────────── */
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] } },
};

/* ── Tool definitions ─────────────────────────────────────────── */
const tools = [
  {
    id: 'bol',
    name: 'BOL Generator',
    desc: 'Create professional Bills of Lading instantly',
    path: '/bol-generator',
    icon: FileText,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'group-hover:border-blue-500/40',
    glow: 'group-hover:shadow-[0_0_24px_rgba(59,130,246,0.15)]',
    pro: false,
    badge: '10/mo on Free',
  },
  {
    id: 'fuel',
    name: 'Fuel Surcharge',
    desc: 'Calculate fuel surcharges in seconds',
    path: '/fuel-surcharge',
    icon: Fuel,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'group-hover:border-orange-500/40',
    glow: 'group-hover:shadow-[0_0_24px_rgba(249,115,22,0.15)]',
    pro: false,
    badge: null,
  },
  {
    id: 'ifta',
    name: 'IFTA Calculator',
    desc: 'Multi-jurisdiction IFTA tax calculation',
    path: '/ifta-calculator',
    icon: Calculator,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'group-hover:border-green-500/40',
    glow: 'group-hover:shadow-[0_0_24px_rgba(34,197,94,0.15)]',
    pro: false,
    badge: null,
  },
  {
    id: 'invoice',
    name: 'Invoice Generator',
    desc: 'Professional freight invoices with PDF export',
    path: '/invoice-generator',
    icon: Receipt,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'group-hover:border-purple-500/40',
    glow: 'group-hover:shadow-[0_0_24px_rgba(168,85,247,0.15)]',
    pro: true,
    badge: null,
  },
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    desc: 'Convert PDF documents to editable Word files',
    path: '/pdf-to-word',
    icon: FileType,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'group-hover:border-red-500/40',
    glow: 'group-hover:shadow-[0_0_24px_rgba(239,68,68,0.15)]',
    pro: true,
    badge: null,
  },
  {
    id: 'word-to-pdf',
    name: 'Word to PDF',
    desc: 'Convert Word documents to PDF format',
    path: '/word-to-pdf',
    icon: FileDown,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'group-hover:border-pink-500/40',
    glow: 'group-hover:shadow-[0_0_24px_rgba(236,72,153,0.15)]',
    pro: true,
    badge: null,
  },
  {
    id: 'esign',
    name: 'e-Signature',
    desc: 'Sign and annotate PDF documents digitally',
    path: '/e-signature',
    icon: PenTool,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'group-hover:border-cyan-500/40',
    glow: 'group-hover:shadow-[0_0_24px_rgba(34,211,238,0.15)]',
    pro: true,
    badge: null,
  },
  {
    id: 'freight-calculator',
    name: 'Freight Calculator',
    desc: 'Estimate freight costs across the USA and Canada',
    path: '/freight-calculator',
    icon: Truck,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'group-hover:border-indigo-500/40',
    glow: 'group-hover:shadow-[0_0_24px_rgba(99,102,241,0.15)]',
    pro: false,
    badge: null,
  },
  {
    id: 'letterhead',
    name: 'Letterhead',
    desc: 'Design and download your company letterhead',
    path: '/letterhead',
    icon: LayoutTemplate,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'group-hover:border-cyan-500/40',
    glow: 'group-hover:shadow-[0_0_24px_rgba(34,211,238,0.15)]',
    pro: false,
    badge: null,
  },
];

/* ── Component ────────────────────────────────────────────────── */
const ToolsDashboardPage: React.FC = () => {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const paid = isPaidUser(user);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

  const [profileName, setProfileName] = useState('');
  useEffect(() => {
    if (!token) return;
    fetch(`${BACKEND_URL}/api/user/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.full_name) setProfileName(d.full_name); })
      .catch(() => {});
  }, [token, BACKEND_URL]);

  const displayName = profileName || user?.full_name || user?.name || '';
  const firstName = displayName.split(' ').find((p: string) => p.length > 0) || user?.email?.split('@')[0] || 'there';

  const handleToolClick = (tool: typeof tools[0]) => {
    if (tool.pro && !paid) {
      navigate('/product#pricing');
      return;
    }
    navigate(tool.path);
  };

  return (
    <div className={`min-h-screen relative ${isDark ? 'bg-dark' : 'bg-gray-50'}`}>

      {/* Background */}
      <div className={`absolute inset-0 bg-grid-pattern pointer-events-none ${isDark ? 'opacity-25' : 'opacity-[0.03]'}`} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary-600/8 rounded-full blur-[140px] pointer-events-none" />

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-40 h-40 border-l border-t border-primary-600/10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-40 h-40 border-r border-t border-primary-600/10 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 md:px-8 py-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] mb-2 ${isDark ? 'text-primary-500' : 'text-primary-600'}`}>
            {/* INTEGRA TOOL BOX */}
          </p>
          <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Hey, <span className="text-gradient-primary">{firstName}</span>
          </h1>
          <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
            Your Supply Chain Tool Box
          </p>
        </motion.div>

        {/* Tier banner for free users */}
        {!paid && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className={`flex items-center justify-between gap-4 rounded-xl border px-5 py-3.5 mb-8 ${
              isDark
                ? 'bg-primary-600/5 border-primary-600/20'
                : 'bg-primary-50 border-primary-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              <p className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                You're on the <strong>Free</strong> plan — upgrade to unlock all 7 tools
              </p>
            </div>
            <button
              onClick={() => navigate('/product')}
              className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                isDark
                  ? 'bg-primary-600/20 text-primary-400 hover:bg-primary-600/30 border border-primary-600/20'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              Upgrade to Pro
              <ArrowRight className="w-3 h-3" />
            </button>
          </motion.div>
        )}

        {/* Tools Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {tools.map((tool) => {
            const locked = tool.pro && !paid;
            const Icon = tool.icon;

            return (
              <motion.div
                key={tool.id}
                variants={cardVariants}
                whileHover={locked ? {} : { y: -5 }}
                onClick={() => handleToolClick(tool)}
                className={`group relative rounded-2xl border p-5 cursor-pointer transition-all duration-300 ${tool.glow} ${tool.border} ${
                  isDark
                    ? `bg-dark-100/60 border-white/[0.06] backdrop-blur-sm ${locked ? 'opacity-60' : 'hover:bg-dark-100/90'}`
                    : `bg-white border-gray-200 ${locked ? 'opacity-70' : 'hover:border-gray-300 hover:shadow-md'}`
                }`}
              >
                {/* Lock overlay */}
                {locked && (
                  <div className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
                    isDark ? 'bg-dark-400 border-white/10 text-zinc-400' : 'bg-gray-100 border-gray-300 text-gray-600'
                  }`}>
                    <Lock className="w-2.5 h-2.5" />
                    Pro
                  </div>
                )}

                {/* Free badge */}
                {tool.badge && !locked && (
                  <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                    isDark ? 'bg-white/5 text-zinc-500 border-white/10' : 'bg-gray-100 text-gray-600 border-gray-300'
                  }`}>
                    {tool.badge}
                  </div>
                )}

                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl ${tool.bg} flex items-center justify-center mb-4 transition-transform duration-300 ${locked ? '' : 'group-hover:scale-110'}`}>
                  <Icon className={`w-8 h-8 ${tool.color}`} strokeWidth={1.5} />
                </div>

                {/* Text */}
                <p className={`font-semibold text-sm mb-1 leading-snug ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {tool.name}
                </p>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-500' : 'text-gray-600'}`}>
                  {tool.desc}
                </p>

                {/* Arrow on hover */}
                {!locked && (
                  <div className={`absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${tool.color}`}>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Locked CTA */}
                {locked && (
                  <p className={`text-xs mt-2 font-medium ${isDark ? 'text-primary-600' : 'text-primary-500'}`}>
                    Upgrade to unlock →
                  </p>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Divider */}
        <div className={`mt-12 pt-8 border-t ${isDark ? 'border-white/[0.05]' : 'border-gray-100'}`}>
          <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>
            Quick links
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            {[
              { label: 'My Account', path: '/account' },
              { label: 'Pricing & Plans', path: '/product' },
              { label: 'Use Cases', path: '/use-cases' },
              { label: 'Contact Support', path: '/contact' },
            ].map(link => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  isDark
                    ? 'border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolsDashboardPage;
