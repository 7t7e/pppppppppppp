import React, { useState } from 'react';
import {
  ArrowRight,
  Printer,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Activity,
  Layers,
  Microscope,
  Info,
  ChevronDown,
  ChevronUp,
  Cpu,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { SampleRecord, UserProfile } from '../../types';
import { Tissue3DViewer } from '../viewer/Tissue3DViewer';
import { StatusBadge } from '../common/StatusBadge';
import { db } from '../../services/db';

interface SampleDetailViewProps {
  sample: SampleRecord;
  currentUser: UserProfile;
  onBack: () => void;
  onViewReport: () => void;
  onSampleUpdated: (updated: SampleRecord) => void;
}

export const SampleDetailView: React.FC<SampleDetailViewProps> = ({
  sample,
  currentUser,
  onBack,
  onViewReport,
  onSampleUpdated,
}) => {
  // Collapsible sections
  const [openGeneral, setOpenGeneral] = useState(true);
  const [openQuality, setOpenQuality] = useState(true);
  const [openTechnical, setOpenTechnical] = useState(false);
  const [openQuantitative, setOpenQuantitative] = useState(true);
  const [openAudit, setOpenAudit] = useState(false);

  // Pathologist Review inputs
  const [impression, setImpression] = useState(sample.review.preliminaryImpression || '');
  const [recommendation, setRecommendation] = useState(sample.review.recommendation || '');
  const [isApproving, setIsApproving] = useState(false);

  const canApprove = currentUser.role === 'pathologist' || currentUser.role === 'admin';

  const handleApprove = () => {
    if (!canApprove) return;
    setIsApproving(true);

    const updatedReview = {
      ...sample.review,
      preliminaryImpression: impression,
      recommendation,
      reviewStatus: 'approved' as const,
      reviewedBy: currentUser.name,
      reviewedAt: new Date().toISOString(),
      approvedBy: currentUser.name,
      approvedAt: new Date().toISOString(),
      digitalSignature: `SIG-${currentUser.name}-${Date.now().toString(36).toUpperCase()}`,
    };

    const auditEntry = {
      id: 'aud-' + Date.now(),
      sampleId: sample.id,
      action: 'اعتماد التقرير النسيجي النهائي',
      actorName: currentUser.name,
      actorRole: currentUser.role,
      timestamp: new Date().toISOString(),
      details: `تمت مراجعة التشخيص واعتماده رقمياً بواسطة ${currentUser.title}`,
    };

    const updatedSample = db.updateSample(sample.id, {
      review: updatedReview,
      auditTrail: [auditEntry, ...(sample.auditTrail || [])],
    });

    if (updatedSample) {
      onSampleUpdated(updatedSample);
    }
    setIsApproving(false);
  };

  const quant = sample.quantitative;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button onClick={onBack} className="hover:text-slate-800 flex items-center gap-1">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>قاعدة بيانات العينات</span>
            </button>
            <span>/</span>
            <span className="font-mono text-slate-700 font-bold">{sample.id}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 font-mono">{sample.id}</h1>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-mono font-medium">
              {sample.accessionNumber}
            </span>
            <StatusBadge type="processing" value={sample.processingStatus} />
            <StatusBadge type="review" value={sample.review.reviewStatus} />
            {sample.order.priority === 'stat' && <StatusBadge type="priority" value="stat" />}
          </div>
        </div>

        {/* Top Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onViewReport}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>معاينة وطباعة التقرير (A4)</span>
          </button>

          {canApprove && sample.review.reviewStatus !== 'approved' && (
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="inline-flex items-center gap-1.5 bg-[#D95B26] hover:bg-[#C24C1B] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>اعتماد النتيجة والتقرير</span>
            </button>
          )}
        </div>
      </div>

      {/* Mandatory Clinical Disclaimer Banner */}
      <div className="bg-amber-50/80 border border-amber-300/80 rounded-xl p-3 flex items-center gap-3 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-700 shrink-0" />
        <p>
          <span className="font-bold">تنبيه سريري:</span> هذه النتيجة تحليلية مساندة بالذكاء الاصطناعي وتستلزم المراجعة والاعتماد النهائي من اختصاصي علم الأمراض. لا تستخدم كتشخيص نهائي منفرد.
        </p>
      </div>

      {/* 2-Column Responsive Desktop Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center Column: 3D Model & DAI Metric Card (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Interactive 3D Viewer */}
          <Tissue3DViewer
            measurements={quant?.measurements || []}
            totalVolume={quant?.totalVolume || sample.scanRun?.totalScanVolume || 12.8}
            daiPercent={quant?.daiPercent || 37.5}
            heightClass="h-[480px]"
          />

          {/* Primary DAI Card */}
          {quant && (
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 tracking-wider">مؤشر الضمور الرقمي</span>
                  <h3 className="text-lg font-bold text-slate-800">Digital Atrophy Index (DAI)</h3>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-[#D95B26] font-mono">
                    {quant.daiPercent}%
                  </span>
                  <span className="block text-[11px] font-semibold text-amber-700">
                    تصنيف الضرر: {quant.daiCategory === 'high' ? 'مرتفع' : quant.daiCategory === 'moderate' ? 'متوسط' : 'منخفض'}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${quant.healthyPercent}%` }}
                    title={`نسيج سليم: ${quant.healthyPercent}%`}
                  ></div>
                  <div
                    className="bg-amber-500 h-full"
                    style={{ width: `${quant.transitionVolume ? (quant.transitionVolume / quant.totalVolume) * 100 : 12}%` }}
                    title="منطقة انتقالية"
                  ></div>
                  <div
                    className="bg-[#D95B26] h-full"
                    style={{ width: `${quant.damagedPercent}%` }}
                    title={`نسيج متضرر: ${quant.damagedPercent}%`}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-1">
                  <span>سليم: {quant.healthyPercent}%</span>
                  <span>النمط: {quant.spatialPattern === 'focal' ? 'بؤري (Focal)' : 'متعدد البؤر'}</span>
                  <span className="text-[#D95B26] font-bold">متضرر: {quant.damagedPercent}%</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <span className="font-semibold text-slate-700">الموقع التشريحي للمنطقة الأكثر تأثراً: </span>
                <span className="font-mono text-[#D95B26]">{quant.mostAffectedCoordinate}</span>
              </div>
            </div>
          )}

          {/* Pathologist Diagnostic Interpretation Box */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#D95B26]" />
                <span>التفسير السريري واعتماد اختصاصي علم الأمراض</span>
              </h3>
              {sample.review.reviewStatus === 'approved' && (
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  معتمد رسمياً
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الانطباع والتشخيص المبدئي (المكتوب بواسطة الطبيب)
              </label>
              <textarea
                rows={3}
                value={impression}
                disabled={sample.review.reviewStatus === 'approved' && !canApprove}
                onChange={(e) => setImpression(e.target.value)}
                placeholder="أدخل التقييم النسيجي والتفسير السريري لمؤشر الضمور..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D95B26]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                التوصية السريرية والمتابعة
              </label>
              <input
                type="text"
                value={recommendation}
                disabled={sample.review.reviewStatus === 'approved' && !canApprove}
                onChange={(e) => setRecommendation(e.target.value)}
                placeholder="مثال: مطابقة سريرية، أو فحص نسيجي تكميلي..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white"
              />
            </div>

            {sample.review.reviewStatus === 'approved' ? (
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 flex justify-between items-center">
                <div>
                  <span className="font-bold">المعتمد: </span>
                  <span>{sample.review.approvedBy}</span>
                  <span className="text-slate-400 mx-2">•</span>
                  <span>{sample.review.approvedAt ? new Date(sample.review.approvedAt).toLocaleString('ar-SA') : ''}</span>
                </div>
                <span className="font-mono text-[11px] text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                  {sample.review.digitalSignature}
                </span>
              </div>
            ) : canApprove ? (
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#D95B26] hover:bg-[#C24C1B] text-white py-2.5 rounded-lg text-xs font-bold transition shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ التفسير واعتماد التقرير رسمياً</span>
              </button>
            ) : (
              <p className="text-[11px] text-slate-400 text-center">
                خاصية الاعتماد مخصصة لحساب اختصاصي علم الأمراض المصرح له.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Collapsible Structured Medical Data Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card 1: General Data */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
            <button
              onClick={() => setOpenGeneral(!openGeneral)}
              className="w-full flex items-center justify-between p-4 font-bold text-slate-800 text-xs hover:bg-slate-50 transition border-b border-slate-100"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#D95B26]" />
                <span>البيانات العامة للعينة والمريض</span>
              </div>
              {openGeneral ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openGeneral && (
              <div className="p-4 space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">اسم المريض:</span>
                  <span className="font-semibold text-slate-800">{sample.patient.fullName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">الرقم الطبي MRN:</span>
                  <span className="font-mono text-slate-800">{sample.patient.mrn}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">العمر / الجنس:</span>
                  <span>{sample.patient.age} سنة • {sample.patient.gender === 'female' ? 'أنثى' : 'ذكر'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">الموقع التشريحي:</span>
                  <span className="font-medium text-slate-800">{sample.anatomicalSite} ({sample.anatomicalSide === 'right' ? 'أيمن' : 'أيسر'})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">نوع الإجراء:</span>
                  <span>{sample.specimenType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">الجهة المرسلة:</span>
                  <span>{sample.order.orderingDepartment}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">الطبيب المحيل:</span>
                  <span>{sample.order.orderingProvider}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">رمز الباركود:</span>
                  <span className="font-mono text-slate-600">{sample.barcode}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">تاريخ الاستلام:</span>
                  <span className="font-mono">{new Date(sample.receivedAt).toLocaleString('ar-SA')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Pre-analytical Quality */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
            <button
              onClick={() => setOpenQuality(!openQuality)}
              className="w-full flex items-center justify-between p-4 font-bold text-slate-800 text-xs hover:bg-slate-50 transition border-b border-slate-100"
            >
              <div className="flex items-center gap-2">
                <Microscope className="w-4 h-4 text-[#D95B26]" />
                <span>بيانات ما قبل التحليل والجودة (Quality)</span>
              </div>
              {openQuality ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openQuality && (
              <div className="p-4 space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">نوع المثبت:</span>
                  <span className="font-medium">{sample.quality.fixativeType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">زمن التثبيت:</span>
                  <span>{sample.quality.fixationDuration}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">مسبار VHH Nanobody:</span>
                  <span className="font-mono text-[#D95B26] font-semibold">{sample.quality.vhhPanel}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">نوع الوسم:</span>
                  <span>{sample.quality.labelType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">نسبة الإشارة للضوضاء SNR:</span>
                  <span className="font-mono font-bold text-emerald-600">{sample.quality.snr}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">نتيجة ضوابط الجودة:</span>
                  <span className="text-emerald-700 font-semibold">ناجحة ومقبولة للتحليل</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">الشوائب (Artifacts):</span>
                  <span className="text-slate-600">{sample.quality.artifacts}</span>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Technical Scan & AI Model */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
            <button
              onClick={() => setOpenTechnical(!openTechnical)}
              className="w-full flex items-center justify-between p-4 font-bold text-slate-800 text-xs hover:bg-slate-50 transition border-b border-slate-100"
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#D95B26]" />
                <span>بيانات المسح والتحليل الفني</span>
              </div>
              {openTechnical ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openTechnical && sample.scanRun && (
              <div className="p-4 space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">رقم تشغيل المسح:</span>
                  <span className="font-mono">{sample.scanRun.scanRunId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">الماسح الضوئي:</span>
                  <span>{sample.scanRun.scannerId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">دقة الفوكسل:</span>
                  <span className="font-mono">{sample.scanRun.voxelSize}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">إصدار نموذج الذكاء:</span>
                  <span className="font-mono text-emerald-700 font-bold">PT-AI v0.9.0 (3D U-Net)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">خوارزمية بناء السطح:</span>
                  <span className="font-mono text-slate-600">{sample.scanRun.surfaceAlgorithm}</span>
                </div>
              </div>
            )}
          </div>

          {/* Card 4: Audit Trail Timeline */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
            <button
              onClick={() => setOpenAudit(!openAudit)}
              className="w-full flex items-center justify-between p-4 font-bold text-slate-800 text-xs hover:bg-slate-50 transition border-b border-slate-100"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D95B26]" />
                <span>سجل العينة وتتبع الأحداث (Audit Timeline)</span>
              </div>
              {openAudit ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openAudit && (
              <div className="p-4 space-y-3 text-xs">
                {sample.auditTrail?.map((log, index) => (
                  <div key={log.id || index} className="flex gap-3 relative pb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#D95B26] mt-1 shrink-0"></div>
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-800">{log.action}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleString('ar-SA')} • {log.actorName}
                      </div>
                      {log.details && <div className="text-[11px] text-slate-600">{log.details}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
