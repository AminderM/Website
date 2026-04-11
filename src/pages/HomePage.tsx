import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  motion, useInView, useMotionValue, useSpring,
  type Variants,
} from 'framer-motion';
import {
  ArrowRight, Truck, Users, BarChart3, Shield, Zap, Globe,
  CheckCircle, MapPin, Clock, DollarSign, FileText, ChevronRight,
  TrendingUp, Brain, Bot, Layers,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import IALogo from '../components/IALogo';

/* ─────────────────────────────────────────────
   Shared animation variants
───────────────────────────────────────────── */
const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.6, ease: easeOut } },
};
const stagger = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.55, delay, ease: easeOut } },
});
const container: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } },
};

/* ─────────────────────────────────────────────
   Animated counter
───────────────────────────────────────────── */
const AnimatedCount: React.FC<{ target: string; suffix?: string }> = ({ target, suffix = '' }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const numericTarget = parseFloat(target.replace(/[^0-9.]/g, ''));
  const raw = useMotionValue(0);
  const spring = useSpring(raw, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (inView) raw.set(numericTarget);
  }, [inView, numericTarget, raw]);

  useEffect(() => {
    const unsub = spring.on('change', v => {
      const formatted = Number.isInteger(numericTarget)
        ? Math.round(v).toLocaleString()
        : v.toFixed(1);
      setDisplay(formatted);
    });
    return unsub;
  }, [spring, numericTarget]);

  const prefix = target.includes('+') || target.includes('M') ? '' : '';
  const displaySuffix = target.includes('M+') ? 'M+' : target.includes('+') ? '+' : suffix;

  return (
    <span ref={ref}>
      {prefix}{display}{displaySuffix}
    </span>
  );
};

/* ─────────────────────────────────────────────
   Bento card wrapper
───────────────────────────────────────────── */
const BentoCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  isDark: boolean;
  delay?: number;
}> = ({ children, className = '', isDark, delay = 0 }) => (
  <motion.div
    variants={stagger(delay)}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: '-40px' }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className={`relative rounded-2xl border overflow-hidden group spotlight-card hover-gradient-border transition-all duration-300 ${
      isDark
        ? 'bg-dark-50/80 border-white/[0.07] hover:border-primary-600/40 hover:bg-dark-50'
        : 'bg-white border-gray-200 hover:border-primary-400/50 shadow-sm hover:shadow-md'
    } ${className}`}
  >
    {children}
  </motion.div>
);

