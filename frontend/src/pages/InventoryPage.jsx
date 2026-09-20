import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  PackagePlus,
  AlertCircle,
  X,
  CheckCircle2,
  Barcode,
  Layers,
} from 'lucide-react';
import { medicineService, batchService } from '../services/api';
import { StockBadge, ExpiryBadge, FEFOBadge } from '../components/StatusBadge';

export const InventoryPage = () => {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedMedId, setExpandedMedId] = useState(null);
  const [medBatches, setMedBatches] = useState({});
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [isInwardBatchOpen, setIsInwardBatchOpen] = useState(false);
  const [activeMedicineForBatch, setActiveMedicineForBatch] = useState(null);

  // Forms
  const [newMed, setNewMed] = useState({
    name: '',
    category: 'Antibiotics',
    barcode: '',
    min_stock: 15,
    medium_stock: 40,
    unit: 'strips',
    description: '',
  });

  const [newBatch, setNewBatch] = useState({
    batch_no: '',
    expiry_date: '',
    qty_received: 100,
    mrp: 50.0,
    purchase_price: 35.0,
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const [medsData, catsData] = await Promise.all([
        medicineService.list({ category: selectedCategory || undefined, search: search || undefined }),
        medicineService.getCategories(),
      ]);
      setMedicines(medsData || []);
      setCategories(catsData || []);
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, [selectedCategory, search]);

  const toggleExpand = async (medId) => {
    if (expandedMedId === medId) {
      setExpandedMedId(null);
      return;
    }
    setExpandedMedId(medId);
    if (!medBatches[medId]) {
      try {
        const batches = await batchService.getByMedicine(medId);
        setMedBatches((prev) => ({ ...prev, [medId]: batches }));
      } catch (err) {
        console.error('Failed to load batches:', err);
      }
    }
  };

  const handleCreateMedicine = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await medicineService.create(newMed);
      setSuccessMsg('Medicine added to inventory successfully!');
      setIsAddMedOpen(false);
      setNewMed({
        name: '',
        category: 'Antibiotics',
        barcode: '',
        min_stock: 15,
        medium_stock: 40,
        unit: 'strips',
        description: '',
      });
      loadMedicines();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to create medicine');
    }
  };

  const handleInwardBatch = async (e) => {
    e.preventDefault();
    if (!activeMedicineForBatch) return;
    setErrorMsg('');
    try {
      await batchService.create(activeMedicineForBatch.id, newBatch);
      setSuccessMsg(`Batch ${newBatch.batch_no} inwarded successfully for ${activeMedicineForBatch.name}!`);
      setIsInwardBatchOpen(false);
      // Refresh batches for this medicine
      const updatedBatches = await batchService.getByMedicine(activeMedicineForBatch.id);
      setMedBatches((prev) => ({ ...prev, [activeMedicineForBatch.id]: updatedBatches }));
      loadMedicines();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to inward batch');
    }
  };

  const openInwardModal = (med) => {
    setActiveMedicineForBatch(med);
    const randomBatch = 'B' + Math.floor(1000 + Math.random() * 9000);
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6);
    setNewBatch({
      batch_no: randomBatch,
      expiry_date: futureDate.toISOString().split('T')[0],
      qty_received: 50,
      mrp: 60.0,
      purchase_price: 40.0,
    });
    setIsInwardBatchOpen(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-emerald-400" />
            Inventory & Batch Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track real-time quantities, manage inward batches, and maintain FEFO compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddMedOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Medicine</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search medicine name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Categories ({medicines.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="px-6 py-3.5">Medicine Name</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5 font-mono">Barcode</th>
                <th className="px-6 py-3.5 text-center">Stock Level</th>
                <th className="px-6 py-3.5 text-center">Min Threshold</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {medicines.map((med) => {
                const isExpanded = expandedMedId === med.id;
                const batches = medBatches[med.id] || [];

                return (
                  <React.Fragment key={med.id}>
                    <tr className="hover:bg-slate-900/40 transition group">
                      <td className="px-6 py-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleExpand(med.id)}
                            className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                            title="View Batches"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          <span>{med.name}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {med.category}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-mono text-slate-400">
                        {med.barcode || '—'}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <StockBadge status={med.stock_status} totalStock={med.total_stock} unit={med.unit} />
                      </td>

                      <td className="px-6 py-4 text-center font-mono text-slate-400">
                        {med.min_stock} {med.unit}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openInwardModal(med)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                            <span>Inward Batch</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Batches Row */}
                    {isExpanded && (
                      <tr className="bg-slate-950/60 border-y border-slate-800">
                        <td colSpan="6" className="p-6">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                                Active Batches for {med.name}
                              </div>
                              <span className="text-[11px] text-slate-400">
                                Sorted by Expiry Date (FEFO Protocol)
                              </span>
                            </div>

                            {batches.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {batches.map((b, idx) => (
                                  <div
                                    key={b.id}
                                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono font-bold text-white text-xs">
                                        Batch: {b.batch_no}
                                      </span>
                                      <FEFOBadge isRecommended={idx === 0} />
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-slate-400">
                                      <span>Expires: {b.expiry_date}</span>
                                      <ExpiryBadge days={b.days_to_expiry} status={b.expiry_status} />
                                    </div>

                                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                                      <span className="text-slate-400">
                                        Stock: <span className="font-bold text-white">{b.qty_on_hand}</span> / {b.qty_received}
                                      </span>
                                      <span className="font-mono font-bold text-emerald-400">
                                        MRP ₹{b.mrp?.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-4 rounded-xl bg-slate-900 text-slate-400 text-center text-xs">
                                No inwarded batches recorded yet. Click "Inward Batch" to add stock.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Medicine Modal */}
      {isAddMedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Add New Medicine</h3>
              <button onClick={() => setIsAddMedOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMedicine} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ibuprofen 400mg"
                  value={newMed.name}
                  onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={newMed.category}
                    onChange={(e) => setNewMed({ ...newMed, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unit</label>
                  <select
                    value={newMed.unit}
                    onChange={(e) => setNewMed({ ...newMed, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="strips">Strips</option>
                    <option value="bottles">Bottles</option>
                    <option value="sachets">Sachets</option>
                    <option value="tubes">Tubes</option>
                    <option value="vials">Vials</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Barcode</label>
                <input
                  type="text"
                  placeholder="e.g. 8901234560009"
                  value={newMed.barcode}
                  onChange={(e) => setNewMed({ ...newMed, barcode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Low Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={newMed.min_stock}
                    onChange={(e) => setNewMed({ ...newMed, min_stock: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Safe Threshold</label>
                  <input
                    type="number"
                    min="5"
                    value={newMed.medium_stock}
                    onChange={(e) => setNewMed({ ...newMed, medium_stock: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inward Batch Modal */}
      {isInwardBatchOpen && activeMedicineForBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Inward Stock Batch</h3>
                <p className="text-xs text-emerald-400">{activeMedicineForBatch.name}</p>
              </div>
              <button onClick={() => setIsInwardBatchOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInwardBatch} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    value={newBatch.batch_no}
                    onChange={(e) => setNewBatch({ ...newBatch, batch_no: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={newBatch.expiry_date}
                    onChange={(e) => setNewBatch({ ...newBatch, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Received Quantity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newBatch.qty_received}
                  onChange={(e) => setNewBatch({ ...newBatch, qty_received: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">MRP (Selling) ₹</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newBatch.mrp}
                    onChange={(e) => setNewBatch({ ...newBatch, mrp: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Purchase Price ₹</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newBatch.purchase_price}
                    onChange={(e) => setNewBatch({ ...newBatch, purchase_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Inward Batch to Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
