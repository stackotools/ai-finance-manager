const Papa = require('papaparse');
const XLSX = require('xlsx');
const { PDFParse } = require('pdf-parse');

// Common header keywords for auto-detection
const DATE_KEYWORDS = ['date', 'txn date', 'transaction date', 'value date', 'posting date', 'tran date'];
const DESC_KEYWORDS = ['narration', 'description', 'particulars', 'details', 'remark', 'transaction details', 'remarks', 'desc'];
const DEBIT_KEYWORDS = ['debit', 'withdrawal', 'dr', 'debit amount', 'withdrawals', 'dr amount'];
const CREDIT_KEYWORDS = ['credit', 'deposit', 'cr', 'credit amount', 'deposits', 'cr amount'];
const AMOUNT_KEYWORDS = ['amount', 'transaction amount', 'txn amount', 'net amount'];
const BALANCE_KEYWORDS = ['balance', 'closing balance', 'running balance', 'available balance'];

/**
 * Parse a CSV buffer
 */
function parseCSV(buffer) {
  const text = buffer.toString('utf-8').replace(/^\uFEFF/, ''); // Strip BOM
  const result = Papa.parse(text, {
    header: false,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  return result.data;
}

/**
 * Parse an Excel buffer with proper date formatting
 */
function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, dateNF: 'yyyy-mm-dd' });
  const sheetNames = workbook.SheetNames;
  const sheet = workbook.Sheets[sheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false, dateNF: 'yyyy-mm-dd' });
  return { data, sheetNames };
}

/**
 * Parse text from a PDF bank statement buffer into tabular rows
 */
async function parsePDF(buffer) {
  let text = '';
  try {
    const parser = new PDFParse({ data: buffer });
    await parser.load();
    const result = await parser.getText();
    text = result.text || (result.pages ? result.pages.map(p => p.text).join('\n') : '');
    await parser.destroy();
  } catch (err) {
    throw new Error(`Failed to extract text from PDF: ${err.message}. Ensure the file is not password-protected.`);
  }

  if (!text || text.trim().length === 0) {
    throw new Error('PDF appears to be empty or contains scanned images without selectable text.');
  }

  const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 1. Filter out non-transaction header/footer lines
  const filteredLines = rawLines.filter(l => 
    !/^SAMPLE DOCUMENT|^SAMPLE BANK|^Account Name|^Account Type|^Account Number|^Branch:|^IFSC:|^Statement Period:|^Customer ID:|^Currency:|^Date\s+Description|^--\s*\d+\s*of\s*\d+\s*--|^This is a computer-generated|^Page\s+\d+/i.test(l)
  );

  // 2. Stitch continuation lines (lines that do not start with a date belong to previous transaction)
  const dateStartRegex = /^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|\d{1,2}[\s\-\/\.](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-\/\.]\d{2,4})\b/i;

  const physicalRows = [];
  for (const l of filteredLines) {
    if (dateStartRegex.test(l)) {
      physicalRows.push(l);
    } else if (physicalRows.length > 0) {
      physicalRows[physicalRows.length - 1] += ' ' + l;
    }
  }

  // 3. Parse each transaction row
  const rows = [];
  for (const line of physicalRows) {
    // Skip summary lines (opening/closing balance, running b/f, totals)
    if (/OPENING\s+BALANCE|CLOSING\s+BALANCE|\bTOTAL\b|BALANCE\s+B\/F|BALANCE\s+C\/F/i.test(line)) {
      continue;
    }

    const dateMatch = line.match(dateStartRegex);
    if (!dateMatch) continue;

    const rawDate = dateMatch[0].trim();
    const rest = line.slice(dateMatch.index + dateMatch[0].length).trim();

    let narration = rest;
    let debit = '';
    let credit = '';
    let balance = '';

    // Monetary amounts at the end of the line (e.g., "12,000.00 18,200.00" or "450.00 10,127.00")
    const trailingThree = rest.match(/^(.*?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})$/);
    const trailingTwo = rest.match(/^(.*?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})$/);
    const trailingOne = rest.match(/^(.*?)\s+([\d,]+\.\d{2})$/);

    if (trailingThree) {
      narration = trailingThree[1].trim();
      debit = trailingThree[2];
      credit = trailingThree[3];
      balance = trailingThree[4];
    } else if (trailingTwo) {
      narration = trailingTwo[1].trim();
      const amountVal = trailingTwo[2];
      balance = trailingTwo[3];

      const isCr = /\b(cr|credit|deposit|dep|refund|interest|salary|scholarship|cashback)\b/i.test(narration);
      if (isCr) {
        credit = amountVal;
      } else {
        debit = amountVal;
      }
    } else if (trailingOne) {
      narration = trailingOne[1].trim();
      const amountVal = trailingOne[2];

      const isCr = /\b(cr|credit|deposit|dep|refund|interest|salary|scholarship|cashback)\b/i.test(narration);
      if (isCr) {
        credit = amountVal;
      } else {
        debit = amountVal;
      }
    } else {
      // Fallback: line might have integer amount (e.g. 500)
      const fallbackTwo = rest.match(/^(.*?)\s+([\d,]+(?:\.\d{1,2})?)\s+([\d,]+(?:\.\d{1,2})?)$/);
      if (fallbackTwo) {
        narration = fallbackTwo[1].trim();
        const amountVal = fallbackTwo[2];
        balance = fallbackTwo[3];
        const isCr = /\b(cr|credit|deposit|dep|refund|interest|salary|scholarship|cashback)\b/i.test(narration);
        if (isCr) credit = amountVal;
        else debit = amountVal;
      } else {
        continue;
      }
    }

    rows.push([rawDate, narration, debit, credit, balance]);
  }

  if (rows.length === 0) {
    throw new Error('Could not find transaction records in this PDF. Please check if it contains a standard bank statement table.');
  }

  const headers = ['Date', 'Description', 'Debit', 'Credit', 'Balance'];
  return {
    headers,
    rows,
    headerRowIndex: 0,
    columnGuess: { date: 0, description: 1, debit: 2, credit: 3, amount: -1, balance: 4 },
    totalRows: rows.length
  };
}

