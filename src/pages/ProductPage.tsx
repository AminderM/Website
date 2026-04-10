import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Truck,
  Users,
  Globe,
  FileText,
  BarChart3,
  DollarSign,
  Shield,
  Zap,
  Settings,
  Brain,
  Smartphone,
  Building2,
  TrendingUp,
  Bot,
  Calculator,
  Fuel,
  PenLine,
  FileType,
  Receipt,
  ChevronRight,
  X,
  Star,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { isPaidUser, isEnterpriseUser } from '../types/auth';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const ProductPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'carriers' | 'brokers' | 'dispatchers'>('carriers');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const handleUpgrade = async (plan: string) => {
    if (!token) {
      navigate('/signup');
      return;
    }
    setCheckoutLoading(plan);
    try {
      const res = await fetch(`${BACKEND_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan, billing_cycle: billingCycle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to start checkout');
      window.location.href = data.url;
    } catch (err: any) {
      alert(err.message || 'Something went wrong. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  // ── TMS audience tabs ──────────────────────────────────────────────────────
  const audienceTabs = {
    carriers: {
      title: 'For Carriers',
      description: 'Give your drivers the tools they need and your back office the visibility to run a lean, profitable operation.',
      features: [
        'Enhanced Driver App with real-time navigation',
        'Agentic AI workflows for load management',
        'Departmental Analytics per division',
        'Automated accounting and settlements',
        'AI Assistant for instant operational support',
        'Integrated CRM for shipper relationships',
      ],
    },
    brokers: {
      title: 'For Freight Brokers',
      description: 'Close more deals, build stronger carrier relationships, and manage every load with precision using AI-powered tools.',
      features: [
        'Rate Quote Builder with AI-driven pricing',
        'Rate Con Builder — generate and send in seconds',
        'Integrated CRM for shipper and carrier management',
        'Departmental Integrated Workspaces',
        'Departmental Analytics and margin reporting',
        'Agentic AI workflows to automate repetitive tasks',
      ],
    },
    dispatchers: {
      title: 'For Dispatchers',
      description: 'Manage multiple carriers, automate load assignments, and keep everything organized from a single unified workspace.',
      features: [
        'Departmental Integrated Workspaces',
        'AI Assistant for instant decisions and guidance',
        'Agentic AI workflows for dispatch automation',
        'Rate Con Builder and document automation',
        'Departmental Analytics and performance KPIs',
        'Automated Accounting and invoicing',
      ],
    },
  };

  // ── TMS feature cards ──────────────────────────────────────────────────────
  const tmsFeatures = [
    { icon: Brain,       title: 'Agentic AI Workflows',             description: 'Autonomous AI agents that handle load tendering, carrier selection, and follow-ups — without manual intervention.' },
    { icon: Smartphone,  title: 'Enhanced Driver App',              description: 'A purpose-built mobile app giving drivers real-time navigation, document capture, HOS tracking, and direct communication.' },
    { icon: FileText,    title: 'Rate Con Builder',                 description: 'Generate professional rate confirmations in seconds. Auto-populate carrier and load details, send and track acceptance.' },
    { icon: Building2,   title: 'Departmental Workspaces',         description: 'Separate, integrated workspaces for ops, accounting, sales, and dispatch — each team sees exactly what they need.' },
    { icon: BarChart3,   title: 'Departmental Analytics',          description: 'Drill-down analytics per department. Revenue, margin, volume, and performance metrics all in one dashboard.' },
    { icon: Bot,         title: 'AI Assistant',                    description: 'An always-on AI assistant that answers operational questions, surfaces insights, and helps your team move faster.' },
    { icon: DollarSign,  title: 'Rate Quote Builder',              description: 'Build accurate, competitive rate quotes instantly using live market data, lane history, and AI-powered recommendations.' },
    { icon: Users,       title: 'Integrated CRM',                  description: 'Manage shipper and carrier relationships in one place. Track interactions, deals, and history without leaving the TMS.' },
    { icon: Settings,    title: 'Automated Accounting',            description: 'From invoice generation to carrier payments and reconciliation — accounting runs automatically in the background.' },
  ];

  // ── Web Tools list ─────────────────────────────────────────────────────────
  const webTools = [
    {
      icon: FileText,
      name: 'BOL Generator',
      description: 'Create professional Bills of Lading with live preview. Fill manually or import from a document.',
      badge: 'Free',
      badgeColor: 'bg-white/10 text-zinc-300',
      path: '/bol-generator',
    },
    {
      icon: Receipt,
      name: 'Invoice Generator',
      description: 'Build freight invoices with line items, categories, logo, and tax. Generate and download as PDF instantly.',
      badge: 'Free',
      badgeColor: 'bg-white/10 text-zinc-300',
      path: '/invoice-generator',
    },
    {
      icon: Fuel,
      name: 'Fuel Surcharge Calculator',
      description: 'Calculate fuel surcharges by percentage or CPM. Save results directly to your history.',
      badge: 'Free',
      badgeColor: 'bg-white/10 text-zinc-300',
      path: '/fuel-surcharge',
    },
    {
      icon: Calculator,
      name: 'IFTA Tax Calculator',
      description: 'Calculate IFTA taxes across multiple jurisdictions with mileage and fuel tracking per state/province.',
      badge: 'Free',
      badgeColor: 'bg-white/10 text-zinc-300',
      path: '/ifta-calculator',
    },
    {
      icon: FileType,
      name: 'PDF to Word',
      description: 'Convert any PDF document into an editable Word (.docx) file in seconds.',
      badge: 'Paid',
      badgeColor: 'bg-primary-600/20 text-primary-400',
      path: '/pdf-to-word',
    },
    {
      icon: FileText,
      name: 'Word to PDF',
      description: 'Convert Word documents (.docx / .doc) into a clean, shareable PDF file.',
      badge: 'Paid',
      badgeColor: 'bg-primary-600/20 text-primary-400',
      path: '/word-to-pdf',
    },
    {
      icon: PenLine,
      name: 'e-Signature',
      description: 'Draw or type your signature, place it anywhere on a PDF, and download the signed document — all in the browser.',
      badge: 'Paid',
      badgeColor: 'bg-primary-600/20 text-primary-400',
      path: '/e-signature',
    },
  ];

  return (
    <div className={`pt-20 ${isDark ? 'bg-dark' : 'bg-white'}`}>

      {/* ════════════════════════════════════════════════════════════════════
          PAGE HEADER
      ════════════════════════════════════════════════════════════════════ */}
      <section className="section">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${isDark ? 'bg-primary-600/20 border border-primary-600/30' : 'bg-primary-50 border border-primary-200'}`}>
              <Truck className="w-4 h-4 text-primary-500" />
              <span className={`text-sm font-medium ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>Two Products. One Vision.</span>
            </div>
            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Built for the{' '}
              <span className="text-gradient-primary">Transportation Industry</span>
            </h1>
            <p className={`text-lg mb-6 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              Whether you need an enterprise-grade TMS or a set of day-to-day operational tools, Integra has a product for you.
            </p>
            {/* Jump links */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a href="#tms" className="btn-primary inline-flex items-center gap-2">
                Integra AI TMS <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#tools" className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border transition-colors ${
                isDark
                  ? 'border-gray-700 text-gray-300 hover:border-primary-500 hover:text-white'
                  : 'border-gray-300 text-gray-700 hover:border-primary-500 hover:text-primary-600'
              }`}>
                Transportation Web Tools <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          PRODUCT 1 — INTEGRA AI TMS
      ════════════════════════════════════════════════════════════════════ */}
      <section id="tms" className={`section ${isDark ? 'bg-dark-50' : 'bg-gray-50'}`}>
        <div className="container-custom">

          {/* TMS Header */}
          <div className="max-w-3xl mb-16">
            <h2 className={`text-3xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Integra AI — TMS
            </h2>
            <p className={`text-xl font-medium mb-4 ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
              One Platform, Complete Control
            </p>
            <p className={`text-lg max-w-2xl ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              A next-generation Transportation Management System built for carriers, freight brokers, and dispatchers.
              Powered by agentic AI, Integra TMS replaces fragmented tools with a single, intelligent platform that works for every department.
            </p>
          </div>

          {/* TMS Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {tmsFeatures.map((feature, idx) => (
              <div key={idx} className={`rounded-2xl border p-6 transition-all group hover:border-primary-600/50 ${isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="w-11 h-11 rounded-xl bg-primary-600/20 flex items-center justify-center mb-4 group-hover:bg-primary-600/30 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary-500" />
                </div>
                <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Built For Your Role — Tabs */}
          <div className={`rounded-3xl border p-8 md:p-12 ${isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="text-center mb-10">
              <h3 className={`text-2xl md:text-3xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Built for Your Role</h3>
              <p className={`${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>Whether you're a carrier, broker, or dispatcher — Integra TMS is built around how you work.</p>
            </div>

            {/* Tab buttons */}
            <div className="flex justify-center mb-10">
              <div className={`inline-flex rounded-xl p-1 border ${isDark ? 'bg-dark-100 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
                {[
                  { id: 'carriers',    label: 'Carriers',    icon: Truck  },
                  { id: 'brokers',     label: 'Brokers',     icon: Users  },
                  { id: 'dispatchers', label: 'Dispatchers', icon: Globe  },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary-600 text-white'
                        : isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="grid lg:grid-cols-2 gap-10 items-start">
              <div>
                <h4 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{audienceTabs[activeTab].title}</h4>
                <p className={`mb-6 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>{audienceTabs[activeTab].description}</p>
                <ul className="space-y-3">
                  {audienceTabs[activeTab].features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-primary-500" />
                      </div>
                      <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Decorative mockup */}
              <div className={`rounded-2xl border p-6 ${isDark ? 'bg-dark-400 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`flex items-center gap-2 mb-4 pb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className={`text-xs ml-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Integra AI TMS</span>
                </div>
                <div className="space-y-3">
                  {audienceTabs[activeTab].features.slice(0, 4).map((f, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-dark-200' : 'bg-white'}`}>
                      <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-primary-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{f}</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* TMS CTA */}
          <div className={`mt-12 rounded-3xl border p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 ${isDark ? 'bg-primary-600/10 border-primary-600/30' : 'bg-primary-50 border-primary-200'}`}>
            <div>
              <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Ready to see Integra TMS in action?</h3>
              <p className={`${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>Book a live demo with our team and see how it fits your operation.</p>
            </div>
            <Link to="/contact" className="btn-primary inline-flex items-center gap-2 whitespace-nowrap flex-shrink-0">
              Request a Demo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          PRODUCT 2 — TRANSPORTATION WEB TOOLS
      ════════════════════════════════════════════════════════════════════ */}
      <section id="tools" className={`section ${isDark ? 'bg-dark' : 'bg-white'}`}>
        <div className="container-custom">

          {/* Tools Header */}
          <div className="max-w-3xl mb-16">
            <h2 className={`text-3xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Transportation Web Tools
            </h2>
            <p className={`text-xl font-medium mb-4 ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
              Unified Tool Box — Create, Store and Download
            </p>
            <p className={`text-lg max-w-2xl ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              A standalone suite of everyday operational tools built specifically for the trucking and logistics industry.
              No complex setup. Log in, use the tool, download your document.
              Some tools are free — additional tools are available on a paid plan.
            </p>
          </div>

          {/* Free / Paid legend */}
          <div className="flex items-center gap-6 mb-10 flex-wrap">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isDark ? 'bg-white/10 text-zinc-300' : 'bg-gray-200 text-gray-600'}`}>Free</span>
              <span className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Available on all accounts</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-600/20 text-primary-400">Paid</span>
              <span className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Available on paid plan</span>
            </div>
          </div>

          {/* Tools Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {webTools.map((tool, idx) => (
              <div key={idx} className={`rounded-2xl border p-6 flex flex-col transition-all group hover:border-primary-600/50 ${isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-primary-600/20 flex items-center justify-center group-hover:bg-primary-600/30 transition-colors">
                    <tool.icon className="w-5 h-5 text-primary-500" />
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${tool.badgeColor}`}>
                    {tool.badge}
                  </span>
                </div>
                <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{tool.name}</h3>
                <p className={`text-sm leading-relaxed flex-1 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>{tool.description}</p>
              </div>
            ))}

            {/* More coming soon card */}
            <div className={`rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${isDark ? 'bg-dark-400' : 'bg-gray-100'}`}>
                <Zap className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>More Tools Coming</p>
              <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>We add new tools regularly based on user feedback.</p>
            </div>
          </div>

          {/* Three value props */}
          <div className={`rounded-3xl border p-8 md:p-12 grid md:grid-cols-3 gap-8 ${isDark ? 'bg-dark-300 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            {[
              { icon: FileText,  title: 'Create',   desc: 'Fill forms manually or let our AI parse an uploaded document and pre-fill the fields for you.' },
              { icon: Shield,    title: 'Store',     desc: 'Your generated documents are saved to your history — accessible from any device at any time.' },
              { icon: TrendingUp, title: 'Download', desc: 'Download clean, print-ready PDFs from the tool or directly from your history panel — instantly.' },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <h4 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</h4>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tools CTA */}
          <div className={`mt-12 rounded-3xl border p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 ${isDark ? 'bg-primary-600/10 border-primary-600/30' : 'bg-teal-50 border-teal-200'}`}>
            <div>
              <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Start using the tools today</h3>
              <p className={`${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>Create a free account and access the BOL Generator, Invoice Generator, Fuel Surcharge Calculator, and IFTA Calculator — no credit card required.</p>
            </div>
            <Link to="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-colors whitespace-nowrap flex-shrink-0">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          PRICING TABLE
      ════════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className={`section ${isDark ? 'bg-dark-50' : 'bg-gray-50'}`}>
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 ${
              isDark ? 'bg-primary-600/10 text-primary-400 border border-primary-600/20' : 'bg-primary-50 text-primary-600 border border-primary-200'
            }`}>
              Pricing
            </div>
            <h2 className={`text-3xl md:text-4xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Simple, Transparent Pricing
            </h2>
            <p className={`mb-6 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              Start free. Upgrade when you need more.
            </p>
            {/* Billing toggle */}
            <div className={`inline-flex items-center rounded-xl p-1 border ${isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200'}`}>
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-primary-600 text-white'
                    : isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  billingCycle === 'annual'
                    ? 'bg-primary-600 text-white'
                    : isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Annual
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  billingCycle === 'annual' ? 'bg-white/20 text-white' : 'bg-green-500/20 text-green-500'
                }`}>
                  Save 20%
                </span>
              </button>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: 'Free',
                price: { monthly: '$0', annual: '$0' },
                subtext: 'No credit card required',
                badge: null,
                features: [
                  { label: 'Fuel Surcharge Calculator', included: true },
                  { label: 'IFTA Tax Calculator', included: true },
                  { label: 'BOL Generator', included: true, note: '10 / month' },
                  { label: 'Invoice Generator', included: false },
                  { label: 'PDF to Word', included: false },
                  { label: 'Word to PDF', included: false },
                  { label: 'e-Signature', included: false },
                  { label: 'History & PDF Downloads', included: false },
                  { label: 'Priority Support', included: false },
                ],
                cta: { label: 'Get Started Free', action: () => navigate('/signup'), priceEnvKey: null },
                highlight: false,
                isCurrentPlan: user?.tier === 'free' || !user?.tier,
              },
              {
                name: 'Pro',
                price: { monthly: '$29', annual: '$23' },
                subtext: billingCycle === 'annual' ? 'Billed $279/year' : 'Billed monthly',
                badge: 'Most Popular',
                features: [
                  { label: 'Fuel Surcharge Calculator', included: true },
                  { label: 'IFTA Tax Calculator', included: true },
                  { label: 'BOL Generator', included: true, note: 'Unlimited' },
                  { label: 'Invoice Generator', included: true },
                  { label: 'PDF to Word', included: true },
                  { label: 'Word to PDF', included: true },
                  { label: 'e-Signature', included: true },
                  { label: 'History & PDF Downloads', included: true },
                  { label: 'Priority Support', included: false },
                ],
                cta: { label: 'Upgrade to Pro', action: null, priceEnvKey: 'pro' },
                highlight: true,
                isCurrentPlan: isPaidUser(user) && !isEnterpriseUser(user),
              },
              {
                name: 'Enterprise',
                price: { monthly: '$99', annual: '$79' },
                subtext: billingCycle === 'annual' ? 'Billed $950/year' : 'Billed monthly',
                badge: null,
                features: [
                  { label: 'Fuel Surcharge Calculator', included: true },
                  { label: 'IFTA Tax Calculator', included: true },
                  { label: 'BOL Generator', included: true, note: 'Unlimited' },
                  { label: 'Invoice Generator', included: true },
                  { label: 'PDF to Word', included: true },
                  { label: 'Word to PDF', included: true },
                  { label: 'e-Signature', included: true },
                  { label: 'History & PDF Downloads', included: true },
                  { label: 'Priority Support', included: true },
                ],
                cta: { label: 'Upgrade to Enterprise', action: null, priceEnvKey: 'enterprise' },
                highlight: false,
                isCurrentPlan: isEnterpriseUser(user),
              },
            ].map((plan, idx) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true }}
                whileHover={{ y: plan.highlight ? -6 : -4, transition: { duration: 0.2 } }}
                className={`relative rounded-2xl border flex flex-col p-6 transition-all ${
                  plan.highlight
                    ? isDark
                      ? 'bg-primary-900/20 border-primary-600/60'
                      : 'bg-primary-50 border-primary-400'
                    : isDark
                    ? 'bg-dark-300 border-gray-700'
                    : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      <Star className="w-3 h-3" /> {plan.badge}
                    </span>
                  </div>
                )}
                <div className="mb-5">
                  <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                  <div className="flex items-end gap-1 mb-1">
                    <span className={`text-4xl font-black ${plan.highlight ? 'text-primary-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
                      {plan.price[billingCycle]}
                    </span>
                    {plan.name !== 'Free' && (
                      <span className={`text-sm mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>/mo</span>
                    )}
                  </div>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{plan.subtext}</p>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f.label} className="flex items-center gap-2.5">
                      {f.included ? (
                        <Check className="w-4 h-4 text-primary-500 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400 shrink-0" />
                      )}
                      <span className={`text-sm ${f.included ? isDark ? 'text-gray-300' : 'text-gray-700' : 'text-gray-400'}`}>
                        {f.label}
                        {f.note && (
                          <span className={`ml-1 text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            ({f.note})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.isCurrentPlan ? (
                  <div className={`w-full text-center py-2.5 rounded-xl text-sm font-semibold border ${
                    isDark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
                  }`}>
                    Current Plan
                  </div>
                ) : plan.cta.action ? (
                  <button
                    onClick={plan.cta.action}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
                      plan.highlight
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : isDark
                        ? 'bg-dark-400 hover:bg-dark-500 text-gray-300 border border-gray-600'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {plan.cta.label}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.cta.priceEnvKey!)}
                    disabled={checkoutLoading === plan.cta.priceEnvKey}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                      plan.highlight
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : isDark
                        ? 'bg-dark-400 hover:bg-dark-500 text-gray-300 border border-gray-600'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {checkoutLoading === plan.cta.priceEnvKey ? 'Loading…' : plan.cta.label}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          BOTTOM CTA
      ═════════════���══════════════════════════════════════════════════════ */}
      <section className={`section ${isDark ? 'bg-dark-50' : 'bg-gray-50'}`}>
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Not sure which product is right for you?
            </h2>
            <p className={`mb-8 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              Talk to our team — we'll help you find the right fit for your operation, whether you're a one-truck owner-operator or a 200-truck fleet.
            </p>
            <Link to="/contact" className="btn-primary inline-flex items-center gap-2">
              Talk to Us <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default ProductPage;
