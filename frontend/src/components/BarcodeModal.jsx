import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, ScanBarcode, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BarcodeModal({ isOpen, onClose, onScanSuccess, sampleBarcodes = [] }) {
  const [scanning, setScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    startScanner();

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    setErrorMsg(null);
    try {
      const html5QrCode = new Html5Qrcode('barcode-reader');
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 180 },
        aspectRatio: 1.333333,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          // Success
          stopScanner();
          onScanSuccess(decodedText);
          onClose();
        },
        () => {
          // Ignore frequent frame decode failure
        }
      );
      setScanning(true);
    } catch (err) {
      console.warn('Camera scan not supported or permitted:', err);
      setErrorMsg('Camera access unavailable. You can type or click a test barcode below.');
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch((e) => console.log('Stop scanner error:', e));
      scannerRef.current.clear();
    }
    setScanning(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onScanSuccess(manualCode.trim());
    onClose();
  };

  const handleSampleClick = (code) => {
    onScanSuccess(code);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanBarcode className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Barcode Scanner</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scanner Viewport */}
        <div className="p-4 flex flex-col items-center">
          <div
            id="barcode-reader"
            className="w-full h-64 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative flex items-center justify-center text-slate-500"
          >
            {!scanning && !errorMsg && (
              <div className="flex flex-col items-center gap-2">
                <Camera className="h-8 w-8 animate-pulse text-emerald-400" />
                <span className="text-xs">Initializing camera feed...</span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="mt-3 w-full p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Manual Input form */}
          <form onSubmit={handleManualSubmit} className="mt-4 w-full flex gap-2">
            <input
              type="text"
              placeholder="Or enter barcode / SKU manually..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              autoFocus
            />
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs px-4 py-2 rounded-xl transition-colors shadow-md"
            >
              Lookup
            </button>
          </form>

          {/* Quick Demo Test Barcodes */}
          {sampleBarcodes.length > 0 && (
            <div className="mt-4 w-full">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Simulate Demo Barcodes:
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {sampleBarcodes.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSampleClick(item.barcode)}
                    className="text-xs bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40 text-slate-300 border border-slate-700 rounded-lg px-2.5 py-1 transition-all flex items-center gap-1.5"
                  >
                    <span>{item.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({item.barcode})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
