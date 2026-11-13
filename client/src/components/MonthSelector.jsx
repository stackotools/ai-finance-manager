import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonth } from '../utils/formatters';

const MonthSelector = ({ selectedMonth, onChange }) => {
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-');
    const prevDate = new Date(year, parseInt(month) - 2);
    const newMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    onChange(newMonthStr);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-');
    const nextDate = new Date(year, parseInt(month));
    const newMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    onChange(newMonthStr);
  };

  const isNextDisabled = () => {
    const now = new Date();
    const futureLimit = new Date(now.getFullYear() + 1, now.getMonth());
    const [year, month] = (selectedMonth || '').split('-');
    if (!year || !month) return false;
    const cur = new Date(Number(year), Number(month) - 1);
    return cur >= futureLimit;
  };

  return (
    <div className="flex items-center space-x-4 bg-white px-4 py-2 rounded-md shadow-sm border border-gray-200">
      <button
        onClick={handlePrevMonth}
        className="p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="text-base font-medium text-gray-900 min-w-[120px] text-center">
        {formatMonth(selectedMonth)}
      </span>
      <button
        onClick={handleNextMonth}
        disabled={isNextDisabled()}
        className={`p-1 rounded-full ${
          isNextDisabled()
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500'
        }`}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};

export default MonthSelector;
