import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  User,
  CreditCard,
  Lock,
  Settings,
  Trash2,
  CheckCircle,
  Zap,
  Star,
  Shield,
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { isPaidUser, isEnterpriseUser } from '../types/auth';

type Tab = 'profile' | 'subscription' | 'payment' | 'security' | 'account';

const AccountPage: React.FC = () => {
  const { theme } = useTheme();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Profile state
  const [profileName, setProfileName] = useState(user?.full_name || user?.name || '');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Subscription
  const [subscription, setSubscription] = useState<any>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [pricingCycle, setPricingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Password change
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwShowCurrent, setPwShowCurrent] = useState(false);
  const [pwShowNew, setPwShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isPro = isPaidUser(user);
  const isEnterprise = isEnterpriseUser(user);
  const isOAuth = user?.auth_provider === 'google' || user?.auth_provider === 'apple';

  const tierLabel = isEnterprise ? 'Enterprise' : isPro ? 'Pro' : 'Free';

  const openPortal = async () => {
    if (!token) return;
    setPortalLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/stripe/portal`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to open portal');
      window.location.href = data.url;
    } catch (err: any) {
      alert(err.message || 'Something went wrong.');
    } finally {
      setPortalLoading(false);
    }
  };

  const startCheckout = async (priceEnvKey: string) => {
    if (!token) { navigate('/signup'); return; }
    const priceId = process.env[priceEnvKey] || '';
    if (!priceId) { alert('Plan not configured yet. Contact support.'); return; }
    setCheckoutLoading(priceEnvKey);
    try {
      const res = await fetch(`${BACKEND_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ price_id: priceId, billing_cycle: pricingCycle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to start checkout');
      window.location.href = data.url;
    } catch (err: any) {
      alert(err.message || 'Something went wrong.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  useEffect(() => {
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'subscription' && !subscription) fetchSubscription();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfileName(data.full_name || data.name || user?.full_name || '');
        setProfilePhone(data.phone || '');
      }
    } catch {}
  };

  const fetchSubscription = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/user/subscription`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSubscription(await res.json());
    } catch {}
  };

  const saveProfile = async () => {
    if (!token) return;
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/user/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: profileName, phone: profilePhone }),
      });
      if (res.ok) {
        setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
      } else {
        const d = await res.json().catch(() => ({}));
        setProfileMsg({ type: 'error', text: d.error || d.detail || 'Failed to save.' });
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async () => {
    if (pwNew !== pwConfirm) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (pwNew.length < 8) {
      setPwMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (!token) return;
    setPwSaving(true);
    setPwMsg(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/user/password`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: pwCurrent, new_password: pwNew }),
      });
      if (res.ok) {
        setPwMsg({ type: 'success', text: 'Password updated successfully.' });
        setPwCurrent('');
        setPwNew('');
        setPwConfirm('');
      } else {
        const d = await res.json().catch(() => ({}));
        setPwMsg({ type: 'error', text: d.error || d.detail || 'Failed to update password.' });
      }
    } catch {
      setPwMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setPwSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!token) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/user/account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        logout();
        navigate('/');
      }
    } catch {}
    finally {
      setDeleteLoading(false);
    }
  };

  const initials = (user?.full_name || user?.name || user?.email || '?')
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile',      label: 'Profile',      icon: <User className="w-4 h-4" /> },
    { id: 'subscription', label: 'Subscription', icon: <Star className="w-4 h-4" /> },
    { id: 'payment',      label: 'Payment',      icon: <CreditCard className="w-4 h-4" /> },
    { id: 'security',     label: 'Security',     icon: <Lock className="w-4 h-4" /> },
    { id: 'account',      label: 'Account',      icon: <Settings className="w-4 h-4" /> },
  ];

  const card = `rounded-xl border p-6 ${isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200'}`;
  const inp = `w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${
    isDark
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-primary-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary-500'
  }`;
  const lbl = `block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

  const planRows: [string, boolean | string, boolean | string][] = [
    ['Fuel Surcharge Calculator', true,         true],
    ['IFTA Tax Calculator',       true,         true],
    ['BOL Generator',             '10 / month', 'Unlimited'],
    ['Invoice Generator',         false,         true],
    ['PDF to Word',               false,         true],
    ['Word to PDF',               false,         true],
    ['e-Signature',               false,         true],
    ['History',                   false,         'Unlimited'],
    ['PDF Downloads',             false,         true],
    ['Priority Support',          false,         true],
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

      {/* Page header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className={`text-2xl font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {user?.full_name || user?.name || 'My Account'}
          </h1>
          <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
        </div>
        <span className={`ml-auto shrink-0 text-xs font-bold px-3 py-1 rounded-full ${
          isEnterprise
            ? 'bg-yellow-500/20 text-yellow-400'
            : isPro
            ? 'bg-primary-600/20 text-primary-400'
            : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
        }`}>
          {tierLabel}
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-6">

        {/* Tab sidebar */}
        <aside className="md:w-48 shrink-0">
          <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200'}`}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-colors border-b last:border-b-0 ${
                  isDark ? 'border-gray-700' : 'border-gray-100'
                } ${
                  activeTab === tab.id
                    ? isDark
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'bg-primary-50 text-primary-700'
                    : isDark
                    ? 'text-gray-300 hover:bg-dark-400'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* ── PROFILE ── */}
          {activeTab === 'profile' && (
            <div className={card}>
              <h2 className={`text-base font-bold mb-5 ${isDark ? 'text-white' : 'text-gray-900'}`}>Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className={lbl}>Full Name</label>
                  <input
                    className={inp}
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className={lbl}>Email Address</label>
                  <input
                    className={`${inp} opacity-60 cursor-not-allowed`}
                    value={user?.email || ''}
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed.</p>
                </div>
                <div>
                  <label className={lbl}>Phone</label>
                  <input
                    className={inp}
                    value={profilePhone}
                    onChange={e => setProfilePhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className={lbl}>Member Since</label>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
                {user?.auth_provider && (
                  <div>
                    <label className={lbl}>Sign-in Method</label>
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isDark ? 'bg-dark-400 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.auth_provider === 'google'
                        ? 'Google'
                        : user.auth_provider === 'apple'
                        ? 'Apple'
                        : 'Email / Password'}
                    </span>
                  </div>
                )}
                {profileMsg && (
                  <p className={`text-sm font-medium ${
                    profileMsg.type === 'success' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {profileMsg.text}
                  </p>
                )}
                <button
                  onClick={saveProfile}
                  disabled={profileSaving}
                  className="btn-primary flex items-center gap-2 text-sm disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {profileSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* ── SUBSCRIPTION ── */}
          {activeTab === 'subscription' && (
            <div className="space-y-4">

              {/* Current plan card */}
              <div className={card}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Current Plan</h2>
                    <div className={`text-3xl font-black ${
                      isEnterprise ? 'text-yellow-400' : isPro ? 'text-primary-400' : isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {tierLabel}
                    </div>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {isPro
                        ? `${(subscription?.billing_cycle ?? 'monthly') === 'annual' ? 'Annual billing' : 'Monthly billing'}${
                            subscription?.renewal_date
                              ? ` · Renews ${new Date(subscription.renewal_date).toLocaleDateString()}`
                              : ''
                          }`
                        : 'Upgrade to unlock all tools and features.'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {isPro && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-500/20 text-green-400">
                        Active
                      </span>
                    )}
                    {isPro && (
                      <button
                        onClick={openPortal}
                        disabled={portalLoading}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60 ${
                          isDark
                            ? 'border-gray-600 text-gray-300 hover:border-primary-500 hover:text-primary-400'
                            : 'border-gray-300 text-gray-600 hover:border-primary-500 hover:text-primary-600'
                        }`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {portalLoading ? 'Opening…' : 'Manage Subscription'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Plan comparison table */}
              <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className={`grid grid-cols-4 border-b ${isDark ? 'bg-dark-400 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className={`py-3 px-4 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Feature</div>
                  {['Free', 'Pro', 'Enterprise'].map((h, i) => (
                    <div key={h} className={`py-3 text-center text-xs font-bold uppercase tracking-wider border-l ${
                      isDark ? 'border-gray-700' : 'border-gray-200'
                    } ${i === 1 ? (isDark ? 'text-primary-400' : 'text-primary-600') : i === 2 ? 'text-yellow-500' : isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {h}
                    </div>
                  ))}
                </div>
                {planRows.map(([feature, free, pro], i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-4 border-b last:border-b-0 ${isDark ? 'border-gray-700' : 'border-gray-200'} ${
                      i % 2 === 0 ? isDark ? 'bg-dark-300' : 'bg-white' : isDark ? 'bg-dark-400' : 'bg-gray-50'
                    }`}
                  >
                    <div className={`py-3 px-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{feature}</div>
                    {/* Free col */}
                    <div className={`py-3 text-sm text-center border-l flex items-center justify-center ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      {typeof free === 'boolean'
                        ? free ? <CheckCircle className="w-4 h-4 text-green-500" /> : <span className="text-gray-400">—</span>
                        : <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{free}</span>}
                    </div>
                    {/* Pro col */}
                    <div className={`py-3 text-sm text-center border-l flex items-center justify-center ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      {typeof pro === 'boolean'
                        ? pro ? <CheckCircle className="w-4 h-4 text-primary-500" /> : <span className="text-gray-400">—</span>
                        : <span className="text-xs font-medium text-primary-500">{pro}</span>}
                    </div>
                    {/* Enterprise col — same as Pro + Priority Support */}
                    <div className={`py-3 text-sm text-center border-l flex items-center justify-center ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <CheckCircle className="w-4 h-4 text-yellow-500" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Upgrade CTAs for free users */}
              {!isPro && (
                <div className="space-y-3">
                  {/* Billing toggle */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Billing:</span>
                    <div className={`inline-flex rounded-lg p-0.5 border ${isDark ? 'bg-dark-400 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                      {(['monthly', 'annual'] as const).map(c => (
                        <button
                          key={c}
                          onClick={() => setPricingCycle(c)}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                            pricingCycle === c ? 'bg-primary-600 text-white' : isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          {c === 'monthly' ? 'Monthly' : 'Annual (–20%)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className={`rounded-xl border p-4 ${isDark ? 'bg-primary-900/20 border-primary-700/50' : 'bg-primary-50 border-primary-200'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-primary-500" />
                        <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Pro — {pricingCycle === 'annual' ? '$23/mo' : '$29/mo'}
                        </p>
                      </div>
                      <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        All tools, unlimited BOL, history &amp; PDF downloads.
                      </p>
                      <button
                        className="btn-primary text-xs w-full disabled:opacity-60"
                        disabled={checkoutLoading !== null}
                        onClick={() => startCheckout(
                          pricingCycle === 'annual'
                            ? 'REACT_APP_STRIPE_PRO_ANNUAL_PRICE_ID'
                            : 'REACT_APP_STRIPE_PRO_MONTHLY_PRICE_ID'
                        )}
                      >
                        {checkoutLoading?.includes('PRO') ? 'Loading…' : 'Upgrade to Pro →'}
                      </button>
                    </div>
                    <div className={`rounded-xl border p-4 ${isDark ? 'bg-yellow-900/10 border-yellow-700/30' : 'bg-yellow-50 border-yellow-200'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Enterprise — {pricingCycle === 'annual' ? '$79/mo' : '$99/mo'}
                        </p>
                      </div>
                      <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        All Pro features + priority support.
                      </p>
                      <button
                        className="w-full text-xs px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-bold transition-colors disabled:opacity-60"
                        disabled={checkoutLoading !== null}
                        onClick={() => startCheckout(
                          pricingCycle === 'annual'
                            ? 'REACT_APP_STRIPE_ENTERPRISE_ANNUAL_PRICE_ID'
                            : 'REACT_APP_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID'
                        )}
                      >
                        {checkoutLoading?.includes('ENTERPRISE') ? 'Loading…' : 'Upgrade to Enterprise →'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PAYMENT ── */}
          {activeTab === 'payment' && (
            <div className={card}>
              <h2 className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment & Billing</h2>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Manage your payment methods, invoices, and billing details via the Stripe Customer Portal.
              </p>

              {isPro ? (
                <div className="space-y-4">
                  <div className={`flex items-start gap-3 p-4 rounded-lg border ${
                    isDark ? 'bg-dark-400 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <Shield className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? 'text-primary-400' : 'text-primary-600'}`} />
                    <div>
                      <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        Managed securely via Stripe
                      </p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Update your card, download invoices, and change your plan in the Stripe Customer Portal.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={openPortal}
                    disabled={portalLoading}
                    className="btn-primary flex items-center gap-2 text-sm disabled:opacity-60"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {portalLoading ? 'Opening…' : 'Open Billing Portal'}
                  </button>
                </div>
              ) : (
                <div className={`flex items-start gap-3 p-4 rounded-lg border ${
                  isDark ? 'bg-dark-400 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <CreditCard className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>No active subscription</p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Upgrade to Pro or Enterprise to manage payment methods here.
                    </p>
                    <button
                      className="mt-3 btn-primary text-xs"
                      onClick={() => setActiveTab('subscription')}
                    >
                      View Plans →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SECURITY ── */}
          {activeTab === 'security' && (
            <div className={card}>
              <h2 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Security</h2>

              {isOAuth ? (
                <div className={`flex items-start gap-3 p-4 rounded-lg border mt-4 ${
                  isDark ? 'bg-dark-400 border-gray-700' : 'bg-blue-50 border-blue-200'
                }`}>
                  <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Your account is secured through{' '}
                    <strong>{user?.auth_provider === 'google' ? 'Google' : 'Apple'}</strong> sign-in.
                    Password management is handled by your provider.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Change your account password below.
                  </p>
                  <div>
                    <label className={lbl}>Current Password</label>
                    <div className="relative">
                      <input
                        type={pwShowCurrent ? 'text' : 'password'}
                        className={`${inp} pr-10`}
                        value={pwCurrent}
                        onChange={e => setPwCurrent(e.target.value)}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setPwShowCurrent(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500"
                      >
                        {pwShowCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>New Password</label>
                    <div className="relative">
                      <input
                        type={pwShowNew ? 'text' : 'password'}
                        className={`${inp} pr-10`}
                        value={pwNew}
                        onChange={e => setPwNew(e.target.value)}
                        placeholder="Min. 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setPwShowNew(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500"
                      >
                        {pwShowNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>Confirm New Password</label>
                    <input
                      type="password"
                      className={inp}
                      value={pwConfirm}
                      onChange={e => setPwConfirm(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  {pwMsg && (
                    <p className={`text-sm font-medium ${pwMsg.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                      {pwMsg.text}
                    </p>
                  )}
                  <button
                    onClick={changePassword}
                    disabled={pwSaving || !pwCurrent || !pwNew || !pwConfirm}
                    className="btn-primary text-sm disabled:opacity-60"
                  >
                    {pwSaving ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── ACCOUNT ── */}
          {activeTab === 'account' && (
            <div className={`rounded-xl border p-6 ${
              isDark ? 'bg-dark-300 border-red-900/40' : 'bg-white border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Danger Zone</h2>
              </div>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <div className="space-y-3">
                <div>
                  <label className={lbl}>
                    Type <span className="font-black text-red-500">DELETE</span> to confirm
                  </label>
                  <input
                    className={inp}
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                  />
                </div>
                <button
                  onClick={deleteAccount}
                  disabled={deleteConfirm !== 'DELETE' || deleteLoading}
                  className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleteLoading ? 'Deleting…' : 'Delete My Account'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AccountPage;
