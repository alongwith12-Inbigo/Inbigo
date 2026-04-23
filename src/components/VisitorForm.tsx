/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DAYS_MAP, ReservationData, cleanCarNumber } from '../lib/dateUtils';
import { Calendar, User, Building2, Phone, Car, FileText, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

interface VisitorFormProps {
  onSuccess: (data: any[]) => void;
}

const INITIAL_STATE: ReservationData = {
  startDate: format(new Date(), 'yyyy-MM-dd'),
  endDate: format(new Date(), 'yyyy-MM-dd'),
  selectedDays: [],
  isRepeating: false,
  teacherName: '',
  visitTime: '09:00',
  visitorName: '',
  visitorOrg: '',
  reason: '',
  hasVehicle: false,
  carNumber: '',
  remarks: '',
};

export default function VisitorForm({ onSuccess }: VisitorFormProps) {
  const [formData, setFormData] = useState<ReservationData>(INITIAL_STATE);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.isRepeating && formData.selectedDays.length === 0) {
      alert('반복 예약을 위해 최소 하나 이상의 요일을 선택해주세요.');
      return;
    }

    onSuccess([formData]);
    setFormData(INITIAL_STATE); // Reset form after submission
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="bento-label">신청 교사명</label>
            <input
              type="text"
              required
              placeholder="예: 홍길동"
              className="bento-input"
              value={formData.teacherName}
              onChange={e => setFormData({ ...formData, teacherName: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="bento-label">방문 시간</label>
            <select
              className="bento-input font-mono"
              value={formData.visitTime}
              onChange={e => setFormData({ ...formData, visitTime: e.target.value })}
            >
              {Array.from({ length: (17 - 7) * 2 + 1 }).map((_, i) => {
                const hour = 7 + Math.floor(i / 2);
                const min = i % 2 === 0 ? '00' : '30';
                const time = `${hour.toString().padStart(2, '0')}:${min}`;
                return <option key={time} value={time}>{time}</option>;
              })}
            </select>
          </div>
        </div>

        <div className={`grid gap-3 transition-all ${formData.isRepeating ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div className="space-y-1">
            <label className="bento-label">{formData.isRepeating ? '방문 시작일' : '방문 날짜'}</label>
            <input
              type="date"
              required
              className="bento-input"
              value={formData.startDate}
              onChange={e => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          {formData.isRepeating && (
            <div className="space-y-1">
              <label className="bento-label">방문 종료일</label>
              <input
                type="date"
                required
                className="bento-input"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">반복 설정</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold">사용</span>
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                checked={formData.isRepeating}
                onChange={e => setFormData({ ...formData, isRepeating: e.target.checked })}
              />
            </div>
          </label>

          {formData.isRepeating && (
            <>
              <div className="grid grid-cols-7 gap-1">
                {DAYS_MAP.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${
                      formData.selectedDays.includes(day.value)
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100 scale-105 z-10'
                        : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200'
                    }`}
                  >
                    <span className="text-[10px] font-bold">{day.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 text-center italic">종료일까지 지정된 요일에 자동 예약 생성</p>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="bento-label">방문자 성함</label>
            <input
              type="text"
              required
              placeholder="예: 김철수"
              className="bento-input"
              value={formData.visitorName}
              onChange={e => setFormData({ ...formData, visitorName: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="bento-label">소속 (선택)</label>
            <input
              type="text"
              placeholder="예: OO초등학교, 업체명 등"
              className="bento-input"
              value={formData.visitorOrg}
              onChange={e => setFormData({ ...formData, visitorOrg: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">

          <div className="space-y-1">
            <label className="bento-label">방문 사유</label>
            <select
              required
              className="bento-input"
              value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
            >
              <option value="">사유를 선택하세요</option>
              <option value="장학/지도">장학/지도</option>
              <option value="강사 출입">강사 출입</option>
              <option value="회의 참여">회의 참여</option>
              <option value="학부모 상담">학부모 상담</option>
              <option value="업체 미팅">업체 미팅</option>
              <option value="기타">기타</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="bento-label flex items-center justify-between">
              차량번호 (선택)
              <label className="flex items-center gap-2 cursor-pointer normal-case font-normal text-slate-400">
                <input 
                  type="checkbox" 
                  className="rounded"
                  checked={formData.hasVehicle}
                  onChange={e => setFormData({ ...formData, hasVehicle: e.target.checked })}
                />
                <span className="text-[10px]">차량 이용</span>
              </label>
            </label>
            <input
              type="text"
              required={formData.hasVehicle}
              disabled={!formData.hasVehicle}
              placeholder={formData.hasVehicle ? "12가 3456" : "차량 이용 시 체크해주세요"}
              className={`bento-input ${!formData.hasVehicle && 'opacity-50 grayscale'}`}
              value={formData.carNumber}
              onChange={e => setFormData({ ...formData, carNumber: cleanCarNumber(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-4 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-[0.98]"
      >
        등록하기
      </button>
    </form>
  );
}
