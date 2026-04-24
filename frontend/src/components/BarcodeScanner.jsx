import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, Flashlight, RotateCcw } from "lucide-react";

const BarcodeScanner = ({ onScan, onClose, title = "Scan Barcode / QR Code" }) => {
  const scannerRef = useRef(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);

  useEffect(() => {
    startScanner();
    return () => stopScanner();
  }, []);

  const startScanner = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);

      if (devices.length === 0) {
        setError("No camera found on this device.");
        return;
      }

      // Prefer back camera
      const backCam = devices.find(d =>
        d.label.toLowerCase().includes("back") ||
        d.label.toLowerCase().includes("rear") ||
        d.label.toLowerCase().includes("environment")
      ) || devices[devices.length - 1];

      setSelectedCamera(backCam.id);
      await initScanner(backCam.id);
    } catch (err) {
      setError("Camera access denied. Please allow camera permissions.");
    }
  };

  const initScanner = async (cameraId) => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop().catch(() => {});
      }

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      setScanning(true);
      setError("");

      await scanner.start(
        { deviceId: { exact: cameraId } },
        {
          fps: 15,
          qrbox: { width: 260, height: 180 },
          aspectRatio: 1.5,
        },
        (decodedText) => {
          // Success
          stopScanner();
          onScan(decodedText);
        },
        () => {} // ignore not-found errors
      );
    } catch (err) {
      setError("Failed to start camera: " + err.message);
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch {}
    }
    setScanning(false);
  };

  const switchCamera = async () => {
    if (cameras.length < 2) return;
    const other = cameras.find(c => c.id !== selectedCamera);
    if (other) {
      setSelectedCamera(other.id);
      await stopScanner();
      await initScanner(other.id);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      stopScanner();
      onScan(manualInput.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-emerald-600" />
            <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
          </div>
          <button onClick={() => { stopScanner(); onClose(); }}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Scanner viewport */}
        <div className="relative bg-gray-900">
          <div id="qr-reader" className="w-full" style={{ minHeight: "260px" }} />

          {/* Scanning overlay */}
          {scanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-52 h-36">
                {/* Corner borders */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br" />
                {/* Scan line animation */}
                <div className="absolute left-1 right-1 h-0.5 bg-emerald-400/80 animate-scan" />
              </div>
            </div>
          )}

          {/* Camera switch button */}
          {cameras.length > 1 && (
            <button onClick={switchCamera}
              className="absolute bottom-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors">
              <RotateCcw size={16} />
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-4 mt-3 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-red-600 text-xs">{error}</p>
          </div>
        )}

        {/* Status */}
        <div className="px-5 py-2 text-center">
          <p className="text-xs text-gray-400">
            {scanning ? "Position barcode or QR code inside the frame" : "Initializing camera..."}
          </p>
        </div>

        {/* Manual input */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or enter manually</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              placeholder="Type barcode / QR value..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <button type="submit"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm
                         font-medium rounded-xl transition-colors">
              Use
            </button>
          </form>
        </div>
      </div>

      {/* Scan line animation style */}
      <style>{`
        @keyframes scan {
          0% { top: 4px; }
          50% { top: calc(100% - 4px); }
          100% { top: 4px; }
        }
        .animate-scan { animation: scan 2s linear infinite; }
        #qr-reader video { border-radius: 0 !important; }
        #qr-reader__scan_region { border: none !important; }
        #qr-reader__dashboard { display: none !important; }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;