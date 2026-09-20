import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Barcode, Zap } from 'lucide-react';

const DEMO_BARCODES = [
  { code: '8901234560001', name: 'Paracetamol 500mg' },
  { code: '8901234560002', name: 'Amoxicillin 250mg' },
  { code: '8901234560003', name: 'Cetirizine 10mg' },
  { code: '8901234560004', name: 'Metformin 500mg' },
  { code: '8901234560005', name: 'ORS Sachets' },
  { code: '8901234560006', name: 'Azithromycin 500mg' },
];

export const BarcodeScannerModal = ({ isOpen, onClose, onDetected }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const qrRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    let html5QrCode = null;
    const scannerId = 'reader-element';

    const startCamera = async () => {
      try {
        setCameraError(null);
        html5QrCode = new Html5Qrcode(scannerId);
        qrRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 180 },
            aspectRatio: 1.333334,
          },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          () => {
            // scan failure ignore
          }
        );
        setCameraActive(true);
      } catch (err) {
        console.warn('Camera initialization notice:', err);
        setCameraError('Webcam not active or permission declined. Use simulation buttons or manual entry below.');
        setCameraActive(false);
      }
    };

    startCamera();

    return () => {
      if (qrRef.current) {
        qrRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            qrRef.current = null;
          });
      }
    };
  }, [isOpen]);

  const handleScanSuccess = (code) => {
    if (qrRef.current) {
      qrRef.current.stop().catch(() => {});
    }
    onDetected(code.trim());
    onClose();
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleScanSuccess(manualCode.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">Scan Medicine Barcode</h3>
              <p className="text-xs text-slate-400">Point camera at 1D/2D barcode or test below</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Camera View Area */}
          <div className="relative min-h-[220px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center">
            <div id="reader-element" className="w-full"></div>
            {cameraError && (
              <div className="p-4 text-center text-xs text-amber-300 bg-amber-950/40 rounded-lg mx-4 my-2 border border-amber-800/40">
                {cameraError}
              </div>
            )}
            {cameraActive && (
              <div className="absolute top-3 left-3 px-2 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded text-[11px] font-medium text-emerald-300 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Scanner Live
              </div>
            )}
          </div>

          {/* Quick Demo Simulator */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Quick Demo Barcode Simulators
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_BARCODES.map((item) => (
                <button
                  key={item.code}
                  onClick={() => handleScanSuccess(item.code)}
                  className="flex flex-col items-start p-2.5 text-left rounded-lg bg-slate-800/60 hover:bg-emerald-950/40 hover:border-emerald-500/40 border border-slate-700/60 transition group"
                >
                  <span className="text-xs font-medium text-slate-200 group-hover:text-emerald-300">
                    {item.name}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {item.code}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Or type barcode manually:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. 8901234560001"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition cursor-pointer"
              >
                Scan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
