const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** تبدیل اعداد لاتین به فارسی */
export function toPersianDigits(value) {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

/** فرمت مبلغ با جداکننده هزارگان و ارقام فارسی */
export function formatCurrency(amount, suffix = ' تومان') {
  const num = Math.round(Number(amount) || 0);
  const formatted = num.toLocaleString('en-US');
  return toPersianDigits(formatted) + suffix;
}

/** فرمت درصد با ارقام فارسی */
export function formatPercent(value, decimals = 1) {
  const num = Number(value) || 0;
  return toPersianDigits(num.toFixed(decimals)) + '٪';
}

/** فرمت عدد ساده */
export function formatNumber(value, decimals = 0) {
  const num = Number(value) || 0;
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return toPersianDigits(formatted);
}

/** شناسه یکتا */
export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** تاریخ و ساعت آخرین بروزرسانی به فارسی */
export function formatLastUpdate(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return null;

  const time = new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

  const dayName = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(date);
  const datePart = new Intl.DateTimeFormat('fa-IR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

  return `آخرین بروزرسانی: ${time} ${dayName} ${datePart}`;
}
