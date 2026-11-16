import { useEffect, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import { Bell, Save } from 'lucide-react';
import { useAssets } from '../context/AssetContext';
import { RATE_ROWS } from '../utils/goldCalculations';
import {
  PRICE_ALERT_DEFS,
  createDefaultRateAlertSettings,
  migrateRateAlertSettings,
} from '../utils/rateAlerts';

function cloneSettings(settings) {
  return JSON.parse(JSON.stringify(settings));
}

export default function RateAlertSettings() {
  const { state, dispatch } = useAssets();
  const [draft, setDraft] = useState(() =>
    cloneSettings(migrateRateAlertSettings(state.rateAlertSettings))
  );

  useEffect(() => {
    setDraft(cloneSettings(migrateRateAlertSettings(state.rateAlertSettings)));
  }, [state.rateAlertSettings]);

  const savedEnabled = state.rateAlertSettings?.enabled !== false;

  const updateBubble = (rowId, patch) => {
    setDraft((prev) => ({
      ...prev,
      bubbles: {
        ...prev.bubbles,
        [rowId]: { ...prev.bubbles[rowId], ...patch },
      },
    }));
  };

  const updatePriceRule = (priceId, patch) => {
    setDraft((prev) => ({
      ...prev,
      prices: {
        ...prev.prices,
        [priceId]: { ...prev.prices[priceId], ...patch },
      },
    }));
  };

  const save = () => {
    dispatch({ type: 'SET_RATE_ALERT_SETTINGS', rateAlertSettings: migrateRateAlertSettings(draft) });
  };

  const resetDefaults = () => {
    setDraft(cloneSettings(createDefaultRateAlertSettings()));
  };

  return (
    <div className="settings-card rate-alert-settings-card">
      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
        <Bell size={22} className="text-info" />
        <h5 className="mb-0">هشدار حباب و نرخ</h5>
        {savedEnabled && <span className="badge text-bg-success">فعال</span>}
      </div>
      <p className="text-muted small mb-3">
        وقتی حباب یا نرخ از آستانه عبور کند، در پیشخوان و صفحهٔ نرخ لحظه‌ای هشدار نمایش داده
        می‌شود. فیلد خالی یعنی آن سمت آستانه غیرفعال است.
      </p>

      <div className="form-check form-switch mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="rate-alerts-master"
          checked={draft.enabled}
          onChange={(e) => setDraft((prev) => ({ ...prev, enabled: e.target.checked }))}
        />
        <label className="form-check-label" htmlFor="rate-alerts-master">
          فعال‌سازی هشدارها
        </label>
      </div>

      <h6 className="fw-semibold mb-2">حباب (درصد نسبت به ارزش ذاتی)</h6>
      <div className="table-responsive mb-4">
        <table className="table table-sm rate-alert-table mb-0">
          <thead>
            <tr>
              <th>فعال</th>
              <th>نوع</th>
              <th className="cell-ltr">آستانه بالا (٪)</th>
              <th className="cell-ltr">آستانه پایین (٪)</th>
            </tr>
          </thead>
          <tbody>
            {RATE_ROWS.map((row) => {
              const rule = draft.bubbles[row.id];
              return (
                <tr key={row.id}>
                  <td>
                    <input
                      type="checkbox"
                      className="form-check-input m-0"
                      checked={!!rule.enabled}
                      onChange={(e) => updateBubble(row.id, { enabled: e.target.checked })}
                      aria-label={`فعال‌سازی هشدار ${row.label}`}
                    />
                  </td>
                  <td>{row.label}</td>
                  <td className="cell-ltr">
                    <NumericFormat
                      className="form-control form-control-sm rate-threshold-input"
                      value={rule.highPercent ?? ''}
                      onValueChange={({ value }) =>
                        updateBubble(row.id, { highPercent: value === '' ? null : value })
                      }
                      decimalScale={1}
                      allowNegative={false}
                      disabled={!rule.enabled}
                    />
                  </td>
                  <td className="cell-ltr">
                    <NumericFormat
                      className="form-control form-control-sm rate-threshold-input"
                      value={rule.lowPercent ?? ''}
                      onValueChange={({ value }) =>
                        updateBubble(row.id, { lowPercent: value === '' ? null : value })
                      }
                      decimalScale={1}
                      allowNegative
                      disabled={!rule.enabled}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h6 className="fw-semibold mb-2">نرخ مستقیم</h6>
      <div className="table-responsive mb-3">
        <table className="table table-sm rate-alert-table mb-0">
          <thead>
            <tr>
              <th>فعال</th>
              <th>نرخ</th>
              <th className="cell-ltr">آستانه بالا</th>
              <th className="cell-ltr">آستانه پایین</th>
            </tr>
          </thead>
          <tbody>
            {PRICE_ALERT_DEFS.map((def) => {
              const rule = draft.prices[def.id];
              return (
                <tr key={def.id}>
                  <td>
                    <input
                      type="checkbox"
                      className="form-check-input m-0"
                      checked={!!rule.enabled}
                      onChange={(e) => updatePriceRule(def.id, { enabled: e.target.checked })}
                      aria-label={`فعال‌سازی هشدار ${def.label}`}
                    />
                  </td>
                  <td>
                    {def.label}
                    <span className="text-muted small d-block">{def.unit}</span>
                  </td>
                  <td className="cell-ltr">
                    <NumericFormat
                      className="form-control form-control-sm rate-threshold-input rate-threshold-wide"
                      value={rule.high ?? ''}
                      onValueChange={({ value }) =>
                        updatePriceRule(def.id, { high: value === '' ? null : value })
                      }
                      thousandSeparator=","
                      decimalScale={def.unit === 'دلار' ? 2 : 0}
                      allowNegative={false}
                      disabled={!rule.enabled}
                    />
                  </td>
                  <td className="cell-ltr">
                    <NumericFormat
                      className="form-control form-control-sm rate-threshold-input rate-threshold-wide"
                      value={rule.low ?? ''}
                      onValueChange={({ value }) =>
                        updatePriceRule(def.id, { low: value === '' ? null : value })
                      }
                      thousandSeparator=","
                      decimalScale={def.unit === 'دلار' ? 2 : 0}
                      allowNegative={false}
                      disabled={!rule.enabled}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="d-flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary btn-sm" onClick={save}>
          <Save size={16} className="me-1" />
          ذخیره هشدارها
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={resetDefaults}>
          بازنشانی پیش‌فرض
        </button>
      </div>
    </div>
  );
}