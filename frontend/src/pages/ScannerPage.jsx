import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ScanLine, Search, X, ArrowRight, Plus, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productsApi } from '../api/endpoints';

const SCANNER_ID = 'qr-scanner-region';

export default function ScannerPage() {
  const navigate = useNavigate();

  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [manualSku, setManualSku] = useState('');
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [notFoundSku, setNotFoundSku] = useState('');
  const [error, setError] = useState('');
  const [fileScanning, setFileScanning] = useState(false);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  const startScanner = async () => {
    setScanError('');
    try {
      const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await stopScanner();
          await lookupSku(decodedText);
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      setScanError(
        err?.message?.includes('Permission')
          ? 'Camera permission denied. Allow camera and try again.'
          : 'Could not start camera. Use upload or manual entry below.'
      );
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    const s = scannerRef.current;
    if (!s) return;
    try { await s.stop(); } catch (e) {}
    try { s.clear(); } catch (e) {}
    scannerRef.current = null;
    setScanning(false);
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setFileScanning(true);
    setScanError('');
    setError('');
    setProduct(null);
    setNotFoundSku('');

    try {
      const tempId = 'qr-file-temp-' + Date.now();
      const holder = document.createElement('div');
      holder.id = tempId;
      holder.style.display = 'none';
      document.body.appendChild(holder);

      const scanner = new Html5Qrcode(tempId, { verbose: false });
      const decoded = await scanner.scanFile(file, false);

      try { scanner.clear(); } catch (e) {}
      document.body.removeChild(holder);

      await lookupSku(decoded);
    } catch (err) {
      setScanError('No QR code found in that image. Try a clearer PNG/JPG.');
    } finally {
      setFileScanning(false);
    }
  };

  const lookupSku = async (skuRaw) => {
    const sku = (skuRaw || '').trim();
    if (!sku) return;
    setLoading(true);
    setError('');
    setProduct(null);
    setNotFoundSku('');
    try {
      const res = await productsApi.list({ search: sku });
      const list = res.data.results ?? res.data;
      const found = list.find((p) => p.sku === sku);
      if (!found) {
        setNotFoundSku(sku);
      } else {
        setProduct(found);
      }
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to lookup SKU "${sku}".`);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    lookupSku(manualSku);
  };

  const reset = () => {
    setProduct(null);
    setNotFoundSku('');
    setError('');
    setScanError('');
    setManualSku('');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ScanLine size={24} /> Scanner
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Scan a QR with camera, upload a QR image, or enter SKU manually.
        </p>
      </div>

      <div className="card bg-white dark:bg-slate-900 p-4 mb-4">
        <div
          id={SCANNER_ID}
          className={`w-full rounded-md bg-black/5 dark:bg-black/40 ${
            scanning ? 'min-h-[300px]' : 'h-0'
          }`}
        />

        <div className="flex flex-wrap items-center gap-2 mt-3">
          {!scanning ? (
            <button onClick={startScanner} className="btn-primary flex items-center gap-2">
              <ScanLine size={16} /> Start Camera
            </button>
          ) : (
            <button onClick={stopScanner} className="btn-secondary flex items-center gap-2">
              <X size={16} /> Stop Camera
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary flex items-center gap-2"
            disabled={fileScanning}
          >
            <Upload size={16} /> {fileScanning ? 'Reading…' : 'Upload QR Image'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <span className="text-xs text-slate-500 dark:text-slate-400">
            {scanning ? 'Point camera at QR code…' : 'Camera off'}
          </span>
        </div>

        {scanError && (
          <div className="mt-3 text-sm text-red-600 dark:text-red-400">{scanError}</div>
        )}
      </div>

      <form onSubmit={handleManualSubmit} className="card bg-white dark:bg-slate-900 p-4 mb-4">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
          Or enter SKU manually
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9 font-mono"
              placeholder="e.g. STAT-NBK-001"
              value={manualSku}
              onChange={(e) => setManualSku(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={!manualSku.trim() || loading}>
            {loading ? 'Looking up…' : 'Lookup'}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-md border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {notFoundSku && (
        <div className="card bg-white dark:bg-slate-900 p-5 border-l-4 border-amber-500">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase text-amber-600 dark:text-amber-400">Not in system</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                SKU <span className="font-mono">{notFoundSku}</span>
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                No product found with this SKU.
              </div>
            </div>
            <button onClick={reset} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => navigate(`/products?newSku=${encodeURIComponent(notFoundSku)}`)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} /> Create Product with this SKU
            </button>
            <button onClick={reset} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {product && (
        <div className="card bg-white dark:bg-slate-900 p-5 border-l-4 border-teal-500">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase text-slate-500 dark:text-slate-400">Product</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {product.product_name}
              </div>
              <div className="text-sm font-mono text-slate-500 dark:text-slate-400">
                {product.sku}
              </div>
            </div>
            <button onClick={reset} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
            <div>
              <div className="text-xs text-slate-500">Category</div>
              <div className="font-medium text-slate-800 dark:text-slate-200">{product.category_name || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Brand</div>
              <div className="font-medium text-slate-800 dark:text-slate-200">{product.brand_name || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Cost</div>
              <div className="font-medium text-slate-800 dark:text-slate-200">Rs. {Number(product.cost_price).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Selling</div>
              <div className="font-medium text-slate-800 dark:text-slate-200">Rs. {Number(product.selling_price).toFixed(2)}</div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => navigate(`/products?focusSku=${encodeURIComponent(product.sku)}`)}
              className="btn-secondary flex items-center gap-2"
            >
              View in Products <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}