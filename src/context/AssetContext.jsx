import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useCallback } from 'react';
import { generateId } from '../utils/format';
import { fetchLivePrices, FETCH_INTERVAL_MS } from '../services/tgjuApi';

const STORAGE_KEY = 'wealth-dashboard-v1';

export const DEFAULT_PRICES = {
  goldOunceGlobal: 3980,
  usdRate: 161500,
  gold18kPerGram: 16085200,
  gold18kBubble: 0,
};

const INITIAL_WEALTH_HISTORY = [
  { month: 'آبان ۱۴۰۳', total: 980_000_000 },
  { month: 'آذر ۱۴۰۳', total: 1_020_000_000 },
  { month: 'دی ۱۴۰۳', total: 1_050_000_000 },
  { month: 'بهمن ۱۴۰۳', total: 1_080_000_000 },
  { month: 'اسفند ۱۴۰۳', total: 1_120_000_000 },
  { month: 'فروردین ۱۴۰۴', total: 1_150_000_000 },
];

export const INITIAL_ASSET_CLASSES = [
  {
    id: 'class-auto',
    name: 'خودرو',
    items: [
      {
        id: 'item-auto-1',
        name: 'پژو ۲۰۷ MC',
        quantity: 1,
        unit: 'دستگاه',
        unitPrice: 850_000_000,
        autoPrice: false,
        priceSource: null,
      },
    ],
  },
  {
    id: 'class-gold',
    name: 'طلا',
    items: [
      {
        id: 'item-gold-1',
        name: 'طلای ۱۸ عیار',
        quantity: 50,
        unit: 'گرم',
        unitPrice: 0,
        autoPrice: true,
        priceSource: 'gold18k',
      },
    ],
  },
  {
    id: 'class-usd',
    name: 'دلار',
    items: [
      {
        id: 'item-usd-1',
        name: 'اسکناس دلار',
        quantity: 3000,
        unit: 'دلار',
        unitPrice: 0,
        autoPrice: true,
        priceSource: 'usd',
      },
    ],
  },
  {
    id: 'class-stocks',
    name: 'سهام',
    items: [
      {
        id: 'item-stock-1',
        name: 'فولاد مبارکه',
        quantity: 20_000,
        unit: 'سهم',
        unitPrice: 2_000,
        autoPrice: false,
        priceSource: null,
      },
    ],
  },
  {
    id: 'class-fixed',
    name: 'درآمد ثابت',
    items: [
      {
        id: 'item-fixed-1',
        name: 'صندوق لوتوس',
        quantity: 1_000,
        unit: 'واحد',
        unitPrice: 100_000,
        autoPrice: false,
        priceSource: null,
      },
    ],
  },
];

const defaultState = {
  theme: 'dark',
  currentPage: 'dashboard',
  prices: { ...DEFAULT_PRICES },
  priceFetchStatus: 'cached',
  lastSuccessfulFetch: null,
  assetClasses: INITIAL_ASSET_CLASSES,
  wealthHistory: INITIAL_WEALTH_HISTORY,
  expandedClasses: {},
  sidebarOpen: false,
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return {
      ...defaultState,
      ...parsed,
      priceFetchStatus: 'cached',
      priceFlash: {},
    };
  } catch {
    return defaultState;
  }
}

function persistState(state) {
  const { priceFlash, priceFetchStatus, ...toSave } = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

function buildPriceFlash(prev, next) {
  const flash = {};
  Object.keys(next).forEach((key) => {
    if (prev[key] !== next[key]) {
      flash[key] = next[key] > prev[key] ? 'up' : 'down';
    }
  });
  return flash;
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, currentPage: action.page, sidebarOpen: false };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'SET_PRICE_FETCH_STATUS':
      return { ...state, priceFetchStatus: action.status };
    case 'UPDATE_PRICES':
      return {
        ...state,
        prices: action.prices,
        priceFlash: action.flash || {},
        lastSuccessfulFetch: action.lastSuccessfulFetch ?? state.lastSuccessfulFetch,
      };
    case 'PRICE_FETCH_FAILED':
      return {
        ...state,
        priceFetchStatus: 'cached',
        priceFlash: {},
      };
    case 'TOGGLE_CLASS':
      return {
        ...state,
        expandedClasses: {
          ...state.expandedClasses,
          [action.classId]: !state.expandedClasses[action.classId],
        },
      };
    case 'ADD_ASSET_CLASS':
      return {
        ...state,
        assetClasses: [
          ...state.assetClasses,
          { id: generateId('class'), name: action.name, items: [] },
        ],
      };
    case 'DELETE_ASSET_CLASS':
      return {
        ...state,
        assetClasses: state.assetClasses.filter((c) => c.id !== action.classId),
      };
    case 'ADD_ITEM':
      return {
        ...state,
        assetClasses: state.assetClasses.map((c) =>
          c.id === action.classId
            ? { ...c, items: [...c.items, action.item] }
            : c
        ),
        expandedClasses: { ...state.expandedClasses, [action.classId]: true },
      };
    case 'UPDATE_ITEM':
      return {
        ...state,
        assetClasses: state.assetClasses.map((c) =>
          c.id === action.classId
            ? {
                ...c,
                items: c.items.map((item) =>
                  item.id === action.item.id ? action.item : item
                ),
              }
            : c
        ),
      };
    case 'DELETE_ITEM':
      return {
        ...state,
        assetClasses: state.assetClasses.map((c) =>
          c.id === action.classId
            ? { ...c, items: c.items.filter((i) => i.id !== action.itemId) }
            : c
        ),
      };
    case 'IMPORT_STATE':
      return {
        ...defaultState,
        ...action.payload,
        priceFetchStatus: 'cached',
        priceFlash: {},
      };
    case 'UPDATE_WEALTH_HISTORY':
      return { ...state, wealthHistory: action.history };
    default:
      return state;
  }
}

