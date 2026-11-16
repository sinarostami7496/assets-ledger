import { useCallback, useEffect, useRef } from 'react';
import { PIN_LENGTH } from '../utils/pin';

function digitsFromValue(value) {
  const arr = Array(PIN_LENGTH).fill('');
  const safe = String(value ?? '').replace(/\D/g, '').slice(0, PIN_LENGTH);
  for (let i = 0; i < safe.length; i += 1) {
    arr[i] = safe[i];
  }
  return arr;
}

export default function PinDigitInput({
  id,
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  onComplete,
}) {
  const inputRefs = useRef([]);

  const focusAt = useCallback((index) => {
    if (index < 0 || index >= PIN_LENGTH) return;
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  }, []);

  useEffect(() => {
    if (autoFocus) {
      focusAt(0);
    }
  }, [autoFocus, focusAt]);

  useEffect(() => {
    if (value === '') {
      focusAt(0);
    }
  }, [value, focusAt]);

  const handleChange = (index, event) => {
    const raw = event.target.value.replace(/\D/g, '');
    const arr = digitsFromValue(value);

    if (!raw) {
      arr[index] = '';
      onChange(arr.join(''));
      return;
    }

    const digit = raw.slice(-1);
    arr[index] = digit;
    const pin = arr.join('');

    onChange(pin);

    if (index < PIN_LENGTH - 1) {
      focusAt(index + 1);
    } else if (pin.length === PIN_LENGTH && onComplete) {
      onComplete(pin);
    }
  };

  const handleKeyDown = (index, event) => {
    const arr = digitsFromValue(value);

    if (event.key === 'Backspace') {
      if (arr[index]) {
        arr[index] = '';
        onChange(arr.join(''));
        return;
      }
      if (index > 0) {
        event.preventDefault();
        arr[index - 1] = '';
        onChange(arr.join(''));
        focusAt(index - 1);
      }
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusAt(index - 1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
    onChange(pasted);
    focusAt(Math.min(pasted.length, PIN_LENGTH - 1));
    if (pasted.length === PIN_LENGTH && onComplete) {
      onComplete(pasted);
    }
  };

  const digits = digitsFromValue(value);

  return (
    <div className="pin-digit-group" id={id}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          className="form-control pin-digit-box"
          value={digit}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={index === 0 ? handlePaste : undefined}
          disabled={disabled}
          autoComplete="off"
          aria-label={`رقم ${index + 1} از ${PIN_LENGTH}`}
        />
      ))}
    </div>
  );
}