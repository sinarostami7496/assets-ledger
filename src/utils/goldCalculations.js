export const GRAM_PER_OUNCE = 31.1034768;
export const MESGHAL_GRAMS = 4.608;
export const MESGHAL_PURITY = 705 / 1000;

export const RATE_ROWS = [
  {
    id: 'geram18',
    label: 'طلا گرم ۱۸ عیار',
    priceKey: 'gold18kPerGram',
    kind: 'gram',
    karat: 18,
  },
  {
    id: 'sekee',
    label: 'سکه امامی',
    priceKey: 'coinSekee',
    kind: 'coin',
    weightGrams: 8.1339,
    karat: 21.6,
  },
  {
    id: 'sekeb',
    label: 'سکه بهار',
    priceKey: 'coinSekeb',
    kind: 'coin',
    weightGrams: 8.1339,
    karat: 21.6,
  },
  {
    id: 'nim',
    label: 'نیم سکه',
    priceKey: 'coinNim',
    kind: 'coin',
    weightGrams: 4.0669,
    karat: 21.6,
  },
  {
    id: 'rob',
    label: 'ربع سکه',
    priceKey: 'coinRob',
    kind: 'coin',
    weightGrams: 2.0334,
    karat: 21.6,
  },
  {
    id: 'mesghal',
    label: 'مظنه آب‌شده نقدی',
    priceKey: 'mesghal',
    kind: 'mesghal',
  },
  {
    id: 'geram24',
    label: 'طلا گرم ۲۴ عیار',
    priceKey: 'gold24kPerGram',
    kind: 'gram',
    karat: 24,
  },
];

function goldUsdPerUnit(onsUsd, { kind, karat, weightGrams }) {
  if (kind === 'mesghal') {
    return MESGHAL_GRAMS * MESGHAL_PURITY * (onsUsd / GRAM_PER_OUNCE);
  }
  const weight = kind === 'coin' ? weightGrams : 1;
  return weight * (karat / 24) * (onsUsd / GRAM_PER_OUNCE);
}

/** ارزش ذاتی بر اساس انس جهانی و نرخ دلار */
export function calcIntrinsicValue(onsUsd, usdRate, row) {
  const goldUsd = goldUsdPerUnit(onsUsd, row);
  return Math.round(goldUsd * usdRate);
}

/** حباب — درصد اختلاف آخرین قیمت با ارزش ذاتی */
export function calcBubblePercent(latestPrice, intrinsicValue) {
  if (!intrinsicValue || intrinsicValue <= 0) return 0;
  return Math.round(((latestPrice - intrinsicValue) / intrinsicValue) * 1000) / 10;
}

/** دلار محاسباتی — نرخ دلار ضمنی از قیمت بازار و انس جهانی */
export function calcImpliedUsdRate(latestPrice, onsUsd, row) {
  const goldUsd = goldUsdPerUnit(onsUsd, row);
  if (!goldUsd) return 0;
  return Math.round(latestPrice / goldUsd);
}

export function buildRateRowMetrics(prices, row) {
  const latestPrice = prices[row.priceKey] ?? 0;
  const onsUsd = prices.goldOunceGlobal ?? 0;
  const usdRate = prices.usdRate ?? prices.usdtRate ?? 0;

  const intrinsicValue = calcIntrinsicValue(onsUsd, usdRate, row);
  const bubble = calcBubblePercent(latestPrice, intrinsicValue);
  const impliedUsd = calcImpliedUsdRate(latestPrice, onsUsd, row);

  return { latestPrice, intrinsicValue, bubble, impliedUsd };
}
