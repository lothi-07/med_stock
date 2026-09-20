import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  CheckCircle,
  Plus,
  Minus,
  Sparkles,
  AlertCircle,
  Receipt,
  User,
  Package,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { medicineService, batchService, billingService, alertService } from '../services/api';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { ExpiryBadge, FEFOBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export const BillingPage = () => {
  const { user } = useAuth();

  // Search & Selector State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [itemDiscount, setItemDiscount] = useState(0);

  // Cart State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [overallDiscount, setOverallDiscount] = useState(0);

  // Modals & Feedback
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [completedBill, setCompletedBill] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await medicineService.search(searchQuery.trim());
        setSearchResults(results || []);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [searchQuery]);

  // When medicine is selected, fetch batches & pick FEFO
  const handleSelectMedicine = async (med) => {
    setSelectedMedicine(med);
    setSearchQuery(med.name);
    setSearchResults([]);
    try {
      // Use FEFO sorted endpoint
      const fefoBatches = await batchService.getFefoBatches(med.id);
      setAvailableBatches(fefoBatches || []);
      if (fefoBatches && fefoBatches.length > 0) {
        // Auto-select earliest expiry (FEFO)
        setSelectedBatch(fefoBatches[0]);
        setQuantity(1);
      } else {
        setSelectedBatch(null);
      }
    } catch (err) {
      console.error('Failed to load batches:', err);
    }
  };

  // Barcode scanned / simulated
  const handleBarcodeDetected = async (code) => {
    try {
      setErrorMsg('');
      const med = await medicineService.lookupBarcode(code);
      if (med) {
        await handleSelectMedicine(med);
      } else {
        setErrorMsg(`No medicine registered for barcode: ${code}`);
      }
    } catch (err) {
      setErrorMsg(`Barcode lookup failed for: ${code}`);
    }
  };

  // Add item to cart
  const handleAddToCart = () => {
    if (!selectedMedicine || !selectedBatch) {
      setErrorMsg('Please select a medicine and an available batch');
      return;
    }
    if (quantity <= 0) {
      setErrorMsg('Quantity must be greater than 0');
      return;
    }
    if (quantity > selectedBatch.qty_on_hand) {
      setErrorMsg(`Cannot exceed batch available stock (${selectedBatch.qty_on_hand})`);
      return;
    }

    const unitPrice = selectedBatch.mrp || 0;
    const discountAmount = (unitPrice * (itemDiscount / 100)) * quantity;
    const lineTotal = (unitPrice * quantity) - discountAmount;

    // Check if same batch already in cart
    const existingIndex = cart.findIndex((i) => i.batch_id === selectedBatch.id);
    if (existingIndex > -1) {
      const updatedCart = [...cart];
      const newQty = updatedCart[existingIndex].qty_sold + quantity;
      if (newQty > selectedBatch.qty_on_hand) {
        setErrorMsg(`Combined cart quantity exceeds available batch stock (${selectedBatch.qty_on_hand})`);
        return;
      }
      updatedCart[existingIndex].qty_sold = newQty;
      updatedCart[existingIndex].line_total += lineTotal;
      setCart(updatedCart);
    } else {
      const newItem = {
        medicine_id: selectedMedicine.id,
        medicine_name: selectedMedicine.name,
        batch_id: selectedBatch.id,
        batch_no: selectedBatch.batch_no,
        expiry_date: selectedBatch.expiry_date,
        days_to_expiry: selectedBatch.days_to_expiry,
        qty_sold: quantity,
        unit_price: unitPrice,
        discount: discountAmount,
        line_total: lineTotal,
      };
      setCart([...cart, newItem]);
    }

    // Reset selection for next medicine
    setSelectedMedicine(null);
    setSelectedBatch(null);
    setAvailableBatches([]);
    setSearchQuery('');
    setQuantity(1);
    setItemDiscount(0);
    setErrorMsg('');
  };

  const handleRemoveFromCart = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  // Calculation totals
  const subtotal = cart.reduce((sum, item) => sum + item.line_total, 0);
  const grandTotal = Math.max(0, subtotal - Number(overallDiscount || 0));

  // Complete & Bill
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      setErrorMsg('Cart is empty. Add at least one medicine item.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        customer_name: customerName.trim() || 'Walk-in Customer',
        discount: Number(overallDiscount) || 0,
        items: cart.map((i) => ({
          medicine_id: i.medicine_id,
          medicine_name: i.medicine_name,
          batch_id: i.batch_id,
          batch_no: i.batch_no,
          qty_sold: i.qty_sold,
          unit_price: i.unit_price,
          discount: i.discount,
        })),
      };

      const billResult = await billingService.createBill(payload);
      setCompletedBill(billResult);
      setIsReceiptOpen(true);
      setCart([]);
      setCustomerName('Walk-in Customer');
      setOverallDiscount(0);

      // Trigger background alert check to refresh low stock or expiry
      alertService.generateAlerts().catch(() => {});
    } catch (err) {
      console.error('Failed to create bill:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to complete transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-400" />
            FEFO Pharmacy Billing Counter
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            System automatically selects the earliest expiring batch to ensure zero medicine waste.
          </p>
        </div>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-semibold border border-slate-700 shadow-sm transition group"
        >
          <Barcode className="w-4 h-4 transition group-hover:scale-110" />
          <span>Scan Barcode (Camera / Demo)</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Counter Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Columns: Product Selection & FEFO Recommendation */}
        <div className="lg:col-span-7 space-y-6">
          {/* Medicine Search Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 relative">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Find Medicine (Name or Barcode)
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Type 'Paracetamol', 'Amoxicillin', or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Autocomplete Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute left-6 right-6 top-[88px] z-20 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-800 max-h-60 overflow-y-auto">
                {searchResults.map((med) => (
                  <button
                    key={med.id}
                    onClick={() => handleSelectMedicine(med)}
                    className="w-full px-4 py-3 text-left hover:bg-emerald-950/30 flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-emerald-300">
                        {med.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {med.category} • Barcode: {med.barcode || 'N/A'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-slate-300">
                        Stock: {med.total_stock} {med.unit}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* FEFO Batch Selection Area */}
          {selectedMedicine && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-white text-base">{selectedMedicine.name}</h3>
                  <p className="text-xs text-slate-400">{selectedMedicine.category} • {selectedMedicine.unit}</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Total Stock: {selectedMedicine.total_stock}
                </span>
              </div>

              {/* Batch List with FEFO Recommended */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Select Batch (Earliest Expiry First — FEFO Ranked)
                </div>

                {availableBatches.length > 0 ? (
                  <div className="space-y-2">
                    {availableBatches.map((b, idx) => {
                      const isFefoPick = idx === 0;
                      const isSelected = selectedBatch?.id === b.id;

                      return (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBatch(b)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500/40'
                              : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-white">
                                Batch: {b.batch_no}
                              </span>
                              <FEFOBadge isRecommended={isFefoPick} />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <span>Expires: {b.expiry_date}</span>
                              <span>•</span>
                              <ExpiryBadge days={b.days_to_expiry} status={b.expiry_status} />
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-semibold text-slate-200">
                              Avail: <span className="font-bold text-white">{b.qty_on_hand}</span>
                            </div>
                            <div className="text-sm font-bold font-mono text-emerald-400">
                              ₹{b.mrp?.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center">
                    No active unexpired batches in stock for this medicine.
                  </div>
                )}
              </div>

              {/* Quantity & Item Discount Controls */}
              {selectedBatch && (
                <div className="pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Quantity</label>
                    <div className="flex items-center rounded-xl bg-slate-900 border border-slate-700 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={selectedBatch.qty_on_hand}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.min(selectedBatch.qty_on_hand, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-full text-center bg-transparent text-sm font-bold text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(selectedBatch.qty_on_hand, quantity + 1))}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={itemDiscount}
                      onChange={(e) => setItemDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 5 Columns: Active Counter Cart */}
        <div className="lg:col-span-5">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col h-full space-y-5 sticky top-24">
            {/* Cart Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Counter Bill Cart</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {cart.length} item{cart.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Customer Details */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">Customer / Patient Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Walk-in Customer"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 min-h-[160px] max-h-[320px] overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-800/40">
              {cart.length > 0 ? (
                cart.map((item, idx) => (
                  <div key={idx} className="pt-2 flex items-center justify-between text-xs group">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-200">{item.medicine_name}</div>
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                        <span>Batch: {item.batch_no}</span>
                        <span>•</span>
                        <span>Exp: {item.expiry_date}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.qty_sold} × ₹{item.unit_price.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono font-bold text-white">
                        ₹{item.line_total.toFixed(2)}
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Cart is empty. Search a medicine or scan barcode to add items.
                </div>
              )}
            </div>

            {/* Bill Summary Breakdown */}
            <div className="border-t border-slate-800 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono text-slate-200">₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Overall Discount (₹)</span>
                <input
                  type="number"
                  min="0"
                  value={overallDiscount}
                  onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-right font-mono text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>GST (Inclusive 5%)</span>
                <span className="font-mono text-slate-400">Included</span>
              </div>

              <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
                <span>Grand Total</span>
                <span className="font-mono text-emerald-400 text-lg">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Complete Sale Button */}
            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Processing Bill...' : 'Complete Sale & Print Bill'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={handleBarcodeDetected}
      />

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        bill={completedBill}
        orgName={user?.org_name}
      />
    </div>
  );
};
