/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisitorEntry } from './VisitorList';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface PrintTableProps {
  entries: VisitorEntry[];
}

export default function PrintTable({ entries }: PrintTableProps) {
  const today = format(new Date(), 'yyyy년 MM월 dd일(E)', { locale: ko });

  return (
    <div id="print-area" className="hidden print:block p-10 bg-white min-h-screen">
      <div className="max-w-[210mm] mx-auto">
        <div className="mb-10 text-center pb-8 border-b-4 border-gray-900">
          <h1 className="text-3xl font-bold mb-4 tracking-tight">[똑똑 인비고] 교직원용 방문객 예약 관리</h1>
          <p className="text-xl text-gray-800 font-bold">오늘의 날짜: {today}</p>
        </div>

        <table className="w-full border-collapse border-2 border-gray-900 table-fixed">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-900 p-1 text-[12px] font-bold w-[6%]">번호</th>
              <th className="border border-gray-900 p-1 text-[12px] font-bold w-[10%]">방문시간</th>
              <th className="border border-gray-900 p-1 text-[12px] font-bold w-[12%]">방문자</th>
              <th className="border border-gray-900 p-1 text-[12px] font-bold w-[18%]">소속</th>
              <th className="border border-gray-900 p-1 text-[12px] font-bold w-[18%]">방문 사유</th>
              <th className="border border-gray-900 p-1 text-[12px] font-bold w-[16%]">차량번호</th>
              <th className="border border-gray-900 p-1 text-[12px] font-bold w-[12%]">신청 교사</th>
              <th className="border border-gray-900 p-1 text-[12px] font-bold w-[8%]">비고</th>
            </tr>
          </thead>
          <tbody>
            {entries.length > 0 ? entries.map((entry, index) => (
              <tr key={entry.id} className="text-center font-sans text-[12px] leading-tight">
                <td className="border border-gray-900 p-1 truncate">{index + 1}</td>
                <td className="border border-gray-900 p-1 font-mono tracking-tighter whitespace-nowrap">{entry.time}</td>
                <td className="border border-gray-900 p-1 font-bold whitespace-nowrap">{entry.visitorName}</td>
                <td className="border border-gray-900 p-1 text-left truncate">{entry.visitorOrg || '-'}</td>
                <td className="border border-gray-900 p-1 text-left truncate">{entry.reason}</td>
                <td className="border border-gray-900 p-1 font-bold whitespace-nowrap">{entry.carNumber || '-'}</td>
                <td className="border border-gray-900 p-1 whitespace-nowrap">{entry.teacherName}</td>
                <td className="border border-gray-900 p-1"></td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="border border-gray-900 p-10 text-center text-gray-400 font-medium">
                  오늘의 방문 예약 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-8 text-[10px] text-gray-600 font-mono text-right space-y-0.5">
          <div>v1.0.0 | © 2026 INBIGO. All Rights Reserved.</div>
          <div>Printed on {new Date().toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
