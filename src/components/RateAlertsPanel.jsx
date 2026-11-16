import { Bell, TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent, toPersianDigits } from '../utils/format';

function LtrNum({ children }) {
  return <span className="rate-alert-num">{children}</span>;
}

function formatAlertValue(alert) {
  if (alert.unit === '٪') {
    return <LtrNum>{formatPercent(alert.value)}</LtrNum>;
  }
  if (alert.unit === 'دلار') {
    return (
      <>
        <LtrNum>{formatNumber(alert.value, 2)}</LtrNum> دلار
      </>
    );
  }
  return <LtrNum>{formatCurrency(alert.value, '')}</LtrNum>;
}

function formatAlertThreshold(alert) {
  if (alert.unit === '٪') {
    return <LtrNum>{formatPercent(alert.threshold)}</LtrNum>;
  }
  if (alert.unit === 'دلار') {
    return (
      <>
        <LtrNum>{formatNumber(alert.threshold, 2)}</LtrNum> دلار
      </>
    );
  }
  return <LtrNum>{formatCurrency(alert.threshold, '')}</LtrNum>;
}

function alertMessage(alert) {
  const valueText = formatAlertValue(alert);
  const thresholdText = formatAlertThreshold(alert);

  switch (alert.kind) {
    case 'bubble_high':
      return (
        <>
          حباب <strong>{alert.label}</strong> به {valueText} رسیده (آستانهٔ بالا: {thresholdText}).
          قیمت بازار از ارزش ذاتی بالاتر است.
        </>
      );
    case 'bubble_low':
      return (
        <>
          حباب <strong>{alert.label}</strong> به {valueText} رسیده (آستانهٔ پایین: {thresholdText}).
          قیمت نزدیک یا زیر ارزش ذاتی است.
        </>
      );
    case 'price_high':
      return (
        <>
          <strong>{alert.label}</strong> به {valueText} رسیده (بالای آستانهٔ {thresholdText}).
        </>
      );
    case 'price_low':
      return (
        <>
          <strong>{alert.label}</strong> به {valueText} رسیده (زیر آستانهٔ {thresholdText}).
        </>
      );
    default:
      return null;
  }
}

function AlertIcon({ kind }) {
  if (kind === 'bubble_low' || kind === 'price_low') {
    return <TrendingDown size={18} className="flex-shrink-0" />;
  }
  return <TrendingUp size={18} className="flex-shrink-0" />;
}

export default function RateAlertsPanel({ alerts, compact = false }) {
  if (!alerts?.length) return null;

  return (
    <div className={`rate-alerts-panel ${compact ? 'rate-alerts-panel-compact' : ''} mb-4`}>
      <div className="rate-alerts-header">
        <Bell size={22} aria-hidden="true" />
        <h5 className="mb-0">هشدار حباب و نرخ</h5>
        <span className="badge rounded-pill text-bg-danger rate-alert-num">
          {toPersianDigits(alerts.length)}
        </span>
      </div>
      <ul className="rate-alerts-list mb-0">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className={`rate-alert-item rate-alert-${alert.severity}`}
          >
            <AlertIcon kind={alert.kind} />
            <span className="rate-alert-text">{alertMessage(alert)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}