import React from 'react';
import {
  Printer,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
} from 'lucide-react';
import { SampleRecord, UserProfile } from '../../types';

interface PrintableReportViewProps {
  sample: SampleRecord;
  currentUser: UserProfile;
  onBack: () => void;
}

export const PrintableReportView: React.FC<PrintableReportViewProps> = ({
  sample,
  currentUser,
  onBack,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const quant = sample.quantitative;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Action Toolbar (Hidden during print) */}
      <div className="no-print flex items-center justify-between pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-lg transition"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى العينة</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-[#D95B26] hover:bg-[#C24C1B] text-white px-5 py-2 rounded-lg text-xs font-bold shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير الطبي (A4)</span>
          </button>
        </div>
      </div>

      {/* A4 Medical Report Container */}
      <div className="bg-white border border-slate-300 rounded-xl p-8 sm:p-12 shadow-sm text-slate-800 space-y-6 print:border-0 print:p-0 print:shadow-none font-sans">
        {/* Report Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#D95B26] flex items-center justify-center text-white font-black text-sm">
                PT
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">PanTissue AI</span>
              <span className="text-[10px] bg-orange-100 text-[#D95B26] font-bold px-1.5 py-0.5 rounded">
                SaaS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              منصة التشخيص النسيجي ثلاثي الأبعاد • Pan-Tissue Nanomolecular Diagnostic Platform
            </p>
            <p className="text-[11px] text-slate-400">
              مختبر التشخيص الجزيئي والباثولوجي المتقدم
            </p>
          </div>

          <div className="text-left text-xs font-mono space-y-1">
            <div className="font-bold text-slate-900 text-sm">تقرير تشخيصي نسيجي</div>
            <div className="text-slate-500">رقم التقرير: REP-{sample.id}</div>
            <div className="text-slate-500">تاريخ الإصدار: {new Date().toLocaleDateString('ar-SA')}</div>
            <div className="text-emerald-700 font-bold">
              {sample.review.reviewStatus === 'approved' ? 'معتمد رسمياً' : 'مسودة قيد المراجعة'}
            </div>
          </div>
        </div>

        {/* Patient & Specimen Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">اسم المريض:</span>
            <span className="font-bold text-slate-900">{sample.patient.fullName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">الرقم الطبي (MRN):</span>
            <span className="font-mono font-semibold text-slate-900">{sample.patient.mrn}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">العمر / الجنس:</span>
            <span>{sample.patient.age} سنة • {sample.patient.gender === 'female' ? 'أنثى' : 'ذكر'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">رقم العينة (Sample ID):</span>
            <span className="font-mono font-bold text-slate-900">{sample.id}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">العضو والموقع:</span>
            <span className="font-medium text-slate-900">{sample.anatomicalSite}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">نوع العينة:</span>
            <span>{sample.specimenType}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">القسم الطالب:</span>
            <span>{sample.order.orderingDepartment}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">الطبيب المحيل:</span>
            <span>{sample.order.orderingProvider}</span>
          </div>
        </div>

        {/* Executive Results Summary (DAI) */}
        {quant && (
          <div className="border border-slate-200 rounded-lg p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 tracking-wider">ملخص النتائج الكمية للتحليل النسيجي</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center py-2 bg-slate-50/70 rounded-md">
              <div>
                <span className="text-xs text-slate-500 block">مؤشر الضمور الرقمي (DAI)</span>
                <span className="text-2xl font-black text-[#D95B26] font-mono">{quant.daiPercent}%</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">الحجم الوظيفي السليم</span>
                <span className="text-2xl font-black text-emerald-600 font-mono">{quant.healthyPercent}%</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">حجم النسيج الكلي</span>
                <span className="text-2xl font-black text-slate-800 font-mono">{quant.totalVolume} mm³</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">متوسط ثقة النموذج</span>
                <span className="text-2xl font-black text-slate-800 font-mono">{quant.averageConfidence}%</span>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">معادلة الحساب: </span>
              <span className="font-mono">DAI = (1 - {quant.healthyVolume} / {quant.totalVolume}) × 100% = {quant.daiPercent}%</span>
            </p>
          </div>
        )}

        {/* 3D Static Visual Snapshot & Quantitative Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-slate-200 rounded-lg p-4 text-xs space-y-2">
            <h4 className="font-bold text-slate-800">التمثيل الحجمي 3D والتوزع المكاني</h4>
            <div className="h-36 bg-slate-100 rounded flex items-center justify-center text-slate-400 border border-slate-200 relative overflow-hidden">
              <div className="w-16 h-16 rounded-full bg-emerald-500/80 absolute -top-2 left-6"></div>
              <div className="w-14 h-14 rounded-full bg-rose-500/80 absolute bottom-3 right-8"></div>
              <div className="w-10 h-10 rounded-full bg-amber-500/80 absolute top-8 right-16"></div>
              <span className="z-10 font-medium text-slate-700 bg-white/90 px-3 py-1 rounded shadow-xs">
                خريطة التجزئة النانوية ثلاثية الأبعاد
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>سليم</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span>متضرر</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span>منطقة انتقالية</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 text-xs space-y-2">
            <h4 className="font-bold text-slate-800">بيانات المسح والضوابط الجزيئية</h4>
            <div className="space-y-1.5 font-mono text-[11px] text-slate-600">
              <div className="flex justify-between"><span>الماسح:</span><span>{sample.scanRun?.scannerId || 'Optical 3D-Pro'}</span></div>
              <div className="flex justify-between"><span>لوحة VHH:</span><span className="text-[#D95B26] font-semibold">{sample.quality.vhhPanel}</span></div>
              <div className="flex justify-between"><span>دقة الفوكسل:</span><span>{sample.scanRun?.voxelSize || '0.25 µm³'}</span></div>
              <div className="flex justify-between"><span>جودة الإشارة (SNR):</span><span>{sample.quality.snr}</span></div>
              <div className="flex justify-between"><span>خوارزمية الذكاء:</span><span>PT-AI v0.9.0 (3D U-Net)</span></div>
            </div>
          </div>
        </div>

        {/* Pathologist Final Interpretation */}
        <div className="border border-slate-200 rounded-lg p-5 space-y-3">
          <h4 className="text-xs font-bold text-slate-800">التفسير والتشخيص المعتمد من اختصاصي علم الأمراض</h4>
          <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">
            {sample.review.preliminaryImpression || 'لم يتم تسجيل ملاحظات تشخيصية من الطبيب بعد.'}
          </p>

          {sample.review.recommendation && (
            <p className="text-xs text-slate-700">
              <span className="font-bold">التوصية السريرية: </span>
              <span>{sample.review.recommendation}</span>
            </p>
          )}
        </div>

        {/* Signature & Approval Section */}
        <div className="flex items-end justify-between pt-6 border-t border-slate-300 text-xs">
          <div className="space-y-1">
            <div className="text-slate-500">اسم اختصاصي علم الأمراض:</div>
            <div className="font-bold text-slate-900 text-sm">
              {sample.review.approvedBy || currentUser.name || 'د. اختصاصي علم الأمراض'}
            </div>
            <div className="text-[11px] text-slate-500">
              <span>{currentUser.title || 'استشاري علم الأمراض والتشخيص النسيجي'}</span>
              {currentUser.licenseNumber && (
                <span className="mr-2 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  ترخيص: {currentUser.licenseNumber}
                </span>
              )}
              {currentUser.hospital && (
                <span className="mr-2">({currentUser.hospital})</span>
              )}
            </div>
          </div>

          <div className="text-left space-y-1">
            <div className="text-slate-500">التوقيع الرقمي المعتمد:</div>
            <div className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded inline-block">
              {sample.review.digitalSignature || 'PENDING-PATHOLOGIST-APPROVAL'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {sample.review.approvedAt ? new Date(sample.review.approvedAt).toLocaleDateString('ar-SA') : '—'}
            </div>
          </div>
        </div>

        {/* Legal Regulatory Footer Note */}
        <div className="text-[10px] text-slate-400 text-center pt-4 border-t border-slate-100 leading-normal">
          تنبيه: هذا التقرير تم إعداده بمساعدة منصة PanTissue AI المساندة للقرار السريري، وتخضع جميع النتائج للمراجعة والاعتماد النهائي من اختصاصي علم الأمراض المؤهل وفقاً للأنظمة الصحية المعمول بها.
        </div>
      </div>
    </div>
  );
};
