import { useState, useRef } from 'react';
import { Upload, Download, FileText, Loader2, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import Modal from './Modal';
import { importApi } from '../api/endpoints';
import { useToast } from '../context/ToastContext';

export default function ImportModal({ open, onClose, type, typeLabel, onImported }) {
  const toast = useToast();
  const fileRef = useRef(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [dragging, setDragging] = useState(false);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setImporting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.csv')) {
      toast.error('Only .csv files are allowed.');
      return;
    }
    setFile(f);
    setResult(null);

    // Preview first 5 rows
    const text = await f.text();
    const lines = text.split('\n').filter((l) => l.trim());
    if (lines.length < 2) {
      setPreview({ headers: [], rows: [] });
      return;
    }
    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1, 6).map(parseCSVLine);
    setPreview({ headers, rows });
  };

  const parseCSVLine = (line) => {
    // Simple CSV parser — handles quoted values
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        out.push(cur); cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await importApi.upload(type, formData);
      setResult(res.data);
      if (res.data.created > 0) {
        toast.success(`Imported ${res.data.created} ${typeLabel}`);
        onImported?.();
      }
      if (res.data.skipped > 0) {
        toast.warning(`${res.data.skipped} rows skipped`);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Import failed.';
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(importApi.templateUrl(type), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_template.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Template downloaded');
    } catch {
      toast.error('Failed to download template');
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Import ${typeLabel}`}
      size="lg"
      footer={
        <>
          <button onClick={handleClose} className="btn-secondary" type="button">
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button onClick={handleImport} disabled={!file || importing} className="btn-primary">
              {importing ? (
                <><Loader2 size={14} className="animate-spin" /> Importing...</>
              ) : (
                <><Upload size={14} /> Import {preview?.rows.length ? `(${preview.rows.length}+ rows)` : ''}</>
              )}
            </button>
          )}
        </>
      }
    >
      {!result ? (
        <div className="space-y-5">
          {/* Step 1: Template */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Step 1 — Get the template
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Download a CSV with the correct columns
                </div>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="btn-secondary text-xs flex items-center gap-2 flex-shrink-0"
              >
                <Download size={14} /> Download template
              </button>
            </div>
          </div>

          {/* Step 2: Upload */}
          <div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
              Step 2 — Upload your CSV
            </div>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                dragging
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/20'
                  : 'border-slate-300 dark:border-slate-600 hover:border-teal-500 dark:hover:border-teal-500'
              }`}
            >
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText size={32} className="text-teal-600 dark:text-teal-400" />
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{file.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={32} className="mx-auto text-slate-400" />
                  <div className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Drop your CSV here or click to browse
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Max 5 MB · UTF-8 encoded
                  </div>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          </div>

          {/* Step 3: Preview */}
          {preview && preview.headers.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Step 3 — Preview (first {preview.rows.length} rows)
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto max-h-64">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950">
                    <tr>
                      {preview.headers.map((h) => (
                        <th key={h} className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {preview.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        {row.map((cell, j) => (
                          <td key={j} className="px-2 py-1.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {cell || <span className="text-slate-400">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <CheckCircle size={12} className="text-emerald-500" />
                Ready to import. Files are validated row by row.
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Result view */
        <div className="space-y-4">
          <div className="text-center py-4">
            {result.created > 0 ? (
              <>
                <div className="inline-flex h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 items-center justify-center mb-3">
                  <CheckCircle size={28} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Import complete
                </h3>
              </>
            ) : (
              <>
                <div className="inline-flex h-16 w-16 rounded-full bg-red-50 dark:bg-red-950/50 items-center justify-center mb-3">
                  <XCircle size={28} className="text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Import failed
                </h3>
              </>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-center">
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Total</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{result.total}</div>
            </div>
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-center">
              <div className="text-xs text-emerald-700 dark:text-emerald-300 uppercase">Imported</div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{result.created}</div>
            </div>
            <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 text-center">
              <div className="text-xs text-red-700 dark:text-red-300 uppercase">Skipped</div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">{result.skipped}</div>
            </div>
          </div>

          {result.errors?.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500" />
                Errors ({result.errors.length})
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <div key={i} className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-b-0 text-xs">
                    <span className="font-mono text-slate-500 dark:text-slate-400">Row {e.row}:</span>{' '}
                    <span className="text-red-600 dark:text-red-400">{e.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}