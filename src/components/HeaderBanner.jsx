import { TrendingUp, TrendingDown, Menu, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useAssets } from '../context/AssetContext';
import { formatCurrency, formatNumber } from '../utils/format';

const TICKER_ITEMS = [
  { key: 'goldOunceGlobal', label: 'انس جهانی طلا', suffix: ' $', decimals: 2 },
  { key: 'usdtRate', label: 'قیمت USDT', suffix: ' تومان', decimals: 0 },
  { key: 'gold18kPerGram', label: 'طلای ۱۸ عیار', suffix: ' تومان/گرم', decimals: 0 },
  { key: 'gold18kBubble', label: 'حباب طلای ۱۸ عیار', suffix: '٪', decimals: 1, isPercent: true },
];

const STATUS_CONFIG = {
  live: {
    icon: Wifi,
    label: 'متصل — نرخ زنده',
    className: 'status-live',
  },
  loading: {
    icon: Loader2,
    label: 'در حال دریافت نرخ...',
    className: 'status-loading',
  },
  cached: {
    icon: WifiOff,
    label: 'آخرین نرخ ذخیره‌شده',
    className: 'status-cached',
  },
};

export default function HeaderBanner() {
  const { state, dispatch, prices } = useAssets();
  const flash = state.priceFlash || {};
  const status = STATUS_CONFIG[state.priceFetchStatus] || STATUS_CONFIG.cached;
  const StatusIcon = status.icon;

  return (
    <header className="header-banner sticky-top">
      <div className="banner-top">
        <button
          type="button"
          className="btn btn-sm btn-outline-light sidebar-toggle d-lg-none"
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          aria-label="باز کردن منو"
        >
          <Menu size={18} />
        </button>
        <div className="banner-title">
          <span
            className={`live-status-badge ${status.className}`}
            title={status.label}
          >
            <StatusIcon
              size={14}
              className={state.priceFetchStatus === 'loading' ? 'status-spin' : ''}
            />
            <span>{status.label}</span>
          </span>
          <span className="banner-divider" />
          <span>نرخ‌های لحظه‌ای بازار</span>
        </div>
      </div>

      <div className="ticker-row">
        {TICKER_ITEMS.map(({ key, label, suffix, decimals, isPercent }) => {
          const value = prices[key];
          const direction = flash[key];
          const displayValue = isPercent
            ? formatNumber(value, decimals) + suffix
            : key === 'goldOunceGlobal'
              ? `$${formatNumber(value, decimals)}`
              : formatCurrency(value, suffix);

          return (
            <div
              key={key}
              className={`ticker-item ${direction ? `flash-${direction}` : ''}`}
            >
              <span className="ticker-label">{label}</span>
              <span className="ticker-value">
                {direction === 'up' && <TrendingUp size={14} className="text-success me-1" />}
                {direction === 'down' && <TrendingDown size={14} className="text-danger me-1" />}
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    </header>
  );
}
