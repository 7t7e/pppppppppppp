import React, { useState, useMemo } from 'react';
import {
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Activity,
  Filter,
  PlusCircle,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { SampleRecord, CellMeasurement } from '../../types';

interface AnalyticsViewProps {
  samples: SampleRecord[];
  onAddNewSample: () => void;
  onSelectSample?: (id: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  samples,
  onAddNewSample,
}) => {
  // If samples exist, default to the first completed one, or the first available
  const completedSamples = useMemo(() => samples.filter((s) => s.processingStatus === 'completed'), [samples]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(completedSamples[0]?.id || '');
  const [isFormulaExpanded, setIsFormulaExpanded] = useState<boolean>(true);
  const [typeFilter, setTypeFilter] = useState<'All' | 'Cell' | 'Vessel' | 'Region'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const itemsPerPage = 5;

  const currentSample = useMemo(() => {
    return samples.find((s) => s.id === selectedSampleId) || completedSamples[0] || samples[0];
  }, [samples, completedSamples, selectedSampleId]);

  // If no samples exist in the database at all
  if (samples.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">التحليلات والقياسات الحجمية (Volumetric Analysis)</h1>
            <p className="text-sm text-slate-500 mt-1">التحليل الحجمي المورفولوجي الكمي ومؤشرات النسيج المستخرجة من العينة الحجمية</p>
          </div>
          <button
            onClick={onAddNewSample}
            className="inline-flex items-center gap-2 bg-[#D95B26] hover:bg-[#C24C1B] text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm transition self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة أول عينة</span>
          </button>
        </div>

        {/* Empty state container */}
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-2xl mx-auto my-8 shadow-sm">
          <div className="w-16 h-16 bg-orange-50 text-[#D95B26] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-100">
            <Activity className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">قاعدة البيانات فارغة تماماً</h3>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            لا توجد أي عينات أو قياسات نسيجية مسجلة بعد. عند إدخال أول عينة وتشغيل التحليل،
            سيتم هنا عرض مؤشر الضمور الرقمي (DAI)، والمنحنيات الطيفية، والقياسات المورفولوجية ثلاثية الأبعاد بدقة.
          </p>
          <button
            onClick={onAddNewSample}
            className="inline-flex items-center gap-2 bg-[#D95B26] hover:bg-[#C24C1B] text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>بدء إدخال عينة جديدة</span>
          </button>
        </div>
      </div>
    );
  }

  // Active sample quantitative data
  const quant = currentSample?.quantitative || {
    totalVolume: 12.8,
    healthyVolume: 8.0,
    damagedVolume: 3.1,
    transitionVolume: 1.7,
    unclassifiedVolume: 0,
    healthyPercent: 62.5,
    damagedPercent: 24.2,
    daiPercent: 37.5,
    daiCategory: 'moderate',
    damageLevel: 'moderate',
    spatialPattern: 'focal',
    mostAffectedCoordinate: 'X: 35.2, Y: 84.1, Z: 22.5',
    affectedFociCount: 1,
    averageConfidence: 92.4,
    uncertaintyLevel: 'low',
    measurements: [],
  };

  const measurementsList = quant.measurements || [];

  const filteredMeasurements = useMemo(() => {
    return measurementsList.filter((m) => {
      const matchType = typeFilter === 'All' || m.type === typeFilter;
      const matchSearch =
        m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSearch;
    });
  }, [measurementsList, typeFilter, searchQuery]);

  const totalPages = Math.ceil(filteredMeasurements.length / itemsPerPage) || 1;
  const currentMeasurements = filteredMeasurements.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const exportCSV = () => {
    const headers = ['المعرف ID', 'النوع TYPE', 'الحجم MM3', 'X', 'Y', 'Z', 'الثقة %', 'المراجعة'];
    const rows = filteredMeasurements.map((m) => [
      m.id,
      m.type,
      m.volume,
      m.x,
      m.y,
      m.z,
      `${m.confidence}%`,
      m.status === 'reviewed' ? 'تمت المراجعة' : 'تحتاج مراجعة',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pantissue_measurements_${currentSample?.id || 'sample'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">التحليلات والقياسات الحجمية</h1>
            {samples.length > 1 && (
              <select
                value={currentSample?.id}
                onChange={(e) => setSelectedSampleId(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:ring-2 focus:ring-[#D95B26]/30 focus:outline-none"
              >
                {samples.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.specimenType} ({s.patient.fullName})
                  </option>
                ))}
              </select>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">التحليل الحجمي المورفولوجي الكمي ومؤشرات النسيج المستخرجة من العينة الحجمية</p>
        </div>

        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition self-start md:self-auto"
        >
          <Download className="w-4 h-4 text-[#D95B26]" />
          <span>تنزيل جدول CSV</span>
        </button>
      </div>

      {/* Top 6 KPI Metric Cards matching screenshot */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Tissue Volume */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm text-center">
          <div className="text-xs text-slate-500 mb-1">حجم النسيج الكلي</div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold text-slate-800">{quant.totalVolume}</span>
            <span className="text-xs text-slate-400">mm³</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Volume 100%</div>
        </div>

        {/* Functional Volume */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm text-center">
          <div className="text-xs text-slate-500 mb-1">الحجم الوظيفي</div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold text-amber-600">{quant.healthyVolume}</span>
            <span className="text-xs text-slate-400">mm³</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Viable Core {quant.healthyPercent}%</div>
        </div>

        {/* Low Signal Area */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm text-center">
          <div className="text-xs text-slate-500 mb-1">منطقة منخفضة الإشارة</div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold text-[#D95B26]">{quant.damagedVolume}</span>
            <span className="text-xs text-slate-400">mm³</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Hypo-intense {quant.damagedPercent}%</div>
        </div>

        {/* Border / Uncertain Area */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm text-center">
          <div className="text-xs text-slate-500 mb-1">منطقة غير مؤكدة</div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold text-rose-600">{quant.transitionVolume}</span>
            <span className="text-xs text-slate-400">mm³</span>
          </div>
          <div className="text-[11px] text-rose-500 mt-1 font-mono">Border Zone 13.3%</div>
        </div>

        {/* Average Confidence */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm text-center">
          <div className="text-xs text-slate-500 mb-1">متوسط الثقة</div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold text-slate-800">{quant.averageConfidence}</span>
            <span className="text-xs text-slate-400">%</span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-mono">Reliability 94.8%</div>
        </div>

        {/* DAI Indicator Card with Exp badge */}
        <div className="bg-white rounded-xl border-2 border-amber-400/80 p-4 shadow-sm text-center relative">
          <span className="absolute top-2 right-2 text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
            Exp
          </span>
          <div className="text-xs text-slate-700 font-medium mb-1">مؤشر DAI تجريبي</div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold text-[#D95B26]">{quant.daiPercent}</span>
            <span className="text-xs text-[#D95B26] font-bold">%</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">بحثي — غير تشخيصي</div>
        </div>
      </div>

      {/* Amber Formula Box matching screenshot */}
      <div className="border border-amber-300 bg-amber-50/40 rounded-xl overflow-hidden shadow-xs">
        <button
          onClick={() => setIsFormulaExpanded(!isFormulaExpanded)}
          className="w-full flex items-center justify-between p-3.5 text-right font-semibold text-amber-900 text-sm hover:bg-amber-100/30 transition"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>معادلة مؤشر الضمور الرقمي (Experimental Digital Atrophy Index)</span>
          </div>
          {isFormulaExpanded ? (
            <ChevronUp className="w-4 h-4 text-amber-700" />
          ) : (
            <ChevronDown className="w-4 h-4 text-amber-700" />
          )}
        </button>

        {isFormulaExpanded && (
          <div className="p-4 pt-1 border-t border-amber-200/60 space-y-3">
            <div className="bg-white border border-amber-200 rounded-lg p-3 text-center font-mono font-bold text-amber-950 text-sm shadow-2xs tracking-wider">
              DAI = (1 - Functional Volume / Total Tissue Volume) × 100%
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              نسبة تجريبية تُقدّر الجزء غير المصنّف كمنطقة وظيفية مقارنة بالحجم الكلي. لا تمثل تشخيصاً طبياً ولا تُفسّر منفردة دون تحقق سريري دقيق.
            </p>
            <div className="text-xs font-mono text-slate-600 dir-ltr text-center">
              DAI = (1 - {quant.healthyVolume} / {quant.totalVolume}) × 100% = {quant.daiPercent}%
            </div>
          </div>
        )}
      </div>

      {/* Charts Grid: 4 Visualizers matching screenshots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Donut Chart: Volume distribution */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-[#D95B26]" />
              <span>توزيع المناطق الحجمية</span>
            </h3>
          </div>

          <div className="flex items-center justify-around flex-1 py-2">
            {/* SVG Donut Chart */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F1F5F9" strokeWidth="16" />
                {/* Segment 1: Functional (Amber/Gold 62.5%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#E05A2B"
                  strokeWidth="16"
                  strokeDasharray="238.7"
                  strokeDashoffset="89.5"
                  strokeLinecap="round"
                />
                {/* Segment 2: Low Signal (Orange 24.2%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="16"
                  strokeDasharray="57.7 181"
                  strokeDashoffset="-149.2"
                />
                {/* Segment 3: Uncertain (Rose 13.3%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#E11D48"
                  strokeWidth="16"
                  strokeDasharray="31.7 207"
                  strokeDashoffset="-207"
                />
              </svg>
              {/* Center text */}
              <div className="absolute text-center">
                <div className="text-lg font-extrabold text-slate-800">{quant.totalVolume}</div>
                <div className="text-[10px] text-slate-400 font-mono">mm³ total</div>
              </div>
            </div>

            {/* Legend with matching colors */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E05A2B]"></span>
                <span className="text-slate-700">Functional: {quant.healthyVolume} mm³ ({quant.healthyPercent}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                <span className="text-slate-700">Low Signal: {quant.damagedVolume} mm³ ({quant.damagedPercent}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]"></span>
                <span className="text-slate-700">Uncertain: {quant.transitionVolume} mm³ (13.3%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Layer Average Signal */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#D95B26]" />
              <span>متوسط الإشارة حسب الطبقة</span>
            </h3>
            <span className="text-xs text-[#D95B26] font-semibold bg-orange-50 px-2 py-0.5 rounded">
              Peak Slice Z-25 (245 RFU)
            </span>
          </div>

          {/* Bar / Wave illustration */}
          <div className="h-40 flex items-end justify-between gap-1 pt-6 px-2">
            {[45, 60, 95, 140, 185, 220, 245, 230, 190, 150, 110, 75, 40].map((h, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className="w-full bg-linear-to-t from-orange-400 to-[#D95B26] rounded-t hover:brightness-110 transition-all cursor-pointer"
                  style={{ height: `${(h / 260) * 100}%` }}
                  title={`Slice ${(idx + 1) * 5}: ${h} RFU`}
                ></div>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100">
            <span>Z-01 (Basal)</span>
            <span>Z-25</span>
            <span>Z-64 (Apical)</span>
          </div>
        </div>

        {/* 3. Cell Size Distribution */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#D95B26]" />
              <span>توزيع الخلايا حسب الحجم (µm³)</span>
            </h3>
          </div>

          {/* Line Curve Simulation */}
          <div className="h-32 w-full flex items-center justify-center relative">
            <svg className="w-full h-full" viewBox="0 0 400 120">
              <defs>
                <linearGradient id="cellGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D95B26" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#D95B26" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 20 110 Q 120 110, 200 25 T 380 110"
                fill="url(#cellGrad)"
                stroke="#D95B26"
                strokeWidth="2.5"
              />
              <line x1="200" y1="25" x2="200" y2="110" stroke="#D95B26" strokeDasharray="3 3" />
            </svg>
          </div>

          <div className="flex justify-between text-xs text-slate-500 font-mono pt-3 border-t border-slate-100">
            <span>Min: 48 µm³</span>
            <span className="font-bold text-amber-700">Median Soma: 114.2 µm³</span>
            <span>Max: 210 µm³</span>
          </div>
        </div>

        {/* 4. Signal Intensity over Z-Axis */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#D95B26]" />
              <span>شدة الإشارة عبر المحور Z</span>
            </h3>
          </div>

          {/* Smooth Bell Curve */}
          <div className="h-32 w-full flex items-center justify-center relative">
            <svg className="w-full h-full" viewBox="0 0 400 120">
              <defs>
                <linearGradient id="zGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E05A2B" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#E05A2B" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 30 100 C 130 90, 180 20, 250 35 C 310 50, 340 85, 370 100"
                fill="url(#zGrad)"
                stroke="#E05A2B"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="flex justify-between text-xs text-slate-500 font-mono pt-3 border-t border-slate-100">
            <span>Attenuation half-life: 82 µm</span>
            <span>Optical penetration depth: 160 µm</span>
          </div>
        </div>
      </div>

      {/* Detailed Measurements Table matching user's screenshots */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Table Filter & Search Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-800">جدول القياسات التفصيلي</h3>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Chips */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              {(['All', 'Cell', 'Vessel', 'Region'] as const).map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setTypeFilter(chip);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-md transition ${
                    typeFilter === chip ? 'bg-[#D95B26] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="بحث بالمعرّف أو النوع..."
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D95B26]/30 w-48"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">المعرّف ID</th>
                <th className="py-3 px-4">النوع TYPE</th>
                <th className="py-3 px-4">الحجم (MM³)</th>
                <th className="py-3 px-4">X</th>
                <th className="py-3 px-4">Y</th>
                <th className="py-3 px-4">Z</th>
                <th className="py-3 px-4">الثقة</th>
                <th className="py-3 px-4">المراجعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {currentMeasurements.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-bold text-[#D95B26]">{row.id}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                        row.type === 'Cell'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : row.type === 'Vessel'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {row.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-bold">{row.volume.toLocaleString()}</td>
                  <td className="py-3 px-4 text-slate-600">{row.x}</td>
                  <td className="py-3 px-4 text-slate-600">{row.y}</td>
                  <td className="py-3 px-4 text-slate-600">{row.z}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-bold ${
                        row.confidence >= 90 ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {row.confidence}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {row.status === 'reviewed' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        تمت المراجعة
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        تحتاج مراجعة
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {currentMeasurements.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                    لا توجد قياسات مطابقة للبحث أو الفلتر المحدد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {(page - 1) * itemsPerPage + 1} -{' '}
            {Math.min(page * itemsPerPage, filteredMeasurements.length)} of {filteredMeasurements.length}
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-100 transition"
            >
              Prev
            </button>
            <span className="font-mono font-medium">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-100 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
