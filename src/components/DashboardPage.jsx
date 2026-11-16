import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Wallet,
  CircleDollarSign,
  Coins,
  Banknote,
  AlertTriangle,
  Target,
} from 'lucide-react';
import { useAssets } from '../context/AssetContext';
import { useSensitiveDisplay } from '../hooks/useSensitiveDisplay';
import { toPersianDigits } from '../utils/format';
import RateAlertsPanel from './RateAlertsPanel';

const CHART_COLORS = ['#f0b429', '#4ade80', '#60a5fa', '#c084fc', '#fb7185', '#2dd4bf', '#f97316'];

const KPI_CONFIG = [
  { key: 'portfolioTotal', label: 'جمع کل ثروت', suffix: ' تومان', icon: Wallet, color: 'kpi-gold' },
  { key: 'usdtEquivalent', label: 'معادل USDT کل ثروت', suffix: ' USDT', icon: CircleDollarSign, color: 'kpi-blue', isUsdt: true },
  { key: 'goldTotal', label: 'ارزش کل بخش طلا', suffix: ' تومان', icon: Coins, color: 'kpi-amber' },
  { key: 'liquidTotal', label: 'ارزش نقدینگی و USDT', suffix: ' تومان', icon: Banknote, color: 'kpi-green' },
];

export default function DashboardPage() {
  const { portfolioSummary, dispatch, activeRateAlerts } = useAssets();
  const { displayCurrency, displayNumber, displayPercent } = useSensitiveDisplay();
  const {
    portfolioTotal,
    usdtEquivalent,
    goldTotal,
    liquidTotal,
    allocation,
    concentration,
    targetDrift,
  } = portfolioSummary;

  const kpiValues = {
    portfolioTotal,
    usdtEquivalent,
    goldTotal,
    liquidTotal,
  };

  const pieData = allocation.map((a) => ({
    name: a.name,
    value: a.value,
    percent: a.percent,
  }));

  function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
      <div className="chart-tooltip">
        <p className="mb-1 fw-semibold">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} style={{ color: entry.color }} className="mb-0 small">
            {entry.name}: {displayCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <h2>📊 پیشخوان</h2>
        <p className="text-muted mb-0">نمای کلی سبد دارایی و روند رشد ثروت</p>
      </div>

      <div className="row g-3 mb-4">
        {KPI_CONFIG.map(({ key, label, suffix, icon: Icon, color, isUsdt }) => (
          <div key={key} className="col-sm-6 col-xl-3">
            <div className={`kpi-card ${color}`}>
              <div className="kpi-icon">
                <Icon size={22} />
              </div>
              <div>
                <p className="kpi-label">{label}</p>
                <p className="kpi-value">
                  {isUsdt
                    ? `${displayNumber(kpiValues[key], 0)} USDT`
                    : displayCurrency(kpiValues[key], suffix)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <RateAlertsPanel alerts={activeRateAlerts} />

      {targetDrift.isActive && targetDrift.alerts.length > 0 && (
        <div className="alert alert-info target-drift-alert mb-4">
          <div className="d-flex align-items-start gap-3">
            <Target size={28} className="flex-shrink-0 mt-1" />
            <div>
              <h5 className="alert-heading mb-2">انحراف از تخصیص هدف</h5>
              {targetDrift.alerts.map((row) => {
                const overweight = row.driftPercent > 0;
                return (
                  <p key={row.id} className="mb-1">
                    کلاس <strong>{row.name}</strong>:{' '}
                    {overweight ? 'بیش‌وزن' : 'کم‌وزن'} نسبت به هدف (
                    {displayPercent(Math.abs(row.driftPercent))}).{' '}
                    {overweight
                      ? `حدود ${displayCurrency(Math.abs(row.gapValue), ' تومان')} بیش از سهم هدف است.`
                      : `برای رسیدن به هدف حدود ${displayCurrency(row.gapValue, ' تومان')} دیگر لازم است.`}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {concentration.length > 0 && (
        <div className="alert alert-warning risk-alert mb-4">
          <div className="d-flex align-items-start gap-3">
            <AlertTriangle size={28} className="flex-shrink-0 mt-1" />
            <div>
              <h5 className="alert-heading mb-2">هشدار ریسک تمرکز دارایی</h5>
              {concentration.map((c) => (
                <p key={c.name} className="mb-1">
                  ⚠️ هشدار ریسک: بیش از ۶۰٪ از کل دارایی شما در کلاس{' '}
                  <strong>{c.name}</strong> ({displayPercent(c.percent)}) متمرکز شده است.
                  برای مدیریت ریسک، تنوع‌بخشی به سبد پیشنهاد می‌شود.
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="chart-card h-100">
            <h5 className="chart-title">تخصیص دارایی (فعلی)</h5>
            <p className="text-muted small mb-3">سهم هر کلاس از کل سبد</p>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(value) => toPersianDigits(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="allocation-legend">
                  {pieData.map((item, i) => (
                    <div key={item.name} className="allocation-item">
                      <span
                        className="allocation-dot"
                        style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span>{item.name}</span>
                      <span className="ms-auto fw-semibold">{displayPercent(item.percent)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted text-center py-5">دارایی‌ای ثبت نشده است.</p>
            )}
          </div>
        </div>

        {targetDrift.isActive && (
          <div className="col-lg-7">
            <div className="chart-card h-100">
              <h5 className="chart-title">مقایسه با تخصیص هدف</h5>
              <p className="text-muted small mb-3">انحراف درصدی و فاصلهٔ ارزشی تا رسیدن به هدف</p>
              <div className="table-responsive">
                <table className="table table-sm target-drift-table mb-0">
                  <thead>
                    <tr>
                      <th>کلاس</th>
                      <th className="cell-ltr">هدف</th>
                      <th className="cell-ltr">فعلی</th>
                      <th className="cell-ltr">انحراف</th>
                      <th className="cell-ltr">فاصله تا هدف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targetDrift.rows.map((row) => {
                      const driftClass =
                        row.driftPercent > 0.05
                          ? 'drift-over'
                          : row.driftPercent < -0.05
                            ? 'drift-under'
                            : 'drift-ok';
                      return (
                        <tr key={row.id}>
                          <td>{row.name}</td>
                          <td className="cell-ltr">{displayPercent(row.targetPercent)}</td>
                          <td className="cell-ltr">{displayPercent(row.currentPercent)}</td>
                          <td className={`cell-ltr ${driftClass}`}>
                            {row.driftPercent >= 0 ? '+' : ''}
                            {displayPercent(row.driftPercent)}
                          </td>
                          <td className="cell-ltr">
                            {row.gapValue >= 0
                              ? `+${displayCurrency(row.gapValue, '')}`
                              : `−${displayCurrency(Math.abs(row.gapValue), '')}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!targetDrift.isActive && (
          <div className="col-lg-7">
            <div className="chart-card h-100 d-flex flex-column justify-content-center">
              <div className="text-center px-3 py-4">
                <Target size={40} className="text-muted mb-3" strokeWidth={1.5} />
                <h5 className="mb-2">تخصیص هدف تعریف نشده</h5>
                <p className="text-muted small mb-3">
                  در تنظیمات برای هر کلاس درصد هدف تنظیم کنید تا انحراف سبد اینجا نمایش داده شود.
                </p>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => dispatch({ type: 'SET_PAGE', page: 'settings' })}
                >
                  رفتن به تنظیمات
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
