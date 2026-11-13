import React, { useState } from 'react';
import { parseFile, importTransactions } from '../api/upload';
import { getCategories } from '../api/categories';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import Card from '../components/Card';
import Loader from '../components/Loader';
import { formatCurrency, classNames } from '../utils/formatters';

const STEPS = ['Upload', 'Map Columns', 'Preview', 'Import Result'];

const toIndex = (value) => {
  if (value === '' || value === null || value === undefined) return -1;
  const n = Number(value);
  return Number.isNaN(n) ? -1 : n;
};

const parseAmount = (value) => {
  if (value === null || value === undefined || value === '') return null;
  let str = String(value).trim();
  str = str.replace(/[₹$,\s]/g, '');
  str = str.replace(/\(([\d.]+)\)/, '-$1');
  const num = parseFloat(str);
  return Number.isNaN(num) ? null : Math.abs(num);
};

const parseDateValue = (value) => {
  if (!value) return null;
  const str = String(value).trim();
  let match = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) {
    const d = new Date(match[3], match[2] - 1, match[1]);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  match = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (match) {
    const d = new Date(match[1], match[2] - 1, match[3]);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  match = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/);
  if (match) {
    let year = parseInt(match[3], 10);
    year = year > 50 ? 1900 + year : 2000 + year;
    const d = new Date(year, match[2] - 1, match[1]);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
};

export default function Upload() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [parseResult, setParseResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [targetMonth, setTargetMonth] = useState(null);

  // Mapping state stores numeric column indices (or '' when unmapped)
  const [mapping, setMapping] = useState({
    date: '',
    description: '',
    debit: '',
    credit: '',
    amount: ''
  });

  const [previewRows, setPreviewRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [importResult, setImportResult] = useState(null);

  const loadCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats || []);
    } catch (err) {
      toast.error('Failed to load categories');
    }
  };

  const guessMappingFromHeaders = (headers) => {
    const guess = { date: '', description: '', debit: '', credit: '', amount: '' };
    headers.forEach((h, idx) => {
      const l = String(h).toLowerCase();
      if (guess.date === '' && (l.includes('date'))) guess.date = idx;
      if (guess.description === '' && (l.includes('narr') || l.includes('desc') || l.includes('particular') || l.includes('detail') || l.includes('remark'))) guess.description = idx;
      if (guess.debit === '' && (l.includes('debit') || l.includes('withdraw') || l === 'dr' || l.includes('dr amt'))) guess.debit = idx;
      if (guess.credit === '' && (l.includes('credit') || l.includes('deposit') || l === 'cr' || l.includes('cr amt'))) guess.credit = idx;
      if (guess.amount === '' && l.includes('amount')) guess.amount = idx;
    });
    return guess;
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer?.files?.[0] || e.target.files?.[0];
    if (droppedFile) {
      if (droppedFile.size > 10 * 1024 * 1024) {
        toast.error('File must be under 10MB');
        return;
      }
      const ext = droppedFile.name.toLowerCase().split('.').pop();
      if (!['csv', 'xls', 'xlsx', 'pdf'].includes(ext)) {
        toast.error('Only .csv, .xls, .xlsx, and .pdf files are supported');
        return;
      }
      setFile(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const res = await parseFile(formData);
      setParseResult(res);

      const fallback = guessMappingFromHeaders(res.headers || []);
      const guess = res.columnGuess || {};
      const initial = {
        date: guess.date >= 0 ? guess.date : fallback.date,
        description: guess.description >= 0 ? guess.description : fallback.description,
        debit: guess.debit >= 0 ? guess.debit : fallback.debit,
        credit: guess.credit >= 0 ? guess.credit : fallback.credit,
        amount: guess.amount >= 0 ? guess.amount : fallback.amount
      };
      setMapping(initial);
      setOverrides({});
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to parse file');
    } finally {
      setLoading(false);
    }
  };

  const buildPreview = () => {
    const idxDate = toIndex(mapping.date);
    const idxDesc = toIndex(mapping.description);
    const idxDebit = toIndex(mapping.debit);
    const idxCredit = toIndex(mapping.credit);
    const idxAmount = toIndex(mapping.amount);

    return parseResult.rows.map((row, index) => {
      const dateRaw = idxDate >= 0 ? row[idxDate] : '';
      const descRaw = idxDesc >= 0 ? row[idxDesc] : '';

      let amount = null;
      let type = null;

      if (idxDebit >= 0 && idxCredit >= 0) {
        const debit = parseAmount(row[idxDebit]);
        const credit = parseAmount(row[idxCredit]);
        if (debit && debit > 0) { amount = debit; type = 'expense'; }
        else if (credit && credit > 0) { amount = credit; type = 'income'; }
      } else if (idxAmount >= 0) {
        const parsed = parseAmount(row[idxAmount]);
        if (parsed && parsed > 0) {
          amount = parsed;
          const orig = String(row[idxAmount]).trim();
          type = (orig.startsWith('-') || /dr/i.test(orig)) ? 'expense' : 'income';
        }
      }

      const date = parseDateValue(dateRaw);
      const isValid = !!date && !!amount && amount > 0;

      return {
        rowIndex: index,
        dateRaw: dateRaw,
        description: String(descRaw || '').trim(),
        amount,
        type,
        isValid
      };
    });
  };

  const handleMappingContinue = () => {
    const hasSingle = toIndex(mapping.amount) >= 0;
    const hasSplit = toIndex(mapping.debit) >= 0 && toIndex(mapping.credit) >= 0;
    if (toIndex(mapping.date) < 0 || toIndex(mapping.description) < 0) {
      toast.error('Date and Description columns are required');
      return;
    }
    if (!hasSingle && !hasSplit) {
      toast.error('Map an Amount column, or both Debit and Credit columns');
      return;
    }
    setPreviewRows(buildPreview());
    loadCategories();
    setStep(3);
  };

  const handleOverrideChange = (rowIndex, categoryId) => {
    setOverrides(prev => ({ ...prev, [rowIndex]: categoryId }));
  };

  const handleImport = async () => {
    const validRows = previewRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    const numericMapping = {
      date: toIndex(mapping.date),
      description: toIndex(mapping.description),
      debit: toIndex(mapping.debit),
      credit: toIndex(mapping.credit),
      amount: toIndex(mapping.amount)
    };

    const cleanOverrides = {};
    Object.entries(overrides).forEach(([k, v]) => { if (v) cleanOverrides[k] = v; });

    try {
      setLoading(true);
      const res = await importTransactions({
        rows: parseResult.rows,
        mapping: numericMapping,
        overrides: cleanOverrides
      });
      setImportResult(res);
      if (res?.targetMonth) {
        setTargetMonth(res.targetMonth);
      }
      setStep(4);
      toast.success(`Imported ${res.imported} transactions`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import transactions');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setFile(null);
    setParseResult(null);
    setPreviewRows([]);
    setOverrides({});
    setImportResult(null);
    setTargetMonth(null);
    setMapping({ date: '', description: '', debit: '', credit: '', amount: '' });
    setStep(1);
  };

  const renderStepper = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((s, idx) => (
          <div key={s} className="flex flex-col items-center relative z-10">
            <div className={classNames(
              "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm border-2",
              step > idx + 1 ? "bg-green-500 border-green-500 text-white" :
              step === idx + 1 ? "bg-blue-600 border-blue-600 text-white" :
              "bg-white border-gray-300 text-gray-500"
            )}>
              {step > idx + 1 ? <CheckCircle size={16} /> : (idx + 1)}
            </div>
            <span className="mt-2 text-xs font-medium text-gray-500">{s}</span>
          </div>
        ))}
      </div>
      <div className="relative -mt-6 z-0 hidden sm:block">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2" />
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-blue-600 transition-all duration-300 -translate-y-1/2"
          style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );

  const renderColumnSelect = (field, label, required) => (
    <div key={field} className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-gray-700 capitalize">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
        value={mapping[field]}
        onChange={e => setMapping({ ...mapping, [field]: e.target.value === '' ? '' : Number(e.target.value) })}
      >
        <option value="">-- Not used --</option>
        {parseResult.headers.map((h, idx) => (
          <option key={`${field}-${idx}`} value={idx}>{h}</option>
        ))}
      </select>
    </div>
  );

  const invalidCount = previewRows.filter(r => !r.isValid).length;
  const validCount = previewRows.length - invalidCount;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Import Bank Statement</h1>

      {renderStepper()}

      <Card className="min-h-[400px]">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <Loader />
            <p className="mt-4 text-gray-500">Processing statement...</p>
          </div>
        ) : (
          <>
            {/* STEP 1: UPLOAD */}
            {step === 1 && (
              <div className="flex flex-col items-center justify-center py-12">
                <div
                  className={classNames(
                    "w-full max-w-xl border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer",
                    isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                  )}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    CSV, XLS, XLSX, or PDF (max. 10MB)
                  </p>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".csv, .xls, .xlsx, .pdf, application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={handleFileDrop}
                  />
                </div>

                {file && (
                  <div className="mt-6 flex items-center p-3 bg-blue-50 text-blue-700 rounded-lg w-full max-w-xl">
                    <FileText size={20} className="mr-3" />
                    <span className="flex-1 font-medium truncate">{file.name}</span>
                    <span className="text-sm opacity-75">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={!file}
                  className="mt-8 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <span>Continue</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            )}

            {/* STEP 2: MAP COLUMNS */}
            {step === 2 && parseResult && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Map Columns</h3>
                  <p className="text-sm text-gray-500">
                    Match your file columns to the fields below. Use either a single Amount column, or separate Debit and Credit columns.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renderColumnSelect('date', 'Date', true)}
                  {renderColumnSelect('description', 'Description', true)}
                  {renderColumnSelect('amount', 'Amount (single)')}
                  {renderColumnSelect('debit', 'Debit / Withdrawal')}
                  {renderColumnSelect('credit', 'Credit / Deposit')}
                </div>

                <div className="mt-8">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Data Preview (First 3 rows)</h4>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {parseResult.headers.map((h, idx) => <th key={idx} className="px-4 py-2 text-left font-medium text-gray-500 whitespace-nowrap">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {parseResult.rows.slice(0, 3).map((row, i) => (
                          <tr key={i}>
                            {parseResult.headers.map((h, idx) => <td key={idx} className="px-4 py-2 truncate max-w-[200px] text-gray-900">{row[idx]}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(1)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                    <ArrowLeft size={18} /> <span>Back</span>
                  </button>
                  <button onClick={handleMappingContinue} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                    <span>Preview Data</span> <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PREVIEW */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Review & Categorize</h3>
                    <p className="text-sm text-gray-500">
                      {validCount} valid, {invalidCount} invalid. Categories are auto-assigned; you can override any row.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto border rounded-lg max-h-[420px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Description</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Amount</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Category</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewRows.map((row) => (
                        <tr key={row.rowIndex} className={!row.isValid ? "bg-red-50" : ""}>
                          <td className="px-4 py-2 whitespace-nowrap">{row.dateRaw}</td>
                          <td className="px-4 py-2 truncate max-w-[220px]" title={row.description}>{row.description}</td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">{row.amount != null ? formatCurrency(row.amount) : '—'}</td>
                          <td className="px-4 py-2 capitalize">{row.type || '—'}</td>
                          <td className="px-4 py-2">
                            {row.isValid ? (
                              <select
                                value={overrides[row.rowIndex] || ''}
                                onChange={(e) => handleOverrideChange(row.rowIndex, e.target.value)}
                                className="text-xs border-gray-200 rounded py-1 px-2 bg-white text-gray-700 focus:ring-1 focus:ring-blue-500 border cursor-pointer max-w-[160px]"
                              >
                                <option value="">Auto</option>
                                {categories.filter(c => c.type === row.type).map(c => (
                                  <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                                ))}
                              </select>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {row.isValid ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Valid</span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                <AlertCircle size={12} className="mr-1" /> Invalid
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(2)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                    <ArrowLeft size={18} /> <span>Back</span>
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={validCount === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <UploadCloud size={18} /> <span>Import {validCount} Transactions</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: RESULT */}
            {step === 4 && importResult && (
              <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Import Successful</h3>
                  <p className="text-gray-500 mt-2">
                    Successfully imported <span className="font-semibold text-gray-900">{importResult.imported}</span> transactions.
                  </p>
                  {importResult.skipped > 0 && (
                    <p className="text-amber-600 text-sm mt-1">
                      {importResult.skipped} duplicate row(s) already existed in your account.
                    </p>
                  )}
                  {importResult.invalid > 0 && (
                    <p className="text-red-600 text-sm mt-1">
                      {importResult.invalid} invalid row(s) ignored.
                    </p>
                  )}
                </div>
                <div className="pt-6 flex gap-3">
                  <button onClick={resetFlow} className="px-6 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50">
                    Upload Another File
                  </button>
                  <button
                    onClick={() => navigate(targetMonth ? `/?month=${targetMonth}` : '/')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    View in Dashboard
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
