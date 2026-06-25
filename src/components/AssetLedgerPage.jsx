import { Fragment, useMemo, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import Select from 'react-select';
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  Calculator,
} from 'lucide-react';
import { useAssets } from '../context/AssetContext';
import { formatCurrency, formatNumber, formatPercent, generateId } from '../utils/format';

const UNIT_OPTIONS = ['سهم', 'عدد', 'گرم', 'دلار', 'واحد', 'دستگاه'].map((unit) => ({
  value: unit,
  label: unit,
}));

function getUnitOptions(currentUnit) {
  if (!currentUnit || UNIT_OPTIONS.some((option) => option.value === currentUnit)) {
    return UNIT_OPTIONS;
  }
  return [...UNIT_OPTIONS, { value: currentUnit, label: currentUnit }];
}

const EMPTY_ITEM_FORM = {
  name: '',
  quantity: '',
  unit: 'عدد',
  unitPrice: '',
  autoPrice: false,
  priceSource: null,
};

const DEFAULT_CLASS_SORT = { key: 'percent', direction: 'desc' };

function compareClassRows(a, b, sortKey, direction) {
  const aValue = Number(a[sortKey]) || 0;
  const bValue = Number(b[sortKey]) || 0;
  if (aValue !== bValue) {
    return direction === 'asc' ? aValue - bValue : bValue - aValue;
  }
  return a.name.localeCompare(b.name, 'fa');
}

