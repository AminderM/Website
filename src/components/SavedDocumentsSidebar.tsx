import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FileText, Fuel, Calculator, Receipt, FileType, FileDown,
  PenTool, Truck, LayoutTemplate, Clock, Download, ChevronRight, ChevronLeft, RefreshCw,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const TOOL_ROUTES = [
  '/bol-generator', '/fuel-surcharge', '/ifta-calculator',
  '/invoice-generator', '/pdf-to-word', '/word-to-pdf', '/e-signature',
  '/freight-calculator', '/letterhead',
];

const typeConfig: Record<string, { label: string; Icon: React.ElementType; color: string; bg: string }> = {
  'bol':            { label: 'Bill of Lading',  Icon: FileText,  color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  'fuel-surcharge': { label: 'Fuel Surcharge',  Icon: Fuel,      color: 'text-orange-400', bg: 'bg-orange-500/10' },
  'ifta':           { label: 'IFTA Calc',       Icon: Calculator,color: 'text-green-400',  bg: 'bg-green-500/10' },
  'invoice':        { label: 'Invoice',         Icon: Receipt,   color: 'text-purple-400', bg: 'bg-purple-500/10' },
  'pdf-to-word':    { label: 'PDF → Word',      Icon: FileType,  color: 'text-red-400',    bg: 'bg-red-500/10' },
  'word-to-pdf':    { label: 'Word → PDF',      Icon: FileDown,  color: 'text-pink-400',   bg: 'bg-pink-500/10' },
  'e-signature':      { label: 'e-Signature',       Icon: PenTool, color: 'text-cyan-400',   bg: 'bg-cyan-500/10'   },
  'freight-quote':    { label: 'Freight Quote',     Icon: Truck,          color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  'letterhead':       { label: 'Letterhead',        Icon: LayoutTemplate, color: 'text-cyan-400',   bg: 'bg-cyan-500/10'   },
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const SavedDocumentsSidebar: React.FC = () => {
  const { theme } = useTheme();
  const { token } = useAuth();
  const location = useLocation();
  const isDark = theme === 'dark';

  const [open, setOpen] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const isToolPage = TOOL_ROUTES.some(r => location.pathname.startsWith(r));

  const fetchHistory = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${BACKEND_URL}/api/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (isToolPage) fetchHistory();
  }, [isToolPage, fetchHistory]);

  if (!isToolPage || !token) return null;

  const borderClass = isDark ? 'border-white/[0.07]' : 'border-gray-200';
  const bgClass     = isDark ? 'bg-dark-200'          : 'bg-white';

  return (
    <div className="hidden md:flex fixed right-0 top-20 h-[calc(100vh-5rem)] z-40 items-stretch print:hidden">

      {/* Toggle tab */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`self-center -ml-px flex flex-col items-center justify-center gap-1 w-6 h-20 rounded-l-lg border border-r-0 transition-colors ${bgClass} ${borderClass} ${
          isDark ? 'hover:bg-dark-300' : 'hover:bg-gray-50'
        }`}
        title={open ? 'Close saved docs' : 'Open saved docs'}
      >
        {open
          ? <ChevronRight className={`w-3 h-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          : <ChevronLeft  className={`w-3 h-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        }
      </button>

      {/* Panel */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className={`overflow-hidden h-full border-l flex flex-col ${bgClass} ${borderClass}`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${borderClass}`}>
              <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Saved Documents
              </p>
              <button
                onClick={fetchHistory}
                className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-24">
                  <div className="w-5 h-5 border-2 border-primary-600/30 border-t-primary-600 rounded-full animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 px-4 text-center">
                  <Clock className={`w-8 h-8 mb-2 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                  <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    No saved documents yet
                  </p>
                </div>
              ) : (
                <ul>
                  {items.map((item: any) => {
                    const cfg = typeConfig[item.type] || {
                      label: item.type, Icon: FileText,
                      color: 'text-gray-400', bg: 'bg-gray-500/10',
                    };
                    const Icon = cfg.Icon;
                    const date = new Date(item.created_at);
                    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                    return (
                      <li
                        key={item.id}
                        className={`flex items-center gap-3 px-4 py-3 border-b last:border-b-0 transition-colors ${borderClass} ${
                          isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Icon */}
                        <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} strokeWidth={1.5} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                            {item.title || cfg.label}
                          </p>
                          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            {dateStr} · {timeStr}
                          </p>
                        </div>

                        {/* Download */}
                        {item.download_url && (
                          <a
                            href={item.download_url}
                            target="_blank"
                            rel="noreferrer"
                            className={`shrink-0 p-1 rounded transition-colors ${
                              isDark ? 'text-gray-600 hover:text-gray-300 hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer count */}
            {items.length > 0 && (
              <div className={`px-4 py-2 border-t shrink-0 ${borderClass}`}>
                <p className={`text-[10px] ${isDark ? 'text-gray-700' : 'text-gray-400'}`}>
                  {items.length} document{items.length !== 1 ? 's' : ''} saved
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SavedDocumentsSidebar;
