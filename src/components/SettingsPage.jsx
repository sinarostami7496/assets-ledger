import { useRef, useState } from 'react';
import {
  Moon,
  Sun,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Pause,
  Play,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAssets, DEFAULT_PRICES } from '../context/AssetContext';
import { formatCurrency, formatPercent, toPersianDigits } from '../utils/format';

export default function SettingsPage() {
  const { state, dispatch, portfolioSummary, exportFullState, prices } = useAssets();
  const fileInputRef = useRef(null);
  const [overrides, setOverrides] = useState({
    ...state.priceOverrides,
  });

  const toggleTheme = () => {
    dispatch({
      type: 'SET_THEME',
      theme: state.theme === 'dark' ? 'light' : 'dark',
    });
  };

  const applyOverrides = (e) => {
    e.preventDefault();
    dispatch({ type: 'APPLY_PRICE_OVERRIDES', overrides: { ...overrides } });
  };

  const resetPrices = () => {
    setOverrides({ ...DEFAULT_PRICES });
    dispatch({ type: 'SET_LIVE_PRICE', enabled: true });
    dispatch({ type: 'UPDATE_PRICES', prices: { ...DEFAULT_PRICES } });
  };

  const buildExportRows = () => {
    const rows = [];
    portfolioSummary.classTotals.forEach((assetClass) => {
      assetClass.items.forEach((item) => {
        rows.push({
          کلاس: assetClass.name,
          نام: item.name,
          مقدار: item.quantity,
          واحد: item.unit,
          'ارزش واحد': item.effectiveUnitPrice,
          'ارزش کل': item.total,
          'درصد سبد': item.percent.toFixed(2),
        });
      });
    });
    return rows;
  };

  const exportCSV = () => {
    const rows = buildExportRows();
    const headers = ['کلاس', 'نام', 'مقدار', 'واحد', 'ارزش واحد', 'ارزش کل', 'درصد سبد'];
    const csvContent = [
      headers.join(','),
      ...rows.map((r) =>
        headers.map((h) => `"${String(r[h]).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, 'assets-ledger.csv');
  };

  const exportExcel = () => {
    const rows = buildExportRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'دارایی‌ها');
    XLSX.writeFile(wb, 'assets-ledger.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('Asset Ledger Report / گزارش دارایی‌ها', 14, 15);

    const body = [];
    portfolioSummary.classTotals.forEach((assetClass) => {
      assetClass.items.forEach((item) => {
        body.push([
          assetClass.name,
          item.name,
          String(item.quantity),
          item.unit,
          String(Math.round(item.effectiveUnitPrice)),
          String(Math.round(item.total)),
          item.percent.toFixed(1) + '%',
        ]);
      });
    });

    autoTable(doc, {
      head: [['Class', 'Name', 'Qty', 'Unit', 'Unit Price', 'Total', '%']],
      body,
      startY: 22,
      styles: { fontSize: 9 },
    });

    doc.save('assets-ledger.pdf');
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = portfolioSummary.classTotals
      .flatMap((c) =>
        c.items.map(
          (item) => `
        <tr>
          <td>${c.name}</td>
          <td>${item.name}</td>
          <td>${toPersianDigits(item.quantity)}</td>
          <td>${item.unit}</td>
          <td>${formatCurrency(item.effectiveUnitPrice, '')}</td>
          <td>${formatCurrency(item.total, '')}</td>
          <td>${formatPercent(item.percent)}</td>
        </tr>`
        )
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>گزارش دارایی‌ها</title>
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: Vazirmatn, Tahoma, sans-serif; padding: 2rem; }
          h1 { text-align: center; margin-bottom: 0.5rem; }
          .meta { text-align: center; color: #666; margin-bottom: 2rem; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
          th { background: #1a1a2e; color: #fff; }
          tfoot td { font-weight: bold; background: #f5f5f5; }
        </style>
      </head>
      <body>
        <h1>گزارش دارایی‌های شخصی</h1>
        <p class="meta">تاریخ: ${new Date().toLocaleDateString('fa-IR')}</p>
        <table>
          <thead>
            <tr>
              <th>کلاس</th><th>نام</th><th>مقدار</th><th>واحد</th>
              <th>ارزش واحد</th><th>ارزش کل</th><th>درصد</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <td colspan="5">جمع کل</td>
              <td>${formatCurrency(portfolioSummary.portfolioTotal, '')}</td>
              <td>۱۰۰٪</td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(exportFullState(), null, 2)], {
      type: 'application/json',
    });
    downloadBlob(blob, 'wealth-dashboard-backup.json');
  };

  const importJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        dispatch({ type: 'IMPORT_STATE', payload: data });
        alert('داده‌ها با موفقیت بازیابی شد.');
      } catch {
        alert('فایل پشتیبان نامعتبر است.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="page settings-page">
      <div className="page-header">
        <h2>⚙️ تنظیمات و پشتیبان‌گیری</h2>
        <p className="text-muted mb-0">مدیریت ظاهر، قیمت‌ها و پشتیبان داده</p>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="settings-card">
            <h5>ظاهر برنامه</h5>
            <p className="text-muted small">تم روشن یا تاریک با ذخیره خودکار</p>
            <button type="button" className="btn btn-outline-primary" onClick={toggleTheme}>
              {state.theme === 'dark' ? (
                <>
                  <Sun size={16} className="me-2" />
                  تغییر به حالت روشن
                </>
              ) : (
                <>
                  <Moon size={16} className="me-2" />
                  تغییر به حالت تاریک
                </>
              )}
            </button>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="settings-card">
            <h5>به‌روزرسانی قیمت زنده</h5>
            <p className="text-muted small">
              {state.livePriceEnabled
                ? 'نرخ‌ها هر ۱۰ ثانیه به‌صورت شبیه‌سازی‌شده به‌روز می‌شوند.'
                : 'حالت دستی فعال است — از فرم زیر استفاده کنید.'}
            </p>
            <div className="d-flex gap-2 flex-wrap">
              <button
                type="button"
                className={`btn ${state.livePriceEnabled ? 'btn-warning' : 'btn-success'}`}
                onClick={() =>
                  dispatch({ type: 'SET_LIVE_PRICE', enabled: !state.livePriceEnabled })
                }
              >
                {state.livePriceEnabled ? (
                  <>
                    <Pause size={16} className="me-1" /> توقف شبیه‌سازی
                  </>
                ) : (
                  <>
                    <Play size={16} className="me-1" /> فعال‌سازی زنده
                  </>
                )}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={resetPrices}>
                <RefreshCw size={16} className="me-1" /> بازنشانی پیش‌فرض
              </button>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="settings-card">
            <h5>تنظیم دستی نرخ‌ها</h5>
            <form onSubmit={applyOverrides}>
              <div className="row g-3">
                <div className="col-md-6 col-lg-3">
                  <label className="form-label">انس جهانی طلا ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={overrides.goldOunceGlobal}
                    onChange={(e) =>
                      setOverrides({ ...overrides, goldOunceGlobal: Number(e.target.value) })
                    }
                    step="0.01"
                  />
                </div>
                <div className="col-md-6 col-lg-3">
                  <label className="form-label">نرخ دلار (تومان)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={overrides.usdRate}
                    onChange={(e) =>
                      setOverrides({ ...overrides, usdRate: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="col-md-6 col-lg-3">
                  <label className="form-label">طلای ۱۸ عیار (تومان/گرم)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={overrides.gold18kPerGram}
                    onChange={(e) =>
                      setOverrides({ ...overrides, gold18kPerGram: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="col-md-6 col-lg-3">
                  <label className="form-label">حباب طلا (٪)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={overrides.gold18kBubble}
                    onChange={(e) =>
                      setOverrides({ ...overrides, gold18kBubble: Number(e.target.value) })
                    }
                    step="0.1"
                  />
                </div>
              </div>
              <div className="mt-3 d-flex align-items-center gap-3 flex-wrap">
                <button type="submit" className="btn btn-primary">
                  اعمال نرخ‌های دستی
                </button>
                <small className="text-muted">
                  نرخ فعلی دلار: {formatCurrency(prices.usdRate, '')}
                </small>
              </div>
            </form>
          </div>
        </div>

        <div className="col-12">
          <div className="settings-card">
            <h5>خروجی و پشتیبان‌گیری</h5>
            <p className="text-muted small mb-3">
              خروجی CSV، Excel، PDF و پشتیبان JSON کامل وضعیت برنامه
            </p>
            <div className="d-flex flex-wrap gap-2">
              <button type="button" className="btn btn-outline-success" onClick={exportCSV}>
                <Download size={16} className="me-1" /> CSV
              </button>
              <button type="button" className="btn btn-outline-success" onClick={exportExcel}>
                <FileSpreadsheet size={16} className="me-1" /> Excel
              </button>
              <button type="button" className="btn btn-outline-danger" onClick={exportPDF}>
                <FileText size={16} className="me-1" /> PDF
              </button>
              <button type="button" className="btn btn-outline-primary" onClick={printReport}>
                <FileText size={16} className="me-1" /> چاپ / PDF فارسی
              </button>
              <button type="button" className="btn btn-primary" onClick={exportJSON}>
                <Download size={16} className="me-1" /> پشتیبان JSON
              </button>
              <button
                type="button"
                className="btn btn-warning"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} className="me-1" /> بازیابی JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="d-none"
                onChange={importJSON}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
