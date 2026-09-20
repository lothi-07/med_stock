import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck } from 'lucide-react';

export const ReceiptModal = ({ isOpen, onClose, bill, orgName, orgAddress, orgPhone, orgLicense }) => {
  if (!isOpen || !bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = bill.created_at
    ? new Date(bill.created_at).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top actions */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/90 print:hidden">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Bill Generated Successfully
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-6 overflow-y-auto print:p-0 print:m-0 font-mono text-xs text-slate-200 print:text-black print:bg-white">
          <div className="border border-slate-700/60 print:border-black rounded-xl p-6 bg-slate-950/60 print:bg-white">
            {/* Header */}
            <div className="text-center pb-4 border-b border-dashed border-slate-700 print:border-gray-400 space-y-1">
              <h2 className="text-base font-bold tracking-tight text-white print:text-black">
                {orgName || 'HealthPlus Pharmacy'}
              </h2>
              <p className="text-[11px] text-slate-400 print:text-gray-600">
                {orgAddress || '45, Anna Nagar Main Road, Chennai - 600040'}
              </p>
              <p className="text-[11px] text-slate-400 print:text-gray-600">
                Phone: {orgPhone || '+91 98765 43210'} | Lic: {orgLicense || 'TN-PH-2024-1234'}
              </p>
              <div className="inline-block px-2 py-0.5 mt-1 text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-300 print:bg-gray-200 print:text-black rounded">
                Tax Invoice / Retail Bill
              </div>
            </div>

            {/* Meta */}
            <div className="py-3 border-b border-dashed border-slate-700 print:border-gray-400 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 print:text-gray-500">Bill No: </span>
                <span className="font-bold text-white print:text-black">{bill.bill_number}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 print:text-gray-500">Date: </span>
                <span>{formattedDate}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-500">Customer: </span>
                <span>{bill.customer_name || 'Walk-in Customer'}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 print:text-gray-500">Cashier: </span>
                <span>{bill.user_name || 'Pharmacist'}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-3 border-b border-dashed border-slate-700 print:border-gray-400">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400 print:text-gray-600 border-b border-slate-800 print:border-gray-300 pb-1">
                    <th className="pb-1">Item / Batch</th>
                    <th className="pb-1 text-center">Qty</th>
                    <th className="pb-1 text-right">Price</th>
                    <th className="pb-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 print:divide-gray-200">
                  {bill.items?.map((item, idx) => (
                    <tr key={idx} className="text-[11px]">
                      <td className="py-1.5 pr-2">
                        <div className="font-medium text-slate-100 print:text-black">
                          {item.medicine_name}
                        </div>
                        <div className="text-[10px] text-slate-400 print:text-gray-500 font-mono">
                          Batch: {item.batch_no}
                        </div>
                      </td>
                      <td className="py-1.5 text-center font-semibold">{item.qty_sold}</td>
                      <td className="py-1.5 text-right font-mono">₹{item.unit_price.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-semibold font-mono text-white print:text-black">
                        ₹{item.line_total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="pt-3 space-y-1.5 text-right text-[11px]">
              <div className="flex justify-between text-slate-400 print:text-gray-600">
                <span>Subtotal:</span>
                <span className="font-mono">₹{(bill.total_amount || 0).toFixed(2)}</span>
              </div>
              {bill.discount > 0 && (
                <div className="flex justify-between text-emerald-400 print:text-gray-700">
                  <span>Discount:</span>
                  <span className="font-mono">-₹{bill.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400 print:text-gray-600">
                <span>CGST + SGST (Included):</span>
                <span className="font-mono">5.00%</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-700 print:border-black text-white print:text-black">
                <span>Net Total Paid:</span>
                <span className="font-mono text-emerald-400 print:text-black">
                  ₹{(bill.net_amount || bill.total_amount || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-5 pt-3 border-t border-dashed border-slate-700 print:border-gray-400 text-center space-y-1 text-[10px] text-slate-400 print:text-gray-500">
              <div className="flex items-center justify-center gap-1 text-emerald-400 print:text-gray-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                FEFO Compliant Inventory Management
              </div>
              <p>Thank you for your visit! Wishing you good health.</p>
              <p className="text-[9px] text-slate-500 font-mono">Powered by MedStock Cloud</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
