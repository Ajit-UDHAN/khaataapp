import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ startDate, endDate, onChange }) => {
  const [showCustom, setShowCustom] = useState(false);
  const [preset, setPreset] = useState('');

  const presets = [
    { value: 'today', label: 'Today' },
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const getDateRange = (presetValue: string) => {
    const now = new Date();
    const ranges = {
      today: {
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0]
      },
      '7days': {
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      },
      '30days': {
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      },
      '3months': {
        startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      },
      '6months': {
        startDate: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      },
      year: {
        startDate: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      }
    };
    return ranges[presetValue as keyof typeof ranges];
  };

  const handlePresetChange = (presetValue: string) => {
    setPreset(presetValue);
    if (presetValue === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      const range = getDateRange(presetValue);
      if (range) {
        onChange(range);
      }
    }
  };

  const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const newRange = field === 'startDate' 
      ? { startDate: value, endDate }
      : { startDate, endDate: value };
    onChange(newRange);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <select
          value={preset}
          onChange={(e) => handlePresetChange(e.target.value)}
          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
        >
          <option value="">Select Date Range</option>
          {presets.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
      </div>

      {showCustom && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;