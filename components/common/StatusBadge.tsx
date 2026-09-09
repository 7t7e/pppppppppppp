import React from 'react';
import { CheckCircle2, AlertCircle, Clock, ShieldAlert, Sparkles, FileEdit } from 'lucide-react';
import { ProcessingStatus, ReviewStatus, PriorityLevel } from '../../types';

interface StatusBadgeProps {
  type: 'processing' | 'review' | 'priority' | 'tissue' | 'qc';
  value: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1';

  if (type === 'processing') {
    switch (value as ProcessingStatus) {
      case 'completed':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            مكتمل التحليل
          </span>
        );
      case 'analyzing':
      case 'scanning':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 animate-pulse ${sizeClasses}`}>
            <Sparkles className="w-3.5 h-3.5" />
            قيد المعالجة
          </span>
        );
      case 'draft':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
            <FileEdit className="w-3.5 h-3.5" />
            مسودة
          </span>
        );
      case 'failed':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
            <AlertCircle className="w-3.5 h-3.5" />
            فشل المعالجة
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
            <Clock className="w-3.5 h-3.5" />
            في الانتظار
          </span>
        );
    }
  }

  if (type === 'review') {
    switch (value as ReviewStatus) {
      case 'approved':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            معتمد من اختصاصي علم الأمراض
          </span>
        );
      case 'reviewed':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-teal-50 text-teal-700 border border-teal-200 ${sizeClasses}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            تمت المراجعة
          </span>
        );
      case 'rejected':
      case 'retest':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
            <AlertCircle className="w-3.5 h-3.5" />
            تحتاج إعادة فحص
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
            <Clock className="w-3.5 h-3.5" />
            بانتظار المراجعة
          </span>
        );
    }
  }

  if (type === 'priority') {
    if (value === 'stat') {
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          عاجل (STAT)
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 font-normal rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
        روتيني
      </span>
    );
  }

  if (type === 'tissue') {
    switch (value) {
      case 'healthy':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            نسيج سليم
          </span>
        );
      case 'damaged':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded-md bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            نسيج متضرر / ضامر
          </span>
        );
      case 'transition':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded-md bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            منطقة انتقالية
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded-md bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            غير مصنف
          </span>
        );
    }
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-700 ${sizeClasses}`}>
      {value}
    </span>
  );
};