/**
 * Find the header row by scanning for known keywords (up to 50 rows)
 */
function findHeaderRow(rows) {
  const maxScan = Math.min(rows.length, 50);
  for (let i = 0; i < maxScan; i++) {
    const row = rows[i].map(cell => String(cell).toLowerCase().trim());
    const hasDate = row.some(cell => DATE_KEYWORDS.some(k => cell.includes(k)));
    const hasDesc = row.some(cell => DESC_KEYWORDS.some(k => cell.includes(k)));
    const hasMoney = row.some(cell => DEBIT_KEYWORDS.some(k => cell.includes(k)) || CREDIT_KEYWORDS.some(k => cell.includes(k)) || AMOUNT_KEYWORDS.some(k => cell === k));
    if (hasDate && (hasDesc || hasMoney)) {
      return i;
    }
  }
  return 0; // default to first row
}

/**
 * Auto-detect column mapping
 */
function guessColumns(headerRow) {
  const mapping = { date: -1, description: -1, debit: -1, credit: -1, amount: -1, balance: -1 };
  
  headerRow.forEach((cell, idx) => {
    const lower = String(cell).toLowerCase().trim();
    if (mapping.date === -1 && DATE_KEYWORDS.some(k => lower.includes(k))) mapping.date = idx;
    if (mapping.description === -1 && DESC_KEYWORDS.some(k => lower.includes(k))) mapping.description = idx;
    if (mapping.debit === -1 && DEBIT_KEYWORDS.some(k => lower.includes(k))) mapping.debit = idx;
    if (mapping.credit === -1 && CREDIT_KEYWORDS.some(k => lower.includes(k))) mapping.credit = idx;
    if (mapping.amount === -1 && AMOUNT_KEYWORDS.some(k => lower === k || lower.includes('amt'))) mapping.amount = idx;
    if (mapping.balance === -1 && BALANCE_KEYWORDS.some(k => lower.includes(k))) mapping.balance = idx;
  });
  
  return mapping;
}

/**
 * Parse an amount string - strip commas, currency symbols, handle Dr/Cr
 */
function parseAmount(value) {
  if (value === null || value === undefined || value === '') return null;
  let str = String(value).trim();
  str = str.replace(/[₹$,\s]/g, '');
  str = str.replace(/\(([\d.]+)\)/, '-$1');
  const num = parseFloat(str);
  return isNaN(num) ? null : Math.abs(num);
}

/**
 * Parse Indian & International date formats safely, including Excel serial dates
 */
