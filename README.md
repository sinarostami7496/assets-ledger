# داشبورد مدیریت دارایی‌ها

یک داشبورد ثروت شخصی مدرن با رابط کاربری فارسی (RTL)، نرخ‌های زنده بازار، مدیریت سبد دارایی و پشتیبان‌گیری محلی.

## ویژگی‌ها

- **پیشخوان** — کارت‌های KPI، نمودار تخصیص دارایی، روند رشد ثروت، هشدار ریسک تمرکز (>۶۰٪)
- **مدیریت دارایی‌ها** — جدول تو در تو با افزودن/ویرایش/حذف کلاس و زیرآیتم، محاسبه خودکار قیمت طلا و USDT
- **تنظیمات** — تم روشن/تاریک، خروجی CSV/Excel/PDF، چاپ فارسی، پشتیبان JSON
- **نرخ زنده** — دریافت از [TGJU](https://call4.tgju.org/ajax.json) هر ۱ دقیقه
- **ذخیره‌سازی محلی** — تمام داده‌ها در `localStorage` نگهداری می‌شوند

## پشته فناوری

| بخش | کتابخانه |
|-----|----------|
| فریم‌ورک | React 19 + Vite 5 |
| استایل | Bootstrap 5 RTL |
| نمودار | Recharts |
| آیکون | Lucide React |
| خروجی | xlsx, jsPDF, jsPDF-AutoTable |

## شروع سریع

```bash
npm install
npm run dev
```

ساخت نسخه production:

```bash
npm run build
npm run preview
```

## نرخ‌های زنده

منبع داده: `GET https://call4.tgju.org/ajax.json`

| نمایش در هدر | فیلد API | توضیح |
|--------------|----------|--------|
| انس جهانی طلا | `ons` | دلار (انس جهانی) |
| قیمت USDT | `crypto-tether-irr` | ریال → تومان (÷۱۰) |
| طلای ۱۸ عیار | `geram18` | ریال → تومان (÷۱۰) |
| حباب طلای ۱۸ عیار | محاسبه‌شده | مقایسه قیمت بازار با ارزش ذاتی |

**وضعیت اتصال در هدر:**

| وضعیت | معنی |
|-------|------|
| متصل — نرخ زنده | دریافت موفق از API |
| در حال دریافت نرخ... | در حال fetch |
| آخرین نرخ ذخیره‌شده | خطای API — استفاده از آخرین قیمت `localStorage` |

## ساختار پروژه

```text
src/
├── context/AssetContext.jsx   # state، localStorage، محاسبات سبد
├── services/tgjuApi.js        # دریافت و نگاشت قیمت TGJU
├── components/
│   ├── Sidebar.jsx
│   ├── HeaderBanner.jsx
│   ├── DashboardPage.jsx
│   ├── AssetLedgerPage.jsx
│   └── SettingsPage.jsx
├── utils/format.js            # ارقام و مبالغ فارسی
├── styles/App.css
├── App.jsx
└── index.jsx
```

## ذخیره‌سازی

کلید `localStorage`: `wealth-dashboard-v1`

شامل: دارایی‌ها، قیمت‌های آخر، تم، تاریخچه ثروت و تنظیمات. پشتیبان JSON از صفحه تنظیمات قابل export/import است.

## اسکریپت‌ها

| دستور | کاربرد |
|-------|--------|
| `npm run dev` | سرور توسعه |
| `npm run build` | ساخت production |
| `npm run preview` | پیش‌نمایش build |
| `npm run lint` | بررسی ESLint |

## نیازمندی‌ها

- Node.js 18+ (توصیه: 20.19+)
