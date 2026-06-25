export const TGJU_API_URL = 'https://call4.tgju.org/ajax.json';
export const FETCH_INTERVAL_MS = 60_000;

const GRAM_PER_OUNCE = 31.1034768;

export function parseTgjuNumber(value) {
  if (value == null || value === '') return null;
  const num = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(num) ? num : null;
}

function rialToToman(rial) {
  return rial == null ? null : Math.round(rial / 10);
}

/** تبدیل پاسخ TGJU به ساختار قیمت داشبورد */
export function mapTgjuPrices(current) {
  if (!current) {
    throw new Error('پاسخ TGJU نامعتبر است');
  }

  const onsUsd = parseTgjuNumber(current.ons?.p);
  const usdtRial = parseTgjuNumber(current['crypto-tether-irr']?.p);
  const geram18Rial = parseTgjuNumber(current.geram18?.p);

  if (onsUsd == null || usdtRial == null || geram18Rial == null) {
    throw new Error('فیلدهای قیمت در پاسخ TGJU یافت نشد');
  }

  const usdtRate = rialToToman(usdtRial);
  const gold18kPerGram = rialToToman(geram18Rial);

  const theoretical18k = (onsUsd / GRAM_PER_OUNCE) * (18 / 24) * usdtRate;
  const gold18kBubble =
    theoretical18k > 0
      ? Math.round(((gold18kPerGram - theoretical18k) / theoretical18k) * 1000) / 10
      : 0;

  const usdRial =
    parseTgjuNumber(current['price_dollar_rl']?.p) ??
    parseTgjuNumber(current['price_dollar_dt']?.p);

  return {
    goldOunceGlobal: onsUsd,
    usdtRate,
    usdRate: rialToToman(usdRial),
    gold18kPerGram,
    gold18kBubble,
    coinSekee: rialToToman(parseTgjuNumber(current.sekee?.p)),
    coinSekeb: rialToToman(parseTgjuNumber(current.sekeb?.p)),
    coinGerami: rialToToman(parseTgjuNumber(current.gerami?.p)),
    coinNim: rialToToman(parseTgjuNumber(current.nim?.p)),
    coinRob: rialToToman(parseTgjuNumber(current.rob?.p)),
  };
}

export async function fetchLivePrices() {
  const response = await fetch(TGJU_API_URL, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`TGJU API: ${response.status}`);
  }

  const data = await response.json();
  return mapTgjuPrices(data.current);
}
