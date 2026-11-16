import { useState } from 'react';
import { Lock, Trash2, KeyRound } from 'lucide-react';
import { useAssets } from '../context/AssetContext';
import { isValidPinFormat, PIN_LENGTH, verifyPin } from '../utils/pin';
import PinDigitInput from './PinDigitInput';

function PinField({ id, label, value, onChange, disabled }) {
  return (
    <div className="mb-3">
      <label className="form-label small mb-2" htmlFor={id}>
        {label}
      </label>
      <PinDigitInput id={id} value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
}

export default function PinSettings() {
  const { state, setupPinLock, removePinLock, lockApp } = useAssets();
  const pinActive = state.pinLock?.enabled;

  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [removePin, setRemovePin] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const resetForms = () => {
    setNewPin('');
    setConfirmPin('');
    setCurrentPin('');
    setRemovePin('');
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!isValidPinFormat(newPin)) {
      setError(`پین باید ${PIN_LENGTH} رقم باشد.`);
      return;
    }
    if (newPin !== confirmPin) {
      setError('پین و تکرار آن یکسان نیستند.');
      return;
    }

    setBusy(true);
    try {
      await setupPinLock(newPin);
      resetForms();
      setMessage('قفل پین فعال شد. از این پس هنگام باز کردن برنامه قفل نمایش داده می‌شود.');
    } catch {
      setError('فعال‌سازی قفل پین ممکن نشد.');
    } finally {
      setBusy(false);
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!isValidPinFormat(currentPin) || !isValidPinFormat(newPin)) {
      setError(`پین باید ${PIN_LENGTH} رقم باشد.`);
      return;
    }
    if (newPin !== confirmPin) {
      setError('پین جدید و تکرار آن یکسان نیستند.');
      return;
    }

    const ok = await verifyPin(currentPin, state.pinLock.salt, state.pinLock.hash);
    if (!ok) {
      setError('پین فعلی نادرست است.');
      return;
    }

    setBusy(true);
    try {
      await setupPinLock(newPin);
      resetForms();
      setMessage('پین با موفقیت تغییر کرد.');
    } catch {
      setError('تغییر پین ممکن نشد.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!isValidPinFormat(removePin)) {
      setError(`پین باید ${PIN_LENGTH} رقم باشد.`);
      return;
    }

    const ok = await verifyPin(removePin, state.pinLock.salt, state.pinLock.hash);
    if (!ok) {
      setError('پین نادرست است.');
      return;
    }

    setBusy(true);
    try {
      removePinLock();
      resetForms();
      setMessage('قفل پین غیرفعال شد.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="settings-card pin-settings-card">
      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
        <Lock size={22} className="text-primary" />
        <h5 className="mb-0">قفل پین محلی</h5>
        {pinActive && <span className="badge text-bg-success">فعال</span>}
      </div>
      <p className="text-muted small mb-3">
        پین فقط روی این دستگاه ذخیره می‌شود (هش امن، نه متن خام). با خروج از تب یا دکمهٔ قفل،
        دوباره پین لازم است.
      </p>

      {pinActive && (
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm mb-3"
          onClick={() => lockApp()}
        >
          قفل کردن اکنون
        </button>
      )}

      {message && <p className="text-success small">{message}</p>}
      {error && (
        <p className="text-danger small" role="alert">
          {error}
        </p>
      )}

      {!pinActive ? (
        <form onSubmit={handleSetup}>
          <PinField
            id="pin-new"
            label="پین جدید"
            value={newPin}
            onChange={setNewPin}
            disabled={busy}
          />
          <PinField
            id="pin-confirm"
            label="تکرار پین"
            value={confirmPin}
            onChange={setConfirmPin}
            disabled={busy}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
            <KeyRound size={16} className="me-1" />
            فعال‌سازی قفل پین
          </button>
        </form>
      ) : (
        <div className="row g-3">
          <div className="col-md-6">
            <h6 className="fw-semibold small">تغییر پین</h6>
            <form onSubmit={handleChange}>
              <PinField
                id="pin-current"
                label="پین فعلی"
                value={currentPin}
                onChange={setCurrentPin}
                disabled={busy}
              />
              <PinField
                id="pin-new-change"
                label="پین جدید"
                value={newPin}
                onChange={setNewPin}
                disabled={busy}
              />
              <PinField
                id="pin-confirm-change"
                label="تکرار پین جدید"
                value={confirmPin}
                onChange={setConfirmPin}
                disabled={busy}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
                ذخیره پین جدید
              </button>
            </form>
          </div>
          <div className="col-md-6">
            <h6 className="fw-semibold small text-danger">غیرفعال‌سازی</h6>
            <form onSubmit={handleRemove}>
              <PinField
                id="pin-remove"
                label="پین فعلی برای تأیید"
                value={removePin}
                onChange={setRemovePin}
                disabled={busy}
              />
              <button type="submit" className="btn btn-outline-danger btn-sm" disabled={busy}>
                <Trash2 size={16} className="me-1" />
                حذف قفل پین
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}