function SortableColumnHeader({ label, sortKey, sortConfig, onSort }) {
  const isActive = sortConfig.key === sortKey;

  return (
    <th>
      <button
        type="button"
        className={`ledger-sort-btn${isActive ? ' is-active' : ''}`}
        onClick={() => onSort(sortKey)}
        aria-sort={
          isActive ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'
        }
      >
        <span>{label}</span>
        {isActive && (
          <span className="ledger-sort-icon" aria-hidden="true">
            {sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        )}
      </button>
    </th>
  );
}

export default function AssetLedgerPage() {
  const { state, dispatch, portfolioSummary, prices, resolveUnitPrice } = useAssets();
  const [newClassName, setNewClassName] = useState('');
  const [addingToClass, setAddingToClass] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM_FORM);
  const [classSort, setClassSort] = useState(DEFAULT_CLASS_SORT);
  const unitOptions = useMemo(() => getUnitOptions(itemForm.unit), [itemForm.unit]);
  const selectedUnit = useMemo(
    () => unitOptions.find((option) => option.value === itemForm.unit) ?? UNIT_OPTIONS[1],
    [itemForm.unit, unitOptions],
  );

  const resetItemForm = () => {
    setItemForm(EMPTY_ITEM_FORM);
    setAddingToClass(null);
    setEditingItem(null);
  };

  const openAddItem = (classId, priceSource = null) => {
    setAddingToClass(classId);
    setEditingItem(null);
    setItemForm({
      ...EMPTY_ITEM_FORM,
      autoPrice: !!priceSource,
      priceSource,
      unit: priceSource === 'gold18k' ? 'گرم' : priceSource === 'usdt' ? 'USDT' : 'عدد',
    });
  };

  const openEditItem = (classId, item) => {
    setEditingItem({ classId, item });
    setAddingToClass(null);
    setItemForm({
      name: item.name,
      quantity: String(item.quantity),
      unit: item.unit,
      unitPrice: item.autoPrice ? '' : String(item.unitPrice),
      autoPrice: item.autoPrice,
      priceSource: item.priceSource,
    });
  };

  const handleSaveItem = (classId) => {
    if (!itemForm.name.trim() || !itemForm.quantity) return;

    const item = {
      id: editingItem?.item.id || generateId('item'),
      name: itemForm.name.trim(),
      quantity: Number(itemForm.quantity),
      unit: itemForm.unit,
      unitPrice: itemForm.autoPrice ? 0 : Number(itemForm.unitPrice) || 0,
      autoPrice: itemForm.autoPrice,
      priceSource: itemForm.autoPrice ? itemForm.priceSource : null,
    };

    if (editingItem) {
      dispatch({ type: 'UPDATE_ITEM', classId, item });
    } else {
      dispatch({ type: 'ADD_ITEM', classId, item });
    }
    resetItemForm();
  };

  const handleAddClass = (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    dispatch({ type: 'ADD_ASSET_CLASS', name: newClassName.trim() });
    setNewClassName('');
  };

  const { classTotals, portfolioTotal } = portfolioSummary;

  const sortedClassTotals = useMemo(
    () =>
      [...classTotals].sort((a, b) =>
        compareClassRows(a, b, classSort.key, classSort.direction),
      ),
    [classTotals, classSort],
  );

  const handleClassSort = (sortKey) => {
    setClassSort((current) => {
      if (current.key === sortKey) {
        return {
          key: sortKey,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key: sortKey, direction: 'desc' };
    });
  };

  return (
    <div className="page ledger-page">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3">
        <div>
          <h2>💼 مدیریت دارایی‌ها</h2>
          <p className="text-muted mb-0">ثبت، ویرایش و پیگیری جزئیات دارایی‌ها</p>
        </div>
      </div>

      <div className="card ledger-form-card mb-4">
        <div className="card-body">
          <h6 className="card-subtitle mb-3">افزودن کلاس دارایی جدید</h6>
          <form className="row g-2 align-items-end" onSubmit={handleAddClass}>
            <div className="col-md-8">
              <label className="form-label small">نام کلاس (مثلاً زمین، کریپتو)</label>
              <input
                type="text"
                className="form-control"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="نام کلاس دارایی..."
              />
            </div>
            <div className="col-md-4">
              <button type="submit" className="btn btn-primary w-100">
                <Plus size={16} className="me-1" />
                افزودن کلاس
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="table-responsive ledger-table-wrap">
        <table className="table ledger-table align-middle">
          <thead>
            <tr>
              <th style={{ width: 40 }} />
              <th>نام دارایی/زیرآیتم</th>
              <th>مقدار / تعداد</th>
              <th>واحد</th>
              <th>ارزش واحد (تومان)</th>
              <SortableColumnHeader
                label="ارزش کل (تومان)"
                sortKey="total"
                sortConfig={classSort}
                onSort={handleClassSort}
              />
              <SortableColumnHeader
                label="درصد از کل ثروت"
                sortKey="percent"
                sortConfig={classSort}
                onSort={handleClassSort}
              />
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {sortedClassTotals.map((assetClass) => {
              const expanded = state.expandedClasses[assetClass.id] !== false;
              const hasItems = assetClass.items.length > 0;

              return (
                <Fragment key={assetClass.id}>
                  <tr
                    className="class-row"
                    onClick={() =>
                      hasItems && dispatch({ type: 'TOGGLE_CLASS', classId: assetClass.id })
                    }
                    role={hasItems ? 'button' : undefined}
                  >
                    <td>
                      {hasItems && (
                        expanded ? <ChevronDown size={18} /> : <ChevronLeft size={18} />
                      )}
                    </td>
                    <td className="fw-bold">{assetClass.name}</td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                    <td className="fw-semibold">{formatCurrency(assetClass.total)}</td>
                    <td>{formatPercent(assetClass.percent)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          title="افزودن زیرآیتم"
                          onClick={() => openAddItem(assetClass.id)}
                        >
                          <Plus size={14} />
                        </button>
                        {assetClass.name === 'طلا' && (
                          <button
                            type="button"
                            className="btn btn-outline-warning"
                            title="افزودن با قیمت خودکار طلا"
                            onClick={() => openAddItem(assetClass.id, 'gold18k')}
                          >
                            <Calculator size={14} />
                          </button>
                        )}
                        {(assetClass.name === 'USDT' || assetClass.name === 'دلار') && (
                          <button
                            type="button"
                            className="btn btn-outline-success"
                            title="افزودن با نرخ USDT"
                            onClick={() => openAddItem(assetClass.id, 'usdt')}
                          >
                            <Calculator size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          title="حذف کلاس"
                          onClick={() => {
                            if (window.confirm(`کلاس «${assetClass.name}» حذف شود؟`)) {
                              dispatch({ type: 'DELETE_ASSET_CLASS', classId: assetClass.id });
                            }
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expanded &&
                    assetClass.items.map((item) => (
                      <tr key={item.id} className="item-row">
                        <td />
                        <td className="ps-4">{item.name}</td>
                        <td>{formatNumber(item.quantity)}</td>
                        <td>{item.unit}</td>
                        <td>
                          {item.autoPrice ? (
                            <span className="badge bg-info-subtle text-info-emphasis">
                              خودکار: {formatCurrency(resolveUnitPrice(item))}
                            </span>
                          ) : (
                            formatCurrency(item.unitPrice)
                          )}
                        </td>
                        <td>{formatCurrency(item.total)}</td>
                        <td>{formatPercent(item.percent)}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => openEditItem(assetClass.id, item)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => {
                                if (window.confirm(`«${item.name}» حذف شود؟`)) {
                                  dispatch({
                                    type: 'DELETE_ITEM',
                                    classId: assetClass.id,
                                    itemId: item.id,
                                  });
                                }
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </Fragment>
              );
            })}

            <tr className="grand-total-row">
              <td colSpan={5} className="text-end fw-bold fs-5">
                جمع کل دارایی‌ها
              </td>
              <td className="fw-bold fs-5 text-primary">{formatCurrency(portfolioTotal)}</td>
              <td>{formatPercent(portfolioTotal > 0 ? 100 : 0, 0)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      {(addingToClass || editingItem) && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingItem ? 'ویرایش دارایی' : 'افزودن زیرآیتم'}
                </h5>
                <button type="button" className="btn-close" onClick={resetItemForm} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">نام دارایی</label>
                  <input
                    type="text"
                    className="form-control"
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  />
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label">مقدار / تعداد</label>
                    <input
                      type="number"
                      className="form-control"
                      value={itemForm.quantity}
                      onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                      min="0"
                      step="any"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">واحد</label>
                    <Select
                      classNamePrefix="unit-select"
                      inputId="item-unit"
                      options={unitOptions}
                      value={selectedUnit}
                      onChange={(option) =>
                        setItemForm({ ...itemForm, unit: option?.value ?? 'عدد' })
                      }
                      isSearchable={false}
                      placeholder="انتخاب واحد..."
                    />
                  </div>
                </div>

                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="autoPriceCheck"
                    checked={itemForm.autoPrice}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        autoPrice: e.target.checked,
                        priceSource: e.target.checked ? itemForm.priceSource || 'gold18k' : null,
                      })
                    }
                  />
                  <label className="form-check-label" htmlFor="autoPriceCheck">
                    محاسبه خودکار قیمت از نرخ زنده
                  </label>
                </div>

                {itemForm.autoPrice ? (
                  <div className="mb-3">
                    <label className="form-label">منبع قیمت</label>
                    <select
                      className="form-select"
                      value={itemForm.priceSource || 'gold18k'}
                      onChange={(e) =>
                        setItemForm({
                          ...itemForm,
                          priceSource: e.target.value,
                          unit:
                            e.target.value === 'gold18k'
                              ? 'گرم'
                              : e.target.value === 'usdt'
                                ? 'USDT'
                                : itemForm.unit,
                        })
                      }
                    >
                      <option value="gold18k">طلای ۱۸ عیار (گرم)</option>
                      <option value="usdt">نرخ USDT</option>
                    </select>
                    <small className="text-muted">
                      نرخ فعلی:{' '}
                      {itemForm.priceSource === 'usdt' || itemForm.priceSource === 'usd'
                        ? formatCurrency(prices.usdtRate)
                        : formatCurrency(resolveUnitPrice({ autoPrice: true, priceSource: 'gold18k', unitPrice: 0 }))}
                    </small>
                  </div>
                ) : (
                  <div className="mb-3">
                    <label className="form-label">ارزش واحد (تومان)</label>
                    <NumericFormat
                      className="form-control"
                      value={itemForm.unitPrice}
                      onValueChange={({ value }) =>
                        setItemForm({ ...itemForm, unitPrice: value })
                      }
                      thousandSeparator=","
                      allowNegative={false}
                      decimalScale={0}
                      inputMode="numeric"
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={resetItemForm}>
                  انصراف
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    handleSaveItem(editingItem ? editingItem.classId : addingToClass)
                  }
                >
                  ذخیره
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
