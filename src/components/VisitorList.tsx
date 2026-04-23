/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { format, isToday, isAfter, startOfDay } from 'date-fns';
import { User, Clock, Building2, Car, MapPin, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface VisitorEntry {
  id: string;
  date: string;
  time: string;
  teacherName: string;
  visitorName: string;
  visitorOrg: string;
  reason: string;
  hasVehicle: boolean;
  carNumber: string;
  remarks: string;
}

interface VisitorListProps {
  entries: VisitorEntry[];
  onPrint: () => void;
}

export default function VisitorList({ entries, onPrint }: VisitorListProps) {
  const [filter, setFilter] = React.useState<'today' | 'upcoming' | 'all'>('today');

  const filteredEntries = entries.filter(entry => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    // Ensure accurate date comparison by trimming any potential whitespace
    const entryDate = String(entry.date || '').trim();
    
    if (filter === 'today') return entryDate === todayStr;
    if (filter === 'upcoming') return entryDate > todayStr;
    return true;
  }).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => setFilter('today')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
              filter === 'today' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            오늘
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
              filter === 'upcoming' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            예정
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
              filter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            전체
          </button>
        </div>

        {filter === 'today' && filteredEntries.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrint();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-xs uppercase tracking-widest active:scale-95"
          >
            <Printer className="w-4 h-4" />
            PDF 인쇄
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              {filter !== 'today' && <th className="text-left py-3">방문일</th>}
              <th className="text-left py-3">방문시간</th>
              <th className="text-left py-3">방문자(소속)</th>
              <th className="text-left py-3">차량번호</th>
              <th className="text-left py-3 hidden md:table-cell">방문사유</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                {filter !== 'today' && (
                  <td className="py-4 font-mono font-bold text-blue-600/70">{entry.date}</td>
                )}
                <td className="py-4 font-mono font-bold text-slate-600">{entry.time}</td>
                <td className="py-4">
                  <div className="font-bold text-slate-800">{entry.visitorName}</div>
                  <div className="text-[10px] text-slate-400">{entry.visitorOrg || '개인 방문'}</div>
                </td>
                <td className="py-4">
                  {entry.hasVehicle && entry.carNumber ? (
                    <span className="font-mono text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                      {entry.carNumber}
                    </span>
                  ) : (
                    <span className="text-slate-300 text-xs">-</span>
                  )}
                </td>
                <td className="py-4 hidden md:table-cell text-slate-500 max-w-[200px] truncate">
                  {entry.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredEntries.length === 0 && (
          <div className="py-20 text-center space-y-2">
            <p className="text-slate-300 font-bold uppercase tracking-widest text-xs">데이터가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
