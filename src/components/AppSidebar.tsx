import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Fuel, 
  Calculator, 
  History, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  DollarSign,
  Truck
} from 'lucide-react';

interface HistoryItem {
  type: 'fuel_surcharge' | 'ifta' | 'bol';
  data: any;
  created_at: string;
}

const AppSidebar: React.FC = () => {
  const { theme } = useTheme();
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = theme === 'dark';
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeSection, setActiveSection] = useState<'tools' | 'history'>('tools');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

  const menuItems = [
    { 
      id: 'bol-generator', 
      name: 'BOL Generator', 
      icon: FileText, 
      path: '/bol-generator',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/20'
    },
    { 
      id: 'fuel-surcharge', 
      name: 'Fuel Surcharge Calculator', 
      icon: Fuel, 
      path: '/fuel-surcharge',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/20'
    },
    { 
      id: 'ifta-calculator', 
      name: 'IFTA Tax Calculator', 
      icon: Calculator, 
      path: '/ifta-calculator',
      color: 'text-green-500',
      bgColor: 'bg-green-500/20'
    },
  ];

  const fetchHistory = async () => {
    if (!token) return;
    
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Fetch history when section changes to history
  useEffect(() => {
    if (activeSection === 'history' && token) {
      fetchHistory();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, token]);

  // Don't show sidebar if not authenticated - must be after all hooks
  if (!isAuthenticated) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getHistoryIcon = (type: string) => {
    switch (type) {
      case 'fuel_surcharge': return <Fuel className="w-4 h-4 text-orange-500" />;
      case 'ifta': return <Calculator className="w-4 h-4 text-green-500" />;
      case 'bol': return <FileText className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getHistoryTitle = (item: HistoryItem) => {
    switch (item.type) {
      case 'fuel_surcharge':
        return `Fuel: ${item.data.surcharge_percent?.toFixed(1)}% surcharge`;
      case 'ifta':
        return `IFTA: $${item.data.total_tax_due?.toFixed(2)} tax`;
      case 'bol':
        return `BOL: ${item.data.bol_number}`;
      default:
        return 'Unknown';
    }
  };

  const getHistorySubtitle = (item: HistoryItem) => {
    switch (item.type) {
      case 'fuel_surcharge':
        return `$${item.data.current_fuel_price}/gal → $${item.data.surcharge_amount?.toFixed(2)}`;
      case 'ifta':
        return `${item.data.total_miles?.toLocaleString()} mi, ${item.data.jurisdictions?.length || 0} states`;
      case 'bol':
        return `${item.data.shipper_name || 'Shipper'} → ${item.data.consignee_name || 'Consignee'}`;
      default:
        return '';
    }
  };

  return (
    <aside 
      className={`fixed left-0 top-20 h-[calc(100vh-5rem)] z-40 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-72'
      } ${isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200'} border-r`}
      data-testid="app-sidebar"
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute -right-3 top-6 z-50 p-1 rounded-full border shadow-md ${
          isDark ? 'bg-dark-300 border-gray-600 text-gray-400' : 'bg-white border-gray-200 text-gray-600'
        } hover:scale-110 transition-transform`}
        data-testid="sidebar-toggle"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className="flex flex-col h-full">
        {/* Section Tabs */}
        {!isCollapsed && (
          <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setActiveSection('tools')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeSection === 'tools'
                  ? isDark ? 'text-white border-b-2 border-primary-500' : 'text-gray-900 border-b-2 border-primary-600'
                  : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
              }`}
              data-testid="tools-tab"
            >
              <Truck className="w-4 h-4 inline mr-2" />
              Tools
            </button>
            <button
              onClick={() => setActiveSection('history')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeSection === 'history'
                  ? isDark ? 'text-white border-b-2 border-primary-500' : 'text-gray-900 border-b-2 border-primary-600'
                  : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
              }`}
              data-testid="history-tab"
            >
              <History className="w-4 h-4 inline mr-2" />
              History
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {activeSection === 'tools' || isCollapsed ? (
            /* Tools Menu */
            <div className="space-y-2">
              {!isCollapsed && (
                <p className={`text-xs font-semibold uppercase tracking-wider mb-3 px-2 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Fleet Tools
                </p>
              )}
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path.split('?')[0];
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                      isActive
                        ? isDark ? 'bg-primary-600/20 text-primary-400' : 'bg-primary-50 text-primary-700'
                        : isDark ? 'text-gray-300 hover:bg-dark-400' : 'text-gray-700 hover:bg-gray-100'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    data-testid={`sidebar-${item.id}`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className={`p-2 rounded-lg ${item.bgColor}`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    {!isCollapsed && (
                      <span className="font-medium text-sm">{item.name}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            /* History Section */
            <div>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"></div>
                </div>
              ) : history.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No history yet</p>
                  <p className="text-xs mt-1">Your calculations and BOLs will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg cursor-pointer transition ${
                        isDark ? 'bg-dark-400 hover:bg-dark-200' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      data-testid={`history-item-${idx}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          item.type === 'fuel_surcharge' ? 'bg-orange-500/20' :
                          item.type === 'ifta' ? 'bg-green-500/20' : 'bg-blue-500/20'
                        }`}>
                          {getHistoryIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {getHistoryTitle(item)}
                          </p>
                          <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {getHistorySubtitle(item)}
                          </p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {formatDate(item.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Refresh Button */}
              <button
                onClick={fetchHistory}
                className={`w-full mt-4 py-2 text-sm font-medium rounded-lg transition ${
                  isDark 
                    ? 'bg-dark-400 text-gray-300 hover:bg-dark-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                data-testid="refresh-history"
              >
                Refresh History
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