/* ─────────────────────────────────────────────
   Dashboard mockup (animated)
───────────────────────────────────────────── */
const DashboardMockup: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const loads = [
    { id: 'LD-2847', route: 'Chicago → Dallas',  status: 'In Transit', color: 'text-yellow-400', dot: 'bg-yellow-400' },
    { id: 'LD-2848', route: 'LA → Phoenix',       status: 'Loading',    color: 'text-blue-400',   dot: 'bg-blue-400'   },
    { id: 'LD-2849', route: 'Miami → Atlanta',    status: 'Delivered',  color: 'text-green-400',  dot: 'bg-green-400'  },
    { id: 'LD-2850', route: 'NYC → Chicago',      status: 'Pending',    color: 'text-zinc-400',   dot: 'bg-zinc-500'   },
  ];

  const loadsCount = loads.length;
  const [activeLoad, setActiveLoad] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActiveLoad(p => (p + 1) % loadsCount), 2000);
    return () => clearInterval(t);
  }, [loadsCount]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, rotateY: -8 }}
      whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true }}
      className="relative"
      style={{ perspective: 1200 }}
    >
      {/* Glow */}
      <div className="absolute -inset-4 bg-primary-600/10 rounded-3xl blur-2xl" />

      <div className={`relative rounded-2xl border overflow-hidden shadow-2xl ${
        isDark ? 'bg-dark-100 border-white/10' : 'bg-white border-gray-200'
      }`}>
        {/* Title bar */}
        <div className={`px-4 py-3 border-b flex items-center gap-2 ${isDark ? 'bg-dark-200 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className={`text-xs ml-2 font-medium ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Integra TMS — Live Dashboard</span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Live</span>
          </div>
        </div>

        <div className="p-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Active Loads', value: '47', delta: '+3' },
              { label: 'In Transit',   value: '23', delta: '+1' },
              { label: 'Delivered',    value: '18', delta: '+5' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                viewport={{ once: true }}
                className={`rounded-xl p-3 text-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
              >
                <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.value}</div>
                <div className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>{s.label}</div>
                <div className="text-[10px] text-green-500 font-medium">{s.delta} today</div>
              </motion.div>
            ))}
          </div>

          {/* Progress bar */}
          <div className={`mb-4 p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <div className="flex justify-between mb-1.5">
              <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>Fleet Utilization</span>
              <span className="text-xs font-bold text-primary-500">83%</span>
            </div>
            <div className={`h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400"
                initial={{ width: 0 }}
                whileInView={{ width: '83%' }}
                transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
                viewport={{ once: true }}
              />
            </div>
          </div>

          {/* Load list */}
          <div className="space-y-2">
            {loads.map((load, idx) => (
              <motion.div
                key={idx}
                animate={{
                  backgroundColor: activeLoad === idx
                    ? isDark ? 'rgba(220,38,38,0.08)' : 'rgba(220,38,38,0.04)'
                    : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                }}
                transition={{ duration: 0.3 }}
                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer border transition-colors ${
                  activeLoad === idx
                    ? isDark ? 'border-primary-600/30' : 'border-primary-300/50'
                    : isDark ? 'border-transparent' : 'border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${load.dot} ${activeLoad === idx ? 'animate-pulse' : ''}`} />
                  <div>
                    <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{load.id}</div>
                    <div className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>{load.route}</div>
                  </div>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-white/5' : 'bg-gray-100'
                } ${load.color}`}>{load.status}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────
   Main page
───────────────────────────────────────────── */
const HomePage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const logos = ['ACME Freight', 'FleetCo', 'TransAm', 'LoadMaster', 'Dispatch Pro', 'CargoLink', 'RoadRunner', 'FreightHub'];

  return (
    <div className={isDark ? 'bg-dark' : 'bg-white'}>

      {/* ═══════════════════════════════════════
          HERO
      ═══════════════════════════════════════ */}
      <section className={`relative min-h-screen flex items-center pt-20 overflow-hidden ${isDark ? '' : 'bg-gradient-to-b from-gray-50 to-white'}`}>

        {/* Background layers */}
        <div className={`absolute inset-0 bg-grid-pattern ${isDark ? 'opacity-40' : 'opacity-[0.03]'}`} />
        <div className="mesh-gradient absolute inset-0 pointer-events-none" />

        {/* Animated orbs */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[140px] pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary-800/15 rounded-full blur-[140px] pointer-events-none"
        />

        <div className="container-custom relative z-10 w-full">
          <div className="max-w-4xl mx-auto text-center">

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8 border ${
                isDark
                  ? 'bg-white/5 border-white/10 text-zinc-300'
                  : 'bg-white border-gray-200 text-gray-600 shadow-sm'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
              </span>
              <span className="text-sm font-medium">TMS v2.0 — AI-Powered Routing Now Live</span>
              <ChevronRight className="w-3.5 h-3.5 text-primary-500" />
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={`text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              Transform Your{' '}
              <span className="text-gradient-primary">Logistics</span>
              {' '}Operations with{' '}
              <span style={{
                background: 'linear-gradient(to bottom, #DC2626, #7f1d1d)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 900,
              }}>IA</span>.
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
              className={`text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}
            >
              AI-powered TMS that streamlines operations, cuts costs by 50%, and saves 80% of time — so you can deliver exceptional, personalized service.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.38 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
            >
              <Link
                to="/contact"
                className="btn-primary btn-glow inline-flex items-center justify-center gap-2 text-base group"
              >
                Request a Demo
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.span>
              </Link>
              <Link
                to="/product"
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-base border transition-all duration-300 hover:scale-[1.02] ${
                  isDark
                    ? 'bg-white/5 text-white border-white/15 hover:bg-white/10 hover:border-white/25'
                    : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                Explore Product
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 md:grid-cols-4 gap-6"
            >
              {[
                { value: '500', suffix: '+', label: 'Companies Trust Us' },
                { value: '1000000', suffix: 'M+', label: 'Loads Managed', display: '1M+' },
                { value: '99.9', suffix: '%', label: 'Uptime' },
                { value: '24', suffix: '/7', label: 'Support' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className={`stat-card text-center p-4 rounded-2xl border transition-all duration-300 cursor-default ${
                    isDark
                      ? 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]'
                      : 'bg-white border-gray-200 hover:border-primary-200 shadow-sm'
                  }`}
                >
                  <div className={`stat-value text-3xl md:text-4xl font-bold mb-1 transition-all duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {stat.display ? stat.display : (
                      <>{stat.value === '99.9' ? '99.9' : stat.value === '24' ? '24' : <AnimatedCount target={stat.value} />}{stat.suffix}</>
                    )}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className={`w-6 h-10 rounded-full border-2 flex items-start justify-center p-2 ${isDark ? 'border-zinc-600' : 'border-gray-400'}`}>
            <div className={`w-1 h-2 rounded-full ${isDark ? 'bg-zinc-400' : 'bg-gray-400'}`} />
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════
          LOGO MARQUEE
      ═══════════════════════════════════════ */}
      <div className={`py-8 border-y overflow-hidden ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>
        <div className="flex">
          {[...logos, ...logos].map((logo, i) => (
            <motion.div
              key={i}
              className={`shrink-0 mx-10 font-semibold text-sm tracking-widest uppercase ${
                isDark ? 'text-zinc-600 hover:text-zinc-400' : 'text-gray-400 hover:text-gray-600'
              } transition-colors cursor-default`}
              style={{ animation: `marquee ${logos.length * 2.5}s linear infinite` }}
            >
              {logo}
            </motion.div>
          ))}
        </div>
        <p className={`text-center text-xs mt-3 ${isDark ? 'text-zinc-700' : 'text-gray-300'}`}>
          TRUSTED BY LEADING LOGISTICS COMPANIES
        </p>
      </div>

      {/* ═══════════════════════════════════════
          WHO IT'S FOR
      ═══════════════════════════════════════ */}
      <section className={`section ${isDark ? 'bg-dark-50' : 'bg-gray-50'}`}>
        <div className="container-custom">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 ${
              isDark ? 'bg-primary-600/10 text-primary-400 border border-primary-600/20' : 'bg-primary-50 text-primary-600 border border-primary-200'
            }`}>
              Built for You
            </div>
            <h2 className={`text-3xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Built For Your Business
            </h2>
            <p className={`max-w-2xl mx-auto text-lg ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              Whether you're managing a fleet, brokering loads, or dispatching independently,
              Integra adapts to your workflow.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: 'Freight Brokers',
                description: 'Manage carriers, track shipments, and maximize margins with real-time visibility across your entire operation.',
                features: ['Carrier Management', 'AI Rate Negotiations', 'Live Load Matching'],
                gradient: 'from-blue-500/10 to-transparent',
              },
              {
                icon: Truck,
                title: 'Fleet Owners',
                description: 'Optimize routes, track assets, and keep your drivers productive with comprehensive fleet management tools.',
                features: ['GPS Asset Tracking', 'Route Optimization', 'Driver Performance'],
                gradient: 'from-primary-600/10 to-transparent',
              },
              {
                icon: Globe,
                title: 'Independent Dispatchers',
                description: 'Scale your dispatch business with powerful tools that help you manage multiple carriers efficiently.',
                features: ['Multi-Carrier Support', 'Automated Dispatch', 'Customer Portal'],
                gradient: 'from-green-500/10 to-transparent',
              },
            ].map((card, idx) => (
              <BentoCard key={idx} isDark={isDark} delay={idx * 0.12}>
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-60 pointer-events-none`} />
                <div className="relative z-10 p-7">
                  <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center mb-5 group-hover:bg-primary-600/30 transition-colors">
                    <card.icon className="w-6 h-6 text-primary-500" />
                  </div>
                  <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{card.title}</h3>
                  <p className={`mb-6 text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>{card.description}</p>
                  <ul className="space-y-2">
                    {card.features.map((f, i) => (
                      <li key={i} className={`flex items-center gap-2 text-sm ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                        <CheckCircle className="w-4 h-4 text-primary-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </BentoCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          BENTO FEATURES GRID
      ═══════════════════════════════════════ */}
      <section className={`section ${isDark ? '' : 'bg-white'}`}>
        <div className="container-custom">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 ${
              isDark ? 'bg-primary-600/10 text-primary-400 border border-primary-600/20' : 'bg-primary-50 text-primary-600 border border-primary-200'
            }`}>
              Platform Features
            </div>
            <h2 className={`text-3xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Everything You Need to{' '}
              <span className="text-gradient-primary">Scale</span>
            </h2>
            <p className={`max-w-2xl mx-auto text-lg ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              One platform that unifies your entire logistics operation — from load tendering to final delivery.
            </p>
          </motion.div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* Large card — dashboard */}
            <BentoCard isDark={isDark} className="lg:col-span-2 lg:row-span-2" delay={0}>
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center mb-3">
                      <BarChart3 className="w-5 h-5 text-primary-500" />
                    </div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Live Operations Dashboard</h3>
                    <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>Real-time visibility across your entire fleet</p>
                  </div>
                </div>
                <div className="flex-1">
                  <DashboardMockup isDark={isDark} />
                </div>
              </div>
            </BentoCard>

            {/* AI */}
            <BentoCard isDark={isDark} delay={0.1}>
              <div className="p-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Agentic AI Workflows</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                  Autonomous AI handles load tendering, carrier selection, and follow-ups — no manual work.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {['Auto-tender', 'AI routing', 'Smart dispatch'].map(t => (
                    <span key={t} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>{t}</span>
                  ))}
                </div>
              </div>
            </BentoCard>

            {/* Security */}
            <BentoCard isDark={isDark} delay={0.15}>
              <div className="p-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Enterprise Security</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                  Bank-grade encryption. SOC 2 compliant. Your data is locked down and auditable at every layer.
                </p>
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                  viewport={{ once: true }}
                  className="mt-4 h-1 rounded-full bg-gradient-to-r from-green-600 to-green-400"
                />
              </div>
            </BentoCard>

            {/* Analytics */}
            <BentoCard isDark={isDark} delay={0.08} className="md:col-span-2 lg:col-span-1">
              <div className="p-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Advanced Analytics</h3>
                <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                  Drill-down analytics per department. Revenue, margin, volume, and KPIs in one view.
                </p>
                {/* Mini bar chart */}
                <div className="flex items-end gap-1 h-12">
                  {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85].map((h, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-sm bg-gradient-to-t from-primary-700 to-primary-500"
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      transition={{ delay: 0.4 + i * 0.05, duration: 0.5, ease: 'easeOut' }}
                      viewport={{ once: true }}
                    />
                  ))}
                </div>
              </div>
            </BentoCard>

            {/* Integrations */}
            <BentoCard isDark={isDark} delay={0.18}>
              <div className="p-6">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4">
                  <Layers className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Seamless Integrations</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                  Connect your ELD, factoring company, load boards, and accounting tools in minutes.
                </p>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {['DAT', 'ELD', 'QB', 'API'].map(tag => (
                    <div key={tag} className={`text-center py-1.5 rounded-lg text-[10px] font-bold ${isDark ? 'bg-white/5 text-zinc-400' : 'bg-gray-100 text-gray-600'}`}>{tag}</div>
                  ))}
                </div>
              </div>
            </BentoCard>

            {/* AI Assistant */}
            <BentoCard isDark={isDark} delay={0.2}>
              <div className="p-6">
                <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center mb-4">
                  <Bot className="w-5 h-5 text-primary-500" />
                </div>
                <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Assistant</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                  Always-on assistant that answers operational questions, surfaces insights, and helps your team move faster.
                </p>
                <div className={`mt-4 p-3 rounded-xl text-xs italic ${isDark ? 'bg-white/5 text-zinc-400' : 'bg-gray-50 text-gray-500'}`}>
                  "What's our average margin on Chicago lanes this month?"
                </div>
              </div>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          BENEFITS — SPLIT
      ═══════════════════════════════════════ */}
      <section className={`section ${isDark ? 'bg-dark-50' : 'bg-gray-50'}`}>
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-20 items-center">

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6 ${
                isDark ? 'bg-primary-600/10 text-primary-400 border border-primary-600/20' : 'bg-primary-50 text-primary-600 border border-primary-200'
              }`}>
                Core Benefits
              </div>
              <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                One platform.<br />
                <span className="text-gradient-primary">Complete control.</span>
              </h2>
              <p className={`mb-10 text-lg leading-relaxed ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                Integra brings together every tool your team needs. From load tracking to accounting, everything works seamlessly together.
              </p>

              <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="space-y-5"
              >
                {[
                  { icon: MapPin,     title: 'Real-Time Tracking',    desc: 'Monitor every shipment with live GPS tracking and automated status updates.' },
                  { icon: Clock,      title: 'Automated Dispatch',    desc: 'Assign loads to the right carriers automatically based on your criteria.' },
                  { icon: DollarSign, title: 'Integrated Accounting', desc: 'Streamline invoicing, payments, and financial reporting in one place.' },
                  { icon: FileText,   title: 'Document Management',   desc: 'Store, organize, and access all your shipping documents instantly.' },
                ].map((b, i) => (
                  <motion.div
                    key={i}
                    variants={stagger(i * 0.05)}
                    className={`flex gap-4 p-4 rounded-2xl border transition-all duration-300 group cursor-default ${
                      isDark
                        ? 'border-white/[0.06] hover:border-primary-600/30 hover:bg-white/[0.02]'
                        : 'border-gray-100 hover:border-primary-200 hover:bg-primary-50/30'
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isDark ? 'bg-white/5 group-hover:bg-primary-600/20' : 'bg-gray-100 group-hover:bg-primary-100'
                    }`}>
                      <b.icon className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <h3 className={`font-semibold mb-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{b.title}</h3>
                      <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>{b.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: feature pills + glow visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-primary-600/5 rounded-3xl blur-3xl" />
              <div className={`relative rounded-3xl border p-8 ${isDark ? 'bg-dark-100 border-white/10' : 'bg-white border-gray-200 shadow-xl'}`}>
                <div className={`text-center mb-8 pb-6 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                  <div className={`text-5xl font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <AnimatedCount target="32" />%
                  </div>
                  <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Average cost reduction for our customers</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Fuel Cost Savings',     pct: 28, color: 'from-primary-700 to-primary-500' },
                    { label: 'Admin Time Saved',       pct: 65, color: 'from-blue-700 to-blue-400'     },
                    { label: 'On-Time Delivery Rate',  pct: 94, color: 'from-green-700 to-green-400'   },
                    { label: 'Driver Utilization',     pct: 83, color: 'from-orange-700 to-orange-400' },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>{item.label}</span>
                        <span className="text-xs font-bold text-primary-500">{item.pct}%</span>
                      </div>
                      <div className={`h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.pct}%` }}
                          transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                          viewport={{ once: true }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          WHY CHOOSE US — ICON GRID
      ═══════════════════════════════════════ */}
      <section className={`section ${isDark ? '' : 'bg-white'}`}>
        <div className="container-custom">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className={`text-3xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Why Choose Integra?
            </h2>
            <p className={`max-w-2xl mx-auto text-lg ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              Built from the ground up for the unique challenges of the logistics industry.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {[
              { icon: Zap,      title: 'Lightning Fast',      desc: 'Built for speed — handles millions of data points without breaking a sweat.',   color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
              { icon: Shield,   title: 'Enterprise Security', desc: 'Bank-grade encryption and industry compliance keep your data safe.',             color: 'text-green-400',  bg: 'bg-green-500/10'  },
              { icon: BarChart3,title: 'Advanced Analytics',  desc: 'Make data-driven decisions with comprehensive reporting and insights.',          color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
              { icon: Globe,    title: 'Scalable Platform',   desc: 'From 10 loads to 10,000 — our platform grows with your business.',               color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { icon: Users,    title: '24/7 Support',        desc: 'Our dedicated support team is always available to help you succeed.',            color: 'text-primary-400', bg: 'bg-primary-500/10' },
              { icon: Truck,    title: 'Industry Expertise',  desc: 'Built by logistics professionals who understand your daily challenges.',         color: 'text-orange-400', bg: 'bg-orange-500/10' },
            ].map((f, i) => (
              <motion.div
                key={i}
                variants={stagger(i * 0.08)}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className={`p-6 rounded-2xl border transition-all duration-300 group cursor-default spotlight-card ${
                  isDark
                    ? 'bg-white/[0.03] border-white/[0.07] hover:border-primary-600/40'
                    : 'bg-white border-gray-200 hover:border-primary-300 shadow-sm hover:shadow-md'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{f.title}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          CTA BANNER
      ═══════════════════════════════════════ */}
      <section className={`section ${isDark ? 'bg-dark-50' : 'bg-gray-50'}`}>
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className={`relative overflow-hidden rounded-3xl p-12 md:p-20 text-center noise-overlay beam-sweep ${
              isDark
                ? 'bg-gradient-to-br from-primary-950/80 via-dark-100 to-dark-50 border border-primary-600/25'
                : 'bg-gradient-to-br from-primary-600 to-primary-800 border border-primary-500'
            }`}
          >
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-primary-600/30 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6 bg-white/10 text-white border border-white/20"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Get Started Today
              </motion.div>

              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
                Ready to Transform Your Operations?
              </h2>
              <p className="max-w-xl mx-auto mb-10 text-white/70 text-lg">
                Join hundreds of logistics companies who have already streamlined their operations with Integra TMS.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-primary-700 font-bold text-base hover:bg-white/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-xl"
                >
                  Schedule a Demo
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/product"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white font-semibold text-base border border-white/25 hover:bg-white/20 transition-all duration-200 hover:scale-[1.02]"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;