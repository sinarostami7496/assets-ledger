import { useCallback } from 'react';
import { useAssets } from '../context/AssetContext';
import { formatCurrency, formatNumber, formatPercent } from '../utils/format';

export const MASKED_VALUE = '••••';

export function maskSensitiveValue(showPrices, display) {
  return showPrices ? display : MASKED_VALUE;
}

export function useSensitiveDisplay() {
  const { state } = useAssets();
  const showPrices = state.showPrices !== false;

  const mask = useCallback(
    (display) => maskSensitiveValue(showPrices, display),
    [showPrices],
  );

  const displayCurrency = useCallback(
    (amount, suffix = ' تومان') => mask(formatCurrency(amount, suffix)),
    [mask],
  );

  const displayNumber = useCallback(
    (value, decimals = 0) => mask(formatNumber(value, decimals)),
    [mask],
  );

  const displayPercent = useCallback(
    (value, decimals = 1) => mask(formatPercent(value, decimals)),
    [mask],
  );

  return {
    showPrices,
    mask,
    displayCurrency,
    displayNumber,
    displayPercent,
  };
}
