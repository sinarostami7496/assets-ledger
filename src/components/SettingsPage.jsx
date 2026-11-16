import { useEffect, useMemo, useRef, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import {
  Moon,
  Sun,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  Target,
  Save,
  Scale,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAssets } from '../context/AssetContext';
import { formatCurrency, formatPercent, toPersianDigits } from '../utils/format';
import { isTargetAllocationValid } from '../utils/targetAllocation';

function buildDraftFromState(assetClasses, targetAllocation) {
  const draft = {};
  assetClasses.forEach((c) => {
    draft[c.id] =
      targetAllocation[c.id] != null ? String(targetAllocation[c.id]) : '';
  });
  return draft;
}

export default function SettingsPage() {
  const { state, dispatch, portfolioSummary, exportFullState } = useAssets();
  const fileInputRef = useRef(null);
  const [targetDraft, setTargetDraft] = useState(() =>
    buildDraftFromState(state.assetClasses, state.targetAllocation)
  );

  const targetDraftSum = useMemo(() => {
    return Object.values(targetDraft).reduce((sum, raw) => sum + (Number(raw) || 0), 0);
  }, [targetDraft]);

  const parsedTargetForValidation = useMemo(() => {
    const map = {};
    state.assetClasses.forEach((c) => {
      const raw = targetDraft[c.id];
      if (raw !== '' && raw != null) map[c.id] = Number(raw) || 0;
    });
    return map;
  }, [targetDraft, state.assetClasses]);

  const targetFormValid = useMemo(
    () => isTargetAllocationValid(parsedTargetForValidation, state.assetClasses.map((c) => c.id)),
    [parsedTargetForValidation, state.assetClasses]
  );

  const savedTargetValid = useMemo(
    () =>
      isTargetAllocationValid(
        state.targetAllocation,
        state.assetClasses.map((c) => c.id)
      ),
    [state.assetClasses, state.targetAllocation]
  );

  useEffect(() => {
    setTargetDraft(buildDraftFromState(state.assetClasses, state.targetAllocation));
  }, [state.assetClasses, state.targetAllocation]);

  const toggleTheme = () => {
    dispatch({
      type: 'SET_THEME',
      theme: state.theme === 'dark' ? 'light' : 'dark',
    });
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
    downloadBlob(blob, getFilename('assets-ledger', 'csv'));
  };

  const exportExcel = () => {
    const rows = buildExportRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'دارایی‌ها');
    XLSX.writeFile(wb, getFilename('assets-ledger', 'xlsx'));
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

    doc.save(getFilename('assets-ledger', 'pdf'));
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
    downloadBlob(blob, getFilename('wealth-dashboard-backup', 'json'));
  };

  const distributeTargetsEvenly = () => {
    if (state.assetClasses.length === 0) return;
    const each = Math.round((100 / state.assetClasses.length) * 10) / 10;
    const next = {};
    state.assetClasses.forEach((c, index) => {
      if (index === state.assetClasses.length - 1) {
        const assigned = each * (state.assetClasses.length - 1);
        next[c.id] = String(Math.round((100 - assigned) * 10) / 10);
      } else {
        next[c.id] = String(each);
      }
    });
    setTargetDraft(next);
  };

  const syncDraftFromPortfolio = () => {
    const next = {};
    state.assetClasses.forEach((c) => {
      const row = portfolioSummary.classTotals.find((t) => t.id === c.id);
      const percent = row?.percent ?? 0;
      next[c.id] = String(Math.round(percent * 10) / 10);
    });
    setTargetDraft(next);
  };

  const saveTargetAllocation = () => {
    if (!targetFormValid) return;
    dispatch({ type: 'SET_TARGET_ALLOCATION', targetAllocation: parsedTargetForValidation });
  };

  const clearTargetAllocation = () => {
    dispatch({ type: 'SET_TARGET_ALLOCATION', targetAllocation: {} });
    setTargetDraft(buildDraftFromState(state.assetClasses, {}));
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
        <p className="text-muted mb-0">مدیریت ظاهر و پشتیبان داده</p>
      </div>

      <div className="row g-4">
        <div className="col-12">
          <div className="settings-card target-allocation-card">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <Target size={22} className="text-warning" />
              <h5 className="mb-0">تخصیص هدف سبد</h5>
              {savedTargetValid && (
                <span className="badge text-bg-success">فعال در پیشخوان</span>
              )}
            </div>
            <p className="text-muted small mb-3">
              برای هر کلاس دارایی درصد هدف تعیین کنید. جمع درصدها باید ۱۰۰٪ باشد تا انحراف در
              پیشخوان نمایش داده شود.
            </p>
            {state.assetClasses.length === 0 ? (
              <p className="text-muted mb-0">ابتدا در صفحهٔ مدیریت دارایی‌ها کلاس اضافه کنید.</p>
            ) : (
              <>
                <div className="table-responsive mb-3">
                  <table className="table table-sm target-allocation-table mb-0">
                    <thead>
                      <tr>
                        <th>کلاس</th>
                        <th>درصد فعلی سبد</th>
                        <th>درصد هدف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.assetClasses.map((assetClass) => {
                        const current = portfolioSummary.classTotals.find(
                          (t) => t.id === assetClass.id
                        );
                        return (
                          <tr key={assetClass.id}>
                            <td>{assetClass.name}</td>
                            <td>{formatPercent(current?.percent ?? 0)}</td>
                            <td>
                              <NumericFormat
                                className="form-control form-control-sm target-percent-input"
                                value={targetDraft[assetClass.id] ?? ''}
                                onValueChange={({ value }) =>
                                  setTargetDraft((prev) => ({
                                    ...prev,
                                    [assetClass.id]: value,
                                  }))
                                }
                                decimalScale={1}
                                allowNegative={false}
                                isAllowed={({ floatValue }) =>
                                  floatValue == null || floatValue <= 100
                                }
                                suffix=" ٪"
                                inputMode="decimal"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2} className="fw-semibold">
                          جمع درصدها
                        </td>
                        <td
                          className={`fw-bold ${
                            Math.abs(targetDraftSum - 100) < 0.05 ? 'text-success' : 'text-danger'
                          }`}
                        >
                          {formatPercent(targetDraftSum, 1)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={distributeTargetsEvenly}
                  >
                    <Scale size={16} className="me-1" />
                    تقسیم برابر بین کلاس‌ها
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={syncDraftFromPortfolio}
                  >
                    کپی از وضعیت فعلی سبد
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={saveTargetAllocation}
                    disabled={!targetFormValid}
                  >
                    <Save size={16} className="me-1" />
                    ذخیره اهداف
                  </button>
                  {Object.keys(state.targetAllocation).length > 0 && (
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={clearTargetAllocation}
                    >
                      حذف اهداف
                    </button>
                  )}
                </div>
                {!targetFormValid && targetDraftSum > 0 && (
                  <p className="text-danger small mb-0 mt-2">
                    همهٔ کلاس‌ها باید درصد هدف داشته باشند و جمع دقیقاً ۱۰۰٪ باشد.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

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

function getCurrentTime() {
  const now = new Date();

  const parts = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    numberingSystem: 'latn' 
  }).formatToParts(now);

  const dateObj = parts.reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  const formattedDate = `${dateObj.year}-${dateObj.month}-${dateObj.day}_${dateObj.hour}-${dateObj.minute}-${dateObj.second}`;
  return formattedDate;
}

function getFilename(filename, extension) {
  return `${filename}_${getCurrentTime()}.${extension}`;
}