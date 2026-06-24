import {
  LayoutDashboard,
  Wallet,
  Settings,
  X,
  Gem,
} from 'lucide-react';
import { useAssets } from '../context/AssetContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'پیشخوان', icon: LayoutDashboard, emoji: '📊' },
  { id: 'ledger', label: 'مدیریت دارایی‌ها', icon: Wallet, emoji: '💼' },
  { id: 'settings', label: 'تنظیمات و پشتیبان‌گیری', icon: Settings, emoji: '⚙️' },
];

export default function Sidebar() {
  const { state, dispatch } = useAssets();

  return (
    <>
      {state.sidebarOpen && (
        <div
          className="sidebar-backdrop d-lg-none"
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${state.sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Gem size={22} />
          </div>
          <div>
            <h1 className="brand-title">مدیریت دارایی</h1>
            <p className="brand-subtitle">داشبورد ثروت شخصی</p>
          </div>
          <button
            type="button"
            className="btn btn-link text-body sidebar-close d-lg-none"
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            aria-label="بستن منو"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ id, label, icon: Icon, emoji }) => (
            <button
              key={id}
              type="button"
              className={`nav-item ${state.currentPage === id ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_PAGE', page: id })}
            >
              <span className="nav-emoji">{emoji}</span>
              <Icon size={18} className="nav-icon" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <small className="text-muted">نسخه ۱.۰ — ذخیره‌سازی محلی</small>
        </div>
      </aside>
    </>
  );
}
