import React from 'react';
import {
  TestTubes,
  AlertTriangle,
  PlusCircle,
  Cpu,
  Eye,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { SampleRecord, UserProfile } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface DashboardViewProps {
  samples: SampleRecord[];
  currentUser: UserProfile;
  onAddNewSample: () => void;
  onViewSample: (sampleId: string) => void;
  onViewAllSamples: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  samples,
  currentUser,
  onAddNewSample,
  onViewSample,
  onViewAllSamples,
}) => {
  // Compute real counts strictly from database
  const totalSamples = samples.length;
  const inAnalysisCount = samples.filter(
    (s) => s.processingStatus === 'analyzing' || s.processingStatus === 'scanning'
  ).length;
  const readyForReviewCount = samples.filter(
    (s) => s.processingStatus === 'completed' && s.review.reviewStatus === 'pending'
  ).length;
  const urgentCount = samples.filter(
    (s) => s.order.priority === 'stat' && s.review.reviewStatus !== 'approved'
  ).length;

  const recentSamples = samples.slice(0, 6);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Hero Welcome Banner (Clean White & Orange) */}
      <div className="bg-white rounded-2xl border-2 border-orange-200/90 p-6 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-orange-100/40 rounded-full blur-3xl pointer-events-none -translate-x-12 -translate-y-12" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-[#D95B26] px-3 py-1 rounded-full text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#D95B26] animate-pulse" />
              <span>منظومة الفحص النسيجي النانوي • PanTissue AI</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              مرحباً بك، <span className="text-[#D95B26]">{currentUser.name}</span>
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              فحص وتحليل الخزعات النسيجية ثلاثية الأبعاد بدقة نانوية (0.12 μm) دون تقطيع متلف، وحساب مؤشر الشذوذ النسيجي (DAI).
            </p>
          </div>

          {/* Primary Action Button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onAddNewSample}
              className="inline-flex items-center justify-center gap-2 bg-[#D95B26] hover:bg-[#C24C1B] text-white px-5 py-3 rounded-xl text-sm font-bold shadow-md shadow-orange-600/20 transition active:scale-98"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ فحص عينة نسيجية جديدة</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Clinical KPI Cards (High Contrast & Clear) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Samples */}
        <div
          onClick={onViewAllSamples}
          className="bg-white hover:bg-orange-50/30 rounded-2xl border-2 border-orange-100 hover:border-orange-300 p-5 shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">إجمالي العينات</span>
            <div className="w-9 h-9 rounded-xl bg-orange-100/70 text-[#D95B26] flex items-center justify-center group-hover:scale-105 transition">
              <TestTubes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {totalSamples}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#D95B26] font-semibold mt-2">
            <span>استعراض السجلات</span>
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition" />
          </div>
        </div>

        {/* In Analysis */}
        <div className="bg-white rounded-2xl border-2 border-orange-100 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">قيد الفحص والمسح 3D</span>
            <div className="w-9 h-9 rounded-xl bg-orange-100/70 text-[#D95B26] flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-orange-600 font-mono">
            {inAnalysisCount}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-2">
            {inAnalysisCount > 0 ? 'معالجة جارية للكتلة الحجمية' : 'لا توجد عمليات معالجة جارية'}
          </div>
        </div>

        {/* Ready for Review */}
        <div className="bg-white rounded-2xl border-2 border-orange-100 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">جاهزة للاعتماد</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 font-mono">
            {readyForReviewCount}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-2">
            {readyForReviewCount > 0 ? 'بانتظار مصادقة استشاري الباثولوجي' : 'تم اعتماد كافة العينات'}
          </div>
        </div>

        {/* Urgent STAT Samples */}
        <div className="bg-white rounded-2xl border-2 border-orange-100 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">حالات عاجلة (STAT)</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600 font-mono">
            {urgentCount}
          </div>
          <div className="text-[11px] text-rose-600 font-semibold mt-2">
            {urgentCount > 0 ? 'أولوية للغرف الجراحية' : 'الوضع السريري مستقر'}
          </div>
        </div>
      </div>

      {/* Urgent Alerts Strip (Only shown if there are pending actions) */}
      {(urgentCount > 0 || readyForReviewCount > 0) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-orange-50/80 border border-orange-200">
          <div className="flex items-center gap-3 text-xs font-bold text-slate-800">
            {urgentCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{urgentCount} عينات عاجلة للعمليات</span>
              </span>
            )}
            {readyForReviewCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <Eye className="w-3.5 h-3.5" />
                <span>{readyForReviewCount} عينات بانتظار الاعتماد الطبي</span>
              </span>
            )}
          </div>
          <button
            onClick={onViewAllSamples}
            className="text-xs text-[#D95B26] hover:underline font-bold self-end sm:self-auto"
          >
            الانتقال لجدول العينات ←
          </button>
        </div>
      )}

      {/* Recent Samples Table (Spacious Full-Width Layout) */}
      <div className="bg-white rounded-2xl border-2 border-orange-100/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-orange-100 flex items-center justify-between bg-orange-50/30">
          <div className="flex items-center gap-2">
            <TestTubes className="w-4 h-4 text-[#D95B26]" />
            <h3 className="text-sm font-bold text-slate-900">أحدث العينات النسيجية</h3>
          </div>
          {samples.length > 0 && (
            <button
              onClick={onViewAllSamples}
              className="text-xs text-[#D95B26] hover:text-[#C24C1B] font-bold flex items-center gap-1 bg-white border border-orange-200 px-3 py-1.5 rounded-lg shadow-2xs transition"
            >
              <span>عرض كافة السجلات ({samples.length})</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          {samples.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-12 h-12 bg-orange-50 text-[#D95B26] rounded-2xl flex items-center justify-center mx-auto border border-orange-200">
                <TestTubes className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">لا توجد عينات مسجلة حالياً</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                قم بإضافة عينة نسيجية لبدء الفحص ثلاثي الأبعاد والتحليل المجهري.
              </p>
              <button
                onClick={onAddNewSample}
                className="inline-flex items-center gap-1.5 bg-[#D95B26] hover:bg-[#C24C1B] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ إضافة عينة الآن</span>
              </button>
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead className="bg-orange-50/50 text-slate-600 font-bold border-b border-orange-100">
                <tr>
                  <th className="py-3.5 px-5">رقم العينة</th>
                  <th className="py-3.5 px-5">المريض / الـ MRN</th>
                  <th className="py-3.5 px-5">الموقع النسيجي والنوع</th>
                  <th className="py-3.5 px-5 text-center">مؤشر DAI</th>
                  <th className="py-3.5 px-5">الحالة</th>
                  <th className="py-3.5 px-5 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSamples.map((sample) => (
                  <tr key={sample.id} className="hover:bg-orange-50/30 transition">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                      {sample.id}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-800">{sample.patient.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{sample.patient.mrn}</div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-700">
                      <div className="font-medium">{sample.anatomicalSite}</div>
                      <div className="text-[11px] text-slate-400">{sample.specimenType}</div>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      {sample.quantitative ? (
                        <span className="inline-block font-mono font-black text-xs px-2.5 py-0.5 rounded-md bg-orange-100 text-[#D95B26] border border-orange-200">
                          {sample.quantitative.daiPercent}%
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge type="processing" value={sample.processingStatus} />
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <button
                        onClick={() => onViewSample(sample.id)}
                        className="px-3.5 py-1.5 text-xs text-[#D95B26] hover:bg-[#D95B26] hover:text-white border border-orange-200 rounded-lg font-bold transition inline-flex items-center gap-1 shadow-2xs"
                      >
                        <span>معاينة 3D</span>
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
