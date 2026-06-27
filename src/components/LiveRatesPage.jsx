import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { useAssets } from '../context/AssetContext';
import { formatCurrency, formatLastUpdate, formatPercent } from '../utils/format';
import { RATE_ROWS, buildRateRowMetrics } from '../utils/goldCalculations';

function BubbleCell({ value }) {
  if (value === 0) {
    return <span className="rates-bubble rates-bubble-neutral">{formatPercent(0)}</span>;
  }

  const isPositive = value > 0;
  return (
    <span className={`rates-bubble ${isPositive ? 'rates-bubble-up' : 'rates-bubble-down'}`}>
      {isPositive ? '+' : ''}
      {formatPercent(value)}
    </span>
  );
}

function RatesTableRow({ row, prices}) {
  const metrics = useMemo(() => buildRateRowMetrics(prices, row), [prices, row]);

  return (
    <tr>
      <th scope="row" className="rates-label-cell">
        {row.label}
      </th>
      <td className="rates-value-cell">{formatCurrency(metrics.latestPrice, '')}</td>
      <td className="rates-value-cell">{formatCurrency(metrics.intrinsicValue, '')}</td>
      <td className="rates-value-cell dir-ltr">
        <BubbleCell value={metrics.bubble} />
      </td>
      <td className="rates-value-cell">{formatCurrency(metrics.impliedUsd, '')}</td>
    </tr>
  );
}

function RatesMobileCard({ row, prices}) {
  const metrics = useMemo(() => buildRateRowMetrics(prices, row), [prices, row]);

  return (
    <article className="rates-mobile-card">
      <h3 className="rates-mobile-title">{row.label}</h3>
      <dl className="rates-mobile-grid">
        <div className="rates-mobile-item">
          <dt>آخرین قیمت</dt>
          <dd>{formatCurrency(metrics.latestPrice, '')}</dd>
        </div>
        <div className="rates-mobile-item">
          <dt>ارزش ذاتی</dt>
          <dd>{formatCurrency(metrics.intrinsicValue, '')}</dd>
        </div>
        <div className="rates-mobile-item">
          <dt>حباب</dt>
          <dd>
            <BubbleCell value={metrics.bubble} />
          </dd>
        </div>
        <div className="rates-mobile-item">
          <dt>دلار محاسباتی</dt>
          <dd>{formatCurrency(metrics.impliedUsd, '')}</dd>
        </div>
      </dl>
    </article>
  );
}

export default function LiveRatesPage() {
  const { prices, state } = useAssets();

  const lastUpdate = formatLastUpdate(state.lastSuccessfulFetch);

  return (
    <div className="page live-rates-page">
      <div className="page-header">
        <h2>
          <TrendingUp size={26} className="page-header-icon" aria-hidden="true" />
          نرخ لحظه‌ای ارز و طلا
        </h2>
        <p className="text-muted mb-0">مقایسه قیمت بازار با ارزش ذاتی و دلار محاسباتی</p>
      </div>

      {lastUpdate && (
        <p className="rates-last-update" aria-live="polite">
          {lastUpdate}
        </p>
      )}

      <div className="rates-table-wrap d-none d-md-block">
        <div className="table-responsive">
          <table className="table ledger-table rates-table">
            <thead>
              <tr>
                <th scope="col">طلا و سکه</th>
                <th scope="col">آخرین قیمت</th>
                <th scope="col">ارزش ذاتی</th>
                <th scope="col">حباب</th>
                <th scope="col">دلار محاسباتی</th>
              </tr>
            </thead>
            <tbody>
              {RATE_ROWS.map((row) => (
                <RatesTableRow
                  key={row.id}
                  row={row}
                  prices={prices}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rates-mobile-list d-md-none">
        {RATE_ROWS.map((row) => (
          <RatesMobileCard
            key={row.id}
            row={row}
            prices={prices}
          />
        ))}
      </div>
    </div>
  );
}