const AssetContext = createContext(null);

/** محاسبه قیمت واحد با توجه به منبع قیمت زنده */
export function resolveUnitPrice(item, prices) {
  if (item.autoPrice && item.priceSource === 'gold18k') {
    const bubbleMultiplier = 1 + (prices.gold18kBubble || 0) / 100;
    return Math.round(prices.gold18kPerGram * bubbleMultiplier);
  }
  if (item.autoPrice && item.priceSource === 'usd') {
    return prices.usdRate;
  }
  return item.unitPrice || 0;
}

export function AssetProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    persistState(state);
    document.documentElement.setAttribute('data-bs-theme', state.theme);
  }, [state]);

  // دریافت نرخ زنده از TGJU — هر ۱ دقیقه
  useEffect(() => {
    let cancelled = false;
    let flashTimer;

    const pullPrices = async () => {
      dispatch({ type: 'SET_PRICE_FETCH_STATUS', status: 'loading' });

      try {
        const next = await fetchLivePrices();
        if (cancelled) return;

        const current = stateRef.current.prices;
        const flash = buildPriceFlash(current, next);

        dispatch({
          type: 'UPDATE_PRICES',
          prices: next,
          flash,
          lastSuccessfulFetch: new Date().toISOString(),
        });
        dispatch({ type: 'SET_PRICE_FETCH_STATUS', status: 'live' });

        flashTimer = setTimeout(() => {
          if (!cancelled) {
            dispatch({
              type: 'UPDATE_PRICES',
              prices: next,
              flash: {},
              lastSuccessfulFetch: stateRef.current.lastSuccessfulFetch,
            });
          }
        }, 800);
      } catch {
        if (cancelled) return;
        dispatch({ type: 'PRICE_FETCH_FAILED' });
      }
    };

    pullPrices();
    const interval = setInterval(pullPrices, FETCH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(flashTimer);
    };
  }, []);

  const prices = state.prices;

  const getItemTotal = useCallback(
    (item) => {
      const unit = resolveUnitPrice(item, prices);
      return unit * (Number(item.quantity) || 0);
    },
    [prices]
  );

  const portfolioSummary = useMemo(() => {
    const classTotals = state.assetClasses.map((assetClass) => {
      const items = assetClass.items.map((item) => ({
        ...item,
        effectiveUnitPrice: resolveUnitPrice(item, prices),
        total: getItemTotal(item),
      }));
      const total = items.reduce((sum, i) => sum + i.total, 0);
      return { ...assetClass, items, total };
    });

    const portfolioTotal = classTotals.reduce((sum, c) => sum + c.total, 0);

    const withPercent = classTotals.map((c) => ({
      ...c,
      percent: portfolioTotal > 0 ? (c.total / portfolioTotal) * 100 : 0,
      items: c.items.map((item) => ({
        ...item,
        percent: portfolioTotal > 0 ? (item.total / portfolioTotal) * 100 : 0,
      })),
    }));

    const goldTotal = withPercent.find((c) => c.name === 'طلا')?.total || 0;
    const liquidTotal =
      (withPercent.find((c) => c.name === 'دلار')?.total || 0) +
      (withPercent.find((c) => c.name === 'درآمد ثابت')?.total || 0);

    const allocation = withPercent
      .filter((c) => c.total > 0)
      .map((c) => ({ name: c.name, value: c.total, percent: c.percent }));

    const concentration = withPercent
      .filter((c) => c.percent > 60)
      .map((c) => ({ name: c.name, percent: c.percent }));

    const usdEquivalent =
      prices.usdRate > 0 ? portfolioTotal / prices.usdRate : 0;

    return {
      classTotals: withPercent,
      portfolioTotal,
      goldTotal,
      liquidTotal,
      allocation,
      concentration,
      usdEquivalent,
    };
  }, [state.assetClasses, prices, getItemTotal]);

  useEffect(() => {
    const total = portfolioSummary.portfolioTotal;
    if (total <= 0) return;

    const history = [...state.wealthHistory];
    if (history.length === 0) {
      dispatch({ type: 'UPDATE_WEALTH_HISTORY', history: [{ month: 'امروز', total }] });
      return;
    }

    const last = history[history.length - 1];
    if (Math.abs(last.total - total) > total * 0.001) {
      history[history.length - 1] = { ...last, total };
      dispatch({ type: 'UPDATE_WEALTH_HISTORY', history });
    }
  }, [portfolioSummary.portfolioTotal]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(
    () => ({
      state,
      dispatch,
      prices,
      portfolioSummary,
      getItemTotal,
      resolveUnitPrice: (item) => resolveUnitPrice(item, prices),
      exportFullState: () => {
        const { priceFlash, priceFetchStatus, sidebarOpen, ...rest } = state;
        return rest;
      },
    }),
    [state, prices, portfolioSummary, getItemTotal]
  );

  return <AssetContext.Provider value={value}>{children}</AssetContext.Provider>;
}

export function useAssets() {
  const ctx = useContext(AssetContext);
  if (!ctx) throw new Error('useAssets must be used within AssetProvider');
  return ctx;
}
