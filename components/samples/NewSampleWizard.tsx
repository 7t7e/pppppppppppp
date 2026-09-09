import React, { useState } from 'react';
import {
  User,
  TestTube,
  Microscope,
  FileCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  AlertCircle,
  Save,
  Play,
  Layers,
  Sparkles,
} from 'lucide-react';
import { db } from '../../services/db';
import { SampleRecord, PriorityLevel, AcceptanceStatus, UserProfile } from '../../types';

interface NewSampleWizardProps {
  onCancel: () => void;
  onSuccess?: (sample: SampleRecord) => void;
  onSampleSaved?: (sample: SampleRecord) => void;
  currentUser?: UserProfile;
}

export const NewSampleWizard: React.FC<NewSampleWizardProps> = ({
  onCancel,
  onSuccess,
  onSampleSaved,
  currentUser: propUser,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Step 1: Patient & Order
  const [mrn, setMrn] = useState<string>('MRN-84920');
  const [fullName, setFullName] = useState<string>('أحمد عبد الله الغامدي');
  const [birthDate, setBirthDate] = useState<string>('1984-06-15');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [patientEmail, setPatientEmail] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [orderingDepartment, setOrderingDepartment] = useState<string>('قسم أمراض وزراعة الكلى');
  const [orderingProvider, setOrderingProvider] = useState<string>('د. فيصل الشهري');
  const [clinicalNote, setClinicalNote] = useState<string>('فحص نسيجي نانومتري لتقييم سلامة الأنسجة ومؤشر الضمور الرقمي.');
  const [priority, setPriority] = useState<PriorityLevel>('routine');

  // Step 2: Specimen Details
  const [sampleId, setSampleId] = useState<string>(() => `SMP-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [accessionNumber, setAccessionNumber] = useState<string>(() => `ACC-2026-${Math.floor(10000 + Math.random() * 90000)}`);
  const [barcode, setBarcode] = useState<string>(() => `BAR-${Math.floor(100000 + Math.random() * 900000)}`);
  const [specimenType, setSpecimenType] = useState<string>('خزعة نسيجية (Core Needle Biopsy)');
  const [anatomicalSite, setAnatomicalSite] = useState<string>('الكبد (Liver)');
  const [anatomicalSide, setAnatomicalSide] = useState<'right' | 'left' | 'not_applicable'>('right');
  const [containerBlockId, setContainerBlockId] = useState<string>('BLK-C02');
  const [collectionAt, setCollectionAt] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [receivedAt, setReceivedAt] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [acceptanceStatus, setAcceptanceStatus] = useState<AcceptanceStatus>('accepted');

  // Step 3: Preparation & Quality
  const [fixativeType, setFixativeType] = useState<string>('10% Neutral Buffered Formalin');
  const [fixationDuration, setFixationDuration] = useState<string>('120 دقيقة');
  const [prepMethod, setPrepMethod] = useState<string>('تثبيت سريع وتقطيع نانومتري');
  const [vhhPanel, setVhhPanel] = useState<string>('PanTissue-VHH NanoMarker #4');
  const [labelType, setLabelType] = useState<string>('Fluorophore AlexaFluor-647');
  const [incubationMinutes, setIncubationMinutes] = useState<number>(45);
  const [qcStatus, setQcStatus] = useState<'passed' | 'failed' | 'needs_repeat'>('passed');
  const [snr, setSnr] = useState<number>(22.4);
  const [artifacts, setArtifacts] = useState<string>('لا يوجد تشوهات أو طيات');
  const [qcDecision, setQcDecision] = useState<'continue' | 'rescan' | 'new_sample'>('continue');

  // Step 4: Scan Parameters
  const [scannerId, setScannerId] = useState<string>('PanTissue Optical Scanner 3D-Pro (SN: SC-882)');
  const [scanRunId, setScanRunId] = useState<string>(() => `SR-${Math.floor(10000 + Math.random() * 90000)}`);
  const [wavelength, setWavelength] = useState<string>('647 nm Ex / 670 nm Em');
  const [voxelSize, setVoxelSize] = useState<string>('0.25 × 0.25 × 0.5 µm³');
  const [totalScanVolume, setTotalScanVolume] = useState<number>(12.8);
  const [preprocessingAlgorithm, setPreprocessingAlgorithm] = useState<string>('Gaussian Filtering / Dynamic Normalization');
  const [segmentationModel, setSegmentationModel] = useState<string>('3D U-Net TissueSegmenter v0.9.0');

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateStep = (step: number): boolean => {
    const errs: { [key: string]: string } = {};

    if (step === 1) {
      if (!mrn.trim()) errs.mrn = 'الرقم الطبي MRN مطلوب';
      if (!fullName.trim()) errs.fullName = 'اسم المريض مطلوب';
      if (!orderingDepartment.trim()) errs.orderingDepartment = 'الجهة أو القسم المرسل مطلوب';
    } else if (step === 2) {
      if (!sampleId.trim()) errs.sampleId = 'رقم العينة فريد ومطلوب';
      if (!specimenType.trim()) errs.specimenType = 'نوع العينة مطلوب';
      if (!anatomicalSite.trim()) errs.anatomicalSite = 'الموقع التشريحي مطلوب';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const createSamplePayload = (isDraft: boolean): SampleRecord => {
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    const currentUser = propUser || db.getCurrentUser();

    return {
      id: sampleId,
      caseId: `CAS-${sampleId.replace('SMP-', '')}`,
      accessionNumber,
      barcode,
      patient: {
        patientId: `PAT-${mrn}`,
        mrn,
        fullName,
        birthDate,
        age: isNaN(age) ? 42 : age,
        gender,
        email: patientEmail,
        phone: patientPhone,
      },
      order: {
        caseId: `CAS-${sampleId.replace('SMP-', '')}`,
        accessionNumber,
        orderingDepartment,
        orderingProvider,
        clinicalNote,
        priority,
        createdAt: new Date().toISOString(),
      },
      specimenType,
      anatomicalSite,
      anatomicalSide,
      containerBlockId,
      collectionAt,
      receivedAt,
      acceptanceStatus,
      processingStatus: isDraft ? 'draft' : 'analyzing',
      quality: {
        fixativeType,
        fixationDuration,
        prepMethod,
        vhhPanel,
        labelType,
        incubationMinutes,
        qcStatus,
        snr,
        artifacts,
        qcDecision,
      },
      scanRun: {
        scanRunId,
        scannerId,
        scannedAt: new Date().toISOString(),
        wavelength,
        voxelSize,
        sliceCount: 64,
        totalScanVolume,
        signalIntensityRange: '12 - 255 RFU',
        preprocessingAlgorithm,
        segmentationModel,
        surfaceAlgorithm: 'Marching Cubes Surface Mesh',
      },
      review: {
        pathologistComment: '',
        preliminaryImpression: '',
        recommendation: '',
        reviewStatus: 'pending',
      },
      auditTrail: [
        {
          id: 'aud-' + Date.now(),
          sampleId,
          action: isDraft ? 'حفظ العينة كمسودة' : 'إنشاء العينة وإرسالها لمعالجة الذكاء الاصطناعي',
          actorName: currentUser.name,
          actorRole: currentUser.role,
          timestamp: new Date().toISOString(),
          details: `تم تسجيل العينة برقم ${sampleId} للمريض ${fullName} (${mrn}) من قبل ${currentUser.title}`,
        },
      ],
      isDraft,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSave = (runAnalysis: boolean) => {
    if (!validateStep(1) || !validateStep(2)) return;
    setIsSubmitting(true);

    try {
      const record = createSamplePayload(!runAnalysis);
      db.addSample(record);

      const notifySuccess = (saved: SampleRecord) => {
        if (onSampleSaved) onSampleSaved(saved);
        if (onSuccess) onSuccess(saved);
      };

      if (runAnalysis) {
        // Run simulated nanobody AI segmentation and quantification
        setTimeout(() => {
          const processed = db.processSampleAnalysis(record);
          setIsSubmitting(false);
          notifySuccess(processed);
        }, 900);
      } else {
        setIsSubmitting(false);
        notifySuccess(record);
      }
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'المريض والطلب', icon: User },
    { num: 2, title: 'بيانات العينة', icon: TestTube },
    { num: 3, title: 'الجودة والتحضير', icon: Microscope },
    { num: 4, title: 'المسح والملفات', icon: Layers },
    { num: 5, title: 'المراجعة والتأكيد', icon: FileCheck },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Title & Progress Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">إضافة عينة نسيجية جديدة</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              أدخل بيانات المريض والتحضير والمسح لإجراء التجزئة ثلاثية الأبعاد وحساب مؤشر DAI
            </p>
          </div>
          <span className="text-xs font-semibold bg-orange-50 text-[#D95B26] border border-orange-200 px-3 py-1 rounded-full self-start">
            الخطوة {currentStep} من 5
          </span>
        </div>

        {/* Stepper Wizard */}
        <div className="grid grid-cols-5 gap-2">
          {steps.map((s) => {
            const Icon = s.icon;
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div
                key={s.num}
                onClick={() => {
                  if (s.num < currentStep) setCurrentStep(s.num);
                }}
                className={`flex flex-col items-center text-center cursor-pointer transition ${
                  isCurrent ? 'opacity-100' : isDone ? 'opacity-80' : 'opacity-40'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition mb-1.5 ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-[#D95B26] text-white ring-4 ring-orange-100'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="text-[11px] font-medium text-slate-700 hidden sm:inline">{s.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Body */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm">
        {/* Step 1: Patient & Order */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-[#D95B26]" />
                <span>1. بيانات المريض والطلب السريري</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                تسجيل البيانات السريرية الرسمية للخزعة أو الفحص النسيجي
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الرقم الطبي (MRN) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={mrn}
                  onChange={(e) => setMrn(e.target.value)}
                  placeholder="مثال: MRN-10492"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-[#D95B26]/30 focus:outline-none"
                />
                {errors.mrn && <p className="text-[11px] text-rose-500 mt-1">{errors.mrn}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم المريض <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="الاسم الثلاثي أو الرباعي"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-[#D95B26]/30 focus:outline-none"
                />
                {errors.fullName && <p className="text-[11px] text-rose-500 mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ الميلاد</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-[#D95B26]/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">الجنس</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-[#D95B26]/30 focus:outline-none"
                >
                  <option value="female">أنثى (Female)</option>
                  <option value="male">ذكر (Male)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  القسم أو الجهة المرسلة <span className="text-rose-500">*</span>
                </label>
                <select
                  value={orderingDepartment}
                  onChange={(e) => setOrderingDepartment(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-[#D95B26]/30 focus:outline-none"
                >
                  <option value="قسم جراحة اليوم الواحد">قسم جراحة اليوم الواحد</option>
                  <option value="مركز الأورام والطب الدقيق">مركز الأورام والطب الدقيق</option>
                  <option value="قسم الجراحة العامة">قسم الجراحة العامة</option>
                  <option value="عيادات أمراض الجهاز الهضمي والكبد">عيادات أمراض الجهاز الهضمي والكبد</option>
                  <option value="قسم زراعة الأعضاء">قسم زراعة الأعضاء</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">الطبيب مقدم الطلب</label>
                <input
                  type="text"
                  value={orderingProvider}
                  onChange={(e) => setOrderingProvider(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-[#D95B26]/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">مستوى الأولوية</label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="prio"
                      checked={priority === 'stat'}
                      onChange={() => setPriority('stat')}
                      className="text-[#D95B26] focus:ring-[#D95B26]"
                    />
                    <span className="font-semibold text-rose-600">عاجل (STAT)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="prio"
                      checked={priority === 'routine'}
                      onChange={() => setPriority('routine')}
                      className="text-slate-600 focus:ring-slate-500"
                    />
                    <span className="text-slate-600">روتيني (Routine)</span>
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">ملاحظات سريرية موجزة</label>
                <textarea
                  rows={2}
                  value={clinicalNote}
                  onChange={(e) => setClinicalNote(e.target.value)}
                  placeholder="أدخل أي ملاحظات سريرية تفيد في تفسير الفحص..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-[#D95B26]/30 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Specimen Details */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
              <TestTube className="w-4 h-4 text-[#D95B26]" />
              <span>2. بيانات العينة المادية والاستلام</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رقم العينة (Sample ID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={sampleId}
                  onChange={(e) => setSampleId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono focus:bg-white focus:ring-2 focus:ring-[#D95B26]/30 focus:outline-none"
                />
                {errors.sampleId && <p className="text-[11px] text-rose-500 mt-1">{errors.sampleId}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الوصول (Accession #)</label>
                <input
                  type="text"
                  value={accessionNumber}
                  onChange={(e) => setAccessionNumber(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">رمز الباركود</label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">نوع الإجراء / مصدر العينة</label>
                <select
                  value={specimenType}
                  onChange={(e) => setSpecimenType(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white"
                >
                  <option value="خزعة نسيجية (Core Needle Biopsy)">خزعة نسيجية (Core Needle Biopsy)</option>
                  <option value="عينة استئصال جراحي (Surgical Resection)">عينة استئصال جراحي (Surgical Resection)</option>
                  <option value="خزعة إسفينية (Wedge Biopsy)">خزعة إسفينية (Wedge Biopsy)</option>
                  <option value="رشف بإبرة دقيقة (FNA Cell Block)">رشف بإبرة دقيقة (FNA Cell Block)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">العضو أو الموقع التشريحي</label>
                <select
                  value={anatomicalSite}
                  onChange={(e) => setAnatomicalSite(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white"
                >
                  <option value="الكبد (Liver)">الكبد (Liver)</option>
                  <option value="الكلية (Kidney)">الكلية (Kidney)</option>
                  <option value="الثدي (Breast)">الثدي (Breast)</option>
                  <option value="الجلد والأنسجة الضامة">الجلد والأنسجة الضامة</option>
                  <option value="القولون والمستقيم">القولون والمستقيم</option>
                  <option value="البروستات">البروستات</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">الجانب التشريحي</label>
                <select
                  value={anatomicalSide}
                  onChange={(e) => setAnatomicalSide(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white"
                >
                  <option value="right">أيمن (Right)</option>
                  <option value="left">أيسر (Left)</option>
                  <option value="not_applicable">غير منطبق (N/A)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الحاوية / البلوك</label>
                <input
                  type="text"
                  value={containerBlockId}
                  onChange={(e) => setContainerBlockId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ ووقت أخذ العينة</label>
                <input
                  type="datetime-local"
                  value={collectionAt}
                  onChange={(e) => setCollectionAt(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">حالة العينة عند الاستلام</label>
                <select
                  value={acceptanceStatus}
                  onChange={(e) => setAcceptanceStatus(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white"
                >
                  <option value="accepted">مقبولة ومطابقة للمعايير</option>
                  <option value="conditional">مشروطة (تحتاج تثبيت إضافي)</option>
                  <option value="rejected">مرفوضة وغير صالحة</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Quality & Preparation */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Microscope className="w-4 h-4 text-[#D95B26]" />
              <span>3. بيانات الجودة والتحضير الجزيئي (VHH Nanobodies)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">نوع المثبت النسيجي</label>
                <select
                  value={fixativeType}
                  onChange={(e) => setFixativeType(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white"
                >
                  <option value="10% Neutral Buffered Formalin">10% Neutral Buffered Formalin</option>
                  <option value="Fast Tissue Fixative (PanFix-3D)">Fast Tissue Fixative (PanFix-3D)</option>
                  <option value="Alcohol-based Molecular Fixative">Alcohol-based Molecular Fixative</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">زمن التثبيت</label>
                <input
                  type="text"
                  value={fixationDuration}
                  onChange={(e) => setFixationDuration(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">مسبار نانو VHH Nanobody</label>
                <input
                  type="text"
                  value={vhhPanel}
                  onChange={(e) => setVhhPanel(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">نوع الوسم (Label Type)</label>
                <select
                  value={labelType}
                  onChange={(e) => setLabelType(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white"
                >
                  <option value="Fluorophore AlexaFluor-647">Fluorophore AlexaFluor-647</option>
                  <option value="Fluorescent Cy5">Fluorescent Cy5</option>
                  <option value="HRP Enzymatic Probe">HRP Enzymatic Probe</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">زمن الحضانة (دقيقة)</label>
                <input
                  type="number"
                  value={incubationMinutes}
                  onChange={(e) => setIncubationMinutes(parseInt(e.target.value) || 30)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">نسبة الإشارة للضوضاء (SNR)</label>
                <input
                  type="number"
                  step="0.1"
                  value={snr}
                  onChange={(e) => setSnr(parseFloat(e.target.value) || 15)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ضوابط الجودة (QC Status)</label>
                <select
                  value={qcStatus}
                  onChange={(e) => setQcStatus(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white"
                >
                  <option value="passed">ناجحة ومقبولة للتحليل</option>
                  <option value="needs_repeat">تحتاج إعادة تحضير</option>
                  <option value="failed">فاشلة</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">وجود شوائب أو طيات (Artifacts)</label>
                <input
                  type="text"
                  value={artifacts}
                  onChange={(e) => setArtifacts(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Scan & Files */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Layers className="w-4 h-4 text-[#D95B26]" />
              <span>4. بيانات المسح البصري ورفع الملفات</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">معرف الماسح الضوئي</label>
                <input
                  type="text"
                  value={scannerId}
                  onChange={(e) => setScannerId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">حجم المسح الكلي (mm³)</label>
                <input
                  type="number"
                  step="0.1"
                  value={totalScanVolume}
                  onChange={(e) => setTotalScanVolume(parseFloat(e.target.value) || 12.8)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-[#D95B26] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">دقة الفوكسل (Voxel Size)</label>
                <input
                  type="text"
                  value={voxelSize}
                  onChange={(e) => setVoxelSize(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white"
                />
              </div>
            </div>

            {/* File Upload Zone */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-[#D95B26] bg-slate-50/50 transition cursor-pointer relative">
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setUploadedFileName(e.target.files[0].name);
                  }
                }}
              />
              <UploadCloud className="w-10 h-10 text-[#D95B26] mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-800">
                {uploadedFileName ? (
                  <span className="text-emerald-700 font-bold">تم إرفاق الملف: {uploadedFileName}</span>
                ) : (
                  <span>اسحب وأفلت ملف المسح النسيجي (TIFF, OME-ZARR, NIfTI) أو انقر للاختيار</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                يدعم صيغ المسح المجهري متعدد الطبقات والملفات الحجمية حتى 500MB
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Review & Confirmation */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileCheck className="w-4 h-4 text-[#D95B26]" />
              <span>5. مراجعة بيانات العينة والتأكيد قبل التحليل</span>
            </h3>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-xs space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-400 block">رقم العينة:</span>
                  <span className="font-bold text-slate-800 font-mono">{sampleId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">اسم المريض:</span>
                  <span className="font-semibold text-slate-800">{fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">الرقم الطبي MRN:</span>
                  <span className="font-mono text-slate-800">{mrn}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">الأولوية:</span>
                  <span className={`font-bold ${priority === 'stat' ? 'text-rose-600' : 'text-slate-700'}`}>
                    {priority === 'stat' ? 'عاجل (STAT)' : 'روتيني'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">العضو المستهدف:</span>
                  <span className="font-semibold text-slate-800">{anatomicalSite}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">الحجم الكلي:</span>
                  <span className="font-bold text-[#D95B26] font-mono">{totalScanVolume} mm³</span>
                </div>
                <div>
                  <span className="text-slate-400 block">لوحة الوسم:</span>
                  <span className="font-mono text-slate-700">{vhhPanel}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">حالة الجودة:</span>
                  <span className="font-bold text-emerald-600">ناجحة (SNR: {snr})</span>
                </div>
              </div>
            </div>

            {/* Crucial Clinical Regulatory Callout */}
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">إقرار سريري وتنظيمي هام:</span>
                <p className="mt-0.5">
                  منصة PanTissue AI هي واجهة دعم قرار سريري ومساندة رقمية فقط، وليست بديلاً عن اختصاصي علم الأمراض.
                  جميع القياسات ومؤشر الضمور الرقمي (DAI) تستلزم المراجعة والاعتماد النهائي من الطبيب المختص قبل اتخاذ أي قرار علاجي.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Buttons Footer */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg transition"
              >
                إلغاء
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#D95B26] hover:bg-[#C24C1B] rounded-lg shadow-sm transition"
              >
                <span>التالي</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSave(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  <Save className="w-4 h-4 text-slate-600" />
                  <span>حفظ كمسودة</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSave(true)}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#D95B26] hover:bg-[#C24C1B] rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>جاري المعالجة بالذكاء الاصطناعي...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>حفظ وتشغيل التحليل وحساب DAI</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
