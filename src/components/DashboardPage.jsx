import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Wallet,
  DollarSign,
  Coins,
  Banknote,
  AlertTriangle,
} from 'lucide-react';
import { useAssets } from '../context/AssetContext';
import { formatCurrency, formatNumber, formatPercent, toPersianDigits } from '../utils/format';

const CHART_COLORS = ['#f0b429', '#4ade80', '#60a5fa', '#c084fc', '#fb7185', '#2dd4bf', '#f97316'];

const KPI_CONFIG = [
  { key: 'portfolioTotal', label: 'جمع کل ثروت', suffix: ' تومان', icon: Wallet, color: 'kpi-gold' },
  { key: 'usdEquivalent', label: 'معادل دلاری کل ثروت', suffix: ' $', icon: DollarSign, color: 'kpi-blue', isUsd: true },
  { key: 'goldTotal', label: 'ارزش کل بخش طلا', suffix: ' تومان', icon: Coins, color: 'kpi-amber' },
  { key: 'liquidTotal', label: 'ارزش نقدینگی و دلار', suffix: ' تومان', icon: Banknote, color: 'kpi-green' },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="mb-1 fw-semibold">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="mb-0 small">
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { portfolioSummary, state, prices } = useAssets();
  const { portfolioTotal, goldTotal, liquidTotal, usdEquivalent, allocation, concentration } =
    portfolioSummary;

  const kpiValues = {
    portfolioTotal,
    usdEquivalent,
    goldTotal,
    liquidTotal,
  };

  const pieData = allocation.map((a) => ({
    name: a.name,
    value: a.value,
    percent: a.percent,
  }));

  const lineData = state.wealthHistory.map((h) => ({
    name: h.month,
    total: h.total,
  }));

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <h2>📊 پیشخوان</h2>
        <p className="text-muted mb-0">نمای کلی سبد دارایی و روند رشد ثروت</p>
      </div>

      <div className="row g-3 mb-4">
        {KPI_CONFIG.map(({ key, label, suffix, icon: Icon, color, isUsd }) => (
          <div key={key} className="col-sm-6 col-xl-3">
            <div className={`kpi-card ${color}`}>
              <div className="kpi-icon">
                <Icon size={22} />
              </div>
              <div>
                <p className="kpi-label">{label}</p>
                <p className="kpi-value">
                  {isUsd
                    ? `$${formatNumber(kpiValues[key], 0)}`
                    : formatCurrency(kpiValues[key], suffix)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {concentration.length > 0 && (
        <div className="alert alert-warning risk-alert mb-4">
          <div className="d-flex align-items-start gap-3">
            <AlertTriangle size={28} className="flex-shrink-0 mt-1" />
            <div>
              <h5 className="alert-heading mb-2">هشدار ریسک تمرکز دارایی</h5>
              {concentration.map((c) => (
                <p key={c.name} className="mb-1">
                  ⚠️ هشدار ریسک: بیش از ۶۰٪ از کل دارایی شما در کلاس{' '}
                  <strong>{c.name}</strong> ({formatPercent(c.percent)}) متمرکز شده است.
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
            <h5 className="chart-title">تخصیص دارایی</h5>
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
                      <span className="ms-auto fw-semibold">{formatPercent(item.percent)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted text-center py-5">دارایی‌ای ثبت نشده است.</p>
            )}
          </div>
        </div>

        <div className="col-lg-7">
          <div className="chart-card h-100">
            <h5 className="chart-title">رشد تاریخی ثروت</h5>
            <p className="text-muted small mb-3">روند تغییرات ارزش کل سبد (تومان)</p>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  tickFormatter={toPersianDigits}
                />
                <YAxis
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  tickFormatter={(v) => toPersianDigits((v / 1_000_000).toFixed(0)) + 'M'}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="ارزش کل"
                  stroke="#f0b429"
                  strokeWidth={3}
                  dot={{ fill: '#f0b429', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-muted small text-center mt-2 mb-0">
              نرخ دلار فعلی: {formatCurrency(prices.usdRate, '')} — معادل: $
              {formatNumber(usdEquivalent, 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
