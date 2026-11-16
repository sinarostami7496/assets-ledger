import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAssets } from '../context/AssetContext';
import { isValidPinFormat, PIN_LENGTH } from '../utils/pin';
import PinDigitInput from './PinDigitInput';

export default function PinLockOverlay() {
  const { unlockWithPin } = useAssets();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const tryUnlock = async (candidate) => {
    if (submitting || !isValidPinFormat(candidate)) return;

    setError('');
    setSubmitting(true);
    try {
      const ok = await unlockWithPin(candidate);
      if (!ok) {
        setError('پین نادرست است.');
        setPin('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await tryUnlock(pin);
  };

  return (
    <div className="pin-lock-overlay" role="dialog" aria-modal="true" aria-labelledby="pin-lock-title">
      <div className="pin-lock-card">
        <div className="pin-lock-icon">
          <Lock size={36} strokeWidth={1.75} />
        </div>
        <h2 id="pin-lock-title" className="pin-lock-title">
          قفل برنامه
        </h2>
        <p className="text-muted small text-center mb-3">
          برای دسترسی به داشبورد، پین {PIN_LENGTH} رقمی را وارد کنید.
        </p>
        <form onSubmit={handleSubmit}>
          <PinDigitInput
            id="pin-lock-digits"
            value={pin}
            onChange={setPin}
            disabled={submitting}
            autoFocus
            onComplete={tryUnlock}
          />
          {error && (
            <p className="text-danger small text-center mt-2 mb-0" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn btn-primary w-100 mt-3"
            disabled={submitting || pin.length < PIN_LENGTH}
          >
            {submitting ? 'در حال بررسی...' : 'باز کردن قفل'}
          </button>
        </form>
      </div>
    </div>
  );
}