function parseDate(value) {
  if (!value) return null;

  // Handle native Date object
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }

  // Handle Excel serial numeric date (e.g., 45535)
  if (typeof value === 'number' || (/^\d{4,5}$/.test(String(value).trim()) && !String(value).includes('-') && !String(value).includes('/'))) {
    const num = Number(value);
    if (num > 30000 && num < 65000) {
      // Excel epoch date calculation (days since 1899-12-30)
      const dateInfo = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(dateInfo.getTime())) {
        return new Date(dateInfo.getFullYear(), dateInfo.getMonth(), dateInfo.getDate());
      }
    }
  }

  const str = String(value).trim();

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  let match = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return isNaN(d.getTime()) ? null : d;
  }

  // YYYY-MM-DD (ISO)
  match = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (match) {
    const [, year, month, day] = match;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return isNaN(d.getTime()) ? null : d;
  }

  // DD-MM-YY
  match = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/);
  if (match) {
    const [, day, month, shortYear] = match;
    const year = parseInt(shortYear, 10) > 50 ? 1900 + parseInt(shortYear, 10) : 2000 + parseInt(shortYear, 10);
    const d = new Date(year, Number(month) - 1, Number(day));
    return isNaN(d.getTime()) ? null : d;
  }

  // DD MMM YYYY (e.g. 15 Sep 2026 or 01-Jan-2026)
  match = str.match(/^(\d{1,2})[\s\-\/\.]([A-Za-z]{3,9})[\s\-\/\.](\d{2,4})$/);
  if (match) {
    const d = new Date(`${match[1]} ${match[2]} ${match[3].length === 2 ? '20' + match[3] : match[3]}`);
    if (!isNaN(d.getTime())) return d;
  }

  // Fallback native parsing
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Main parse function - takes a file buffer + original filename
 */
async function parseFile(buffer, filename) {
  const ext = filename.toLowerCase().split('.').pop();
  let rawData;
  let sheetNames = [];

  if (ext === 'csv') {
    rawData = parseCSV(buffer);
  } else if (ext === 'xls' || ext === 'xlsx') {
    const result = parseExcel(buffer);
    rawData = result.data;
    sheetNames = result.sheetNames;
  } else if (ext === 'pdf') {
    return await parsePDF(buffer);
  } else {
    throw new Error('Unsupported file format. Please upload CSV, XLS, XLSX, or PDF bank statements.');
  }

  if (!rawData || rawData.length < 2) {
    throw new Error('File is empty or has insufficient data.');
  }

  const headerRowIndex = findHeaderRow(rawData);
  const headers = rawData[headerRowIndex].map(h => String(h).trim());
  const columnGuess = guessColumns(headers);
  const dataRows = rawData.slice(headerRowIndex + 1).filter(row => row.some(cell => String(cell).trim()));

  return {
    headers,
    rows: dataRows,
    headerRowIndex,
    columnGuess,
    totalRows: dataRows.length,
    sheetNames
  };
}

/**
 * Process rows with confirmed column mapping into transaction-ready objects
 */
function processRows(rows, mapping, overrides = {}) {
  const validRows = [];
  const invalidRows = [];

  rows.forEach((row, index) => {
    const dateVal = mapping.date >= 0 ? row[mapping.date] : null;
    const descVal = mapping.description >= 0 ? row[mapping.description] : '';
    const debitVal = mapping.debit >= 0 ? row[mapping.debit] : null;
    const creditVal = mapping.credit >= 0 ? row[mapping.credit] : null;
    const amountVal = mapping.amount >= 0 ? row[mapping.amount] : null;
    const categoryVal = mapping.category !== undefined && mapping.category >= 0 ? row[mapping.category] : null;

    const date = parseDate(dateVal);
    const description = String(descVal).trim();
    const errors = [];

    if (!date) errors.push('Invalid or missing date');

    let amount = null;
    let type = null;

    if (mapping.debit >= 0 && mapping.credit >= 0) {
      const debit = parseAmount(debitVal);
      const credit = parseAmount(creditVal);
      if (debit && debit > 0) { amount = debit; type = 'expense'; }
      else if (credit && credit > 0) { amount = credit; type = 'income'; }
      else errors.push('No valid amount in debit/credit columns');
    } else if (mapping.amount >= 0) {
      const parsed = parseAmount(amountVal);
      if (parsed !== null && parsed > 0) {
        amount = parsed;
        const origStr = String(amountVal).trim();
        type = (origStr.startsWith('-') || /dr/i.test(origStr) || /dr$/i.test(String(descVal))) ? 'expense' : 'income';
      } else {
        errors.push('Invalid or zero amount');
      }
    } else {
      errors.push('No amount column mapped');
    }

    if (errors.length > 0) {
      invalidRows.push({ rowIndex: index, row, errors });
    } else {
      validRows.push({
        date,
        note: description || 'Bank Transaction',
        amount,
        type,
        rowIndex: index,
        category: overrides[index] || categoryVal || null
      });
    }
  });

  return { validRows, invalidRows };
}

module.exports = { parseFile, processRows, parseDate, parseAmount, normalizeNote: (n) => n };
