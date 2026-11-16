import { RATE_ROWS, buildRateRowMetrics } from './goldCalculations';

export const PRICE_ALERT_DEFS = [
  { id: 'usdt', label: 'نرخ USDT', priceKey: 'usdtRate', unit: 'تومان' },
  { id: 'gold18k', label: 'طلای ۱۸ عیار (گرم)', priceKey: 'gold18kPerGram', unit: 'تومان' },
  { id: 'goldOunce', label: 'انس جهانی طلا', priceKey: 'goldOunceGlobal', unit: 'دلار' },
];

export function createDefaultRateAlertSettings() {
  const bubbles = {};
  RATE_ROWS.forEach((row) => {
    bubbles[row.id] = {
      enabled: row.id === 'geram18',
      highPercent: row.id === 'geram18' ? 10 : null,
      lowPercent: row.id === 'geram18' ? -5 : null,
    };
  });

  const prices = {};
  PRICE_ALERT_DEFS.forEach((def) => {
    prices[def.id] = { enabled: false, high: null, low: null };
  });

  return { enabled: true, bubbles, prices };
}

function normalizeBubbleRule(rule) {
  if (!rule) return { enabled: false, highPercent: null, lowPercent: null };
  return {
    enabled: !!rule.enabled,
    highPercent: parseThreshold(rule.highPercent),
    lowPercent: parseThreshold(rule.lowPercent),
  };
}

function normalizePriceRule(rule) {
  if (!rule) return { enabled: false, high: null, low: null };
  return {
    enabled: !!rule.enabled,
    high: parseThreshold(rule.high),
    low: parseThreshold(rule.low),
  };
}

export function migrateRateAlertSettings(raw) {
  const defaults = createDefaultRateAlertSettings();
  if (!raw || typeof raw !== 'object') return defaults;

  const bubbles = { ...defaults.bubbles };
  if (raw.bubbles && typeof raw.bubbles === 'object') {
    Object.keys(bubbles).forEach((id) => {
      bubbles[id] = normalizeBubbleRule({
        ...defaults.bubbles[id],
        ...raw.bubbles[id],
      });
    });
  }

  const prices = { ...defaults.prices };
  if (raw.prices && typeof raw.prices === 'object') {
    Object.keys(prices).forEach((id) => {
      prices[id] = normalizePriceRule({
        ...defaults.prices[id],
        ...raw.prices[id],
      });
    });
  }

  return {
    enabled: raw.enabled !== false,
    bubbles,
    prices,
  };
}

export function parseThreshold(value) {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function evaluateRateAlerts(prices, settings) {
  if (!settings?.enabled) return [];

  const alerts = [];

  RATE_ROWS.forEach((row) => {
    const rule = settings.bubbles?.[row.id];
    if (!rule?.enabled) return;

    const high = parseThreshold(rule.highPercent);
    const low = parseThreshold(rule.lowPercent);
    if (high == null && low == null) return;

    const { bubble } = buildRateRowMetrics(prices, row);

    if (high != null && bubble >= high) {
      alerts.push({
        id: `bubble-high-${row.id}`,
        kind: 'bubble_high',
        severity: 'danger',
        rowId: row.id,
        label: row.label,
        value: bubble,
        threshold: high,
        unit: '٪',
      });
    } else if (low != null && bubble <= low) {
      alerts.push({
        id: `bubble-low-${row.id}`,
        kind: 'bubble_low',
        severity: 'success',
        rowId: row.id,
        label: row.label,
        value: bubble,
        threshold: low,
        unit: '٪',
      });
    }
  });

  PRICE_ALERT_DEFS.forEach((def) => {
    const rule = settings.prices?.[def.id];
    if (!rule?.enabled) return;

    const high = parseThreshold(rule.high);
    const low = parseThreshold(rule.low);
    if (high == null && low == null) return;

    const value = Number(prices[def.priceKey]) || 0;
    if (value <= 0) return;

    if (high != null && value >= high) {
      alerts.push({
        id: `price-high-${def.id}`,
        kind: 'price_high',
        severity: 'warning',
        priceId: def.id,
        label: def.label,
        value,
        threshold: high,
        unit: def.unit,
      });
    } else if (low != null && value <= low) {
      alerts.push({
        id: `price-low-${def.id}`,
        kind: 'price_low',
        severity: 'info',
        priceId: def.id,
        label: def.label,
        value,
        threshold: low,
        unit: def.unit,
      });
    }
  });

  const severityOrder = { danger: 0, warning: 1, success: 2, info: 3 };
  return alerts.sort(
    (a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9)
  );
}