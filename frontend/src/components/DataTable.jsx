import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Inbox, Loader2 } from 'lucide-react';

export default function DataTable({
  columns,
  rows,
  loading,
  emptyMessage = 'No data found.',
  sortable = true,
  emptyIcon: EmptyIcon = Inbox,
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortKey || !rows) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      let cmp;
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv;
      } else {
        cmp = String(av).localeCompare(String(bv), undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
          <Loader2 size={14} className="animate-spin" />
          <span>Loading data...</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-4">
              <div className="h-3 rounded bg-slate-100 dark:bg-slate-800 animate-pulse flex-1" />
              <div className="h-3 rounded bg-slate-100 dark:bg-slate-800 animate-pulse w-24" />
              <div className="h-3 rounded bg-slate-100 dark:bg-slate-800 animate-pulse w-32" />
              <div className="h-3 rounded bg-slate-100 dark:bg-slate-800 animate-pulse w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-card py-16 px-6 text-center">
        <div className="inline-flex h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-3">
          <EmptyIcon size={24} className="text-slate-400" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
      <div className="overflow-x-auto max-h-[70vh]">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead className="sticky top-0 z-10">
            <tr>
              {columns.map((col) => {
                const isSortable = sortable && col.sortable !== false && col.key !== 'actions';
                const isActive = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => isSortable && handleSort(col.key)}
                    className={`px-4 py-3 text-left text-[11px] uppercase font-semibold tracking-wide border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 ${
                      isSortable ? 'cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200' : ''
                    } ${col.className || ''}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {isSortable && (
                        <span className={`transition ${isActive ? 'text-teal-600' : 'text-slate-400 dark:text-slate-500'}`}>
                          {isActive ? (
                            sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                          ) : (
                            <ChevronsUpDown size={12} />
                          )}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, i) => (
              <tr
                key={row.id ?? row[columns[0]?.key] ?? i}
                className="group transition-colors odd:bg-white dark:odd:bg-slate-900 even:bg-slate-50/40 dark:even:bg-slate-900/60 hover:bg-teal-50/40 dark:hover:bg-teal-900/10"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-2.5 text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 align-middle ${col.className || ''}`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          Showing <span className="font-medium text-slate-700 dark:text-slate-200">{sortedRows.length}</span> {sortedRows.length === 1 ? 'row' : 'rows'}
          {sortKey && (
            <>
              {' · sorted by '}
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {columns.find((c) => c.key === sortKey)?.label}
              </span>
              {' '}
              ({sortDir})
            </>
          )}
        </span>
        {sortKey && (
          <button
            onClick={() => setSortKey(null)}
            className="text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 font-medium"
          >
            Clear sort
          </button>
        )}
      </div>
    </div>
  );
}