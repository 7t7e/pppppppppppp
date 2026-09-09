import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  FileSpreadsheet,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Clock,
  Eye,
  FileText,
  Activity,
} from 'lucide-react';
import { SampleRecord, FilterOptions, UserProfile } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface SamplesTableViewProps {
  samples: SampleRecord[];
  currentUser: UserProfile;
  onAddNewSample: () => void;
  onViewSample: (sampleId: string) => void;
  onViewReport: (sampleId: string) => void;
  onDeleteSample: (sampleId: string) => void;
}

export const SamplesTableView: React.FC<SamplesTableViewProps> = ({
  samples,
  currentUser,
  onAddNewSample,
  onViewSample,
  onViewReport,
  onDeleteSample,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedReview, setSelectedReview] = useState('all');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Mask patient names for researchers
  const formatPatientName = (name: string) => {
    if (currentUser.role === 'researcher') {
      return name.split(' ').map((n) => n[0] + '.').join(' ');
    }
    return name;
  };

  const formatMRN = (mrn: string) => {
    if (currentUser.role === 'researcher') {
      return '***' + mrn.slice(-3);
    }
    return mrn;
  };

  const filteredSamples = useMemo(() => {
    return samples.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.id.toLowerCase().includes(q) ||
        s.patient.fullName.toLowerCase().includes(q) ||
        s.patient.mrn.toLowerCase().includes(q) ||
        s.specimenType.toLowerCase().includes(q) ||
        s.anatomicalSite.toLowerCase().includes(q);

      const matchesDept = selectedDept === 'all' || s.order.orderingDepartment === selectedDept;
      const matchesType = selectedType === 'all' || s.specimenType.includes(selectedType);
      const matchesStatus = selectedStatus === 'all' || s.processingStatus === selectedStatus;
      const matchesReview = selectedReview === 'all' || s.review.reviewStatus === selectedReview;

      return matchesSearch && matchesDept && matchesType && matchesStatus && matchesReview;
    });
  }, [samples, searchQuery, selectedDept, selectedType, selectedStatus, selectedReview]);

  const totalPages = Math.ceil(filteredSamples.length / itemsPerPage) || 1;
  const currentSamples = filteredSamples.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDept('all');
    setSelectedType('all');
    setSelectedStatus('all');
    setSelectedReview('all');
    setPage(1);
  };

  const exportCSV = () => {
    const headers = [
      'Sample ID',
      'MRN',
      'Patient',
      'Specimen Type',
      'Anatomical Site',
      'Department',
      'DAI %',
      'Status',
      'Review Status',
      'Received At',
    ];
    const rows = filteredSamples.map((s) => [
      s.id,
      formatMRN(s.patient.mrn),
      formatPatientName(s.patient.fullName),
      s.specimenType,
      s.anatomicalSite,
      s.order.orderingDepartment,
      s.quantitative?.daiPercent ? `${s.quantitative.daiPercent}%` : 'N/A',
      s.processingStatus,
      s.review.reviewStatus,
      s.receivedAt,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `pantissue_samples_database_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  if (samples.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">قاعدة بيانات العينات (Specimens Database)</h1>
            <p className="text-sm text-slate-500 mt-1">السجلات النسيجية وحالات المعالجة والنتائج المورفولوجية</p>
          </div>
          <button
            onClick={onAddNewSample}
            className="inline-flex items-center gap-2 bg-[#D95B26] hover:bg-[#C24C1B] text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة أول عينة</span>
          </button>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-12 shadow-sm">
          <div className="w-16 h-16 bg-orange-50 text-[#D95B26] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-100">
            <Activity className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">قاعدة البيانات فارغة تماماً</h3>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            لم يتم إدخال أي عينات بعد. اضغط على زر "إضافة أول عينة" لإدخال بيانات الحالة، وتحديد الفحص، وتشغيل الذكاء الاصطناعي لحساب DAI.
          </p>
          <button
            onClick={onAddNewSample}
            className="inline-flex items-center gap-2 bg-[#D95B26] hover:bg-[#C24C1B] text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ إضافة أول عينة الآن</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">قاعدة بيانات العينات</h1>
            <span className="text-xs font-semibold bg-slate-200/80 text-slate-700 px-2.5 py-0.5 rounded-full">
              {samples.length} عينة
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">إدارة ومراجعة سجلات العينات والمسح النسيجي ومؤشرات الضمور</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير CSV</span>
          </button>

          <button
            onClick={onAddNewSample}
            className="inline-flex items-center gap-1.5 bg-[#D95B26] hover:bg-[#C24C1B] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ إضافة عينة جديدة</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="بحث باسم المريض، الرقم الطبي MRN، رقم العينة، أو الموقع التشريحي..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D95B26]/30"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>تصفية متقدمة</span>
              {isFiltersOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {(selectedDept !== 'all' || selectedType !== 'all' || selectedStatus !== 'all' || selectedReview !== 'all' || searchQuery) && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Filters */}
        {isFiltersOpen && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">القسم المرسل:</label>
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:bg-white"
              >
                <option value="all">جميع الأقسام</option>
                <option value="قسم جراحة اليوم الواحد">قسم جراحة اليوم الواحد</option>
                <option value="مركز الأورام والطب الدقيق">مركز الأورام والطب الدقيق</option>
                <option value="قسم الجراحة العامة">قسم الجراحة العامة</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">نوع الإجراء:</label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:bg-white"
              >
                <option value="all">جميع الأنواع</option>
                <option value="خزعة">خزعة نسيجية</option>
                <option value="استئصال">استئصال جراحي</option>
                <option value="FNA">رشف إبرة دقيقة FNA</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">حالة التحليل:</label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:bg-white"
              >
                <option value="all">جميع الحالات</option>
                <option value="completed">مكتمل التحليل</option>
                <option value="analyzing">قيد المعالجة</option>
                <option value="draft">مسودة</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">حالة المراجعة:</label>
              <select
                value={selectedReview}
                onChange={(e) => {
                  setSelectedReview(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:bg-white"
              >
                <option value="all">الكل</option>
                <option value="approved">معتمد</option>
                <option value="reviewed">تمت المراجعة</option>
                <option value="pending">بانتظار المراجعة</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Samples Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">رقم العينة</th>
                <th className="py-3 px-4">المريض / MRN</th>
                <th className="py-3 px-4">نوع العينة والموقع</th>
                <th className="py-3 px-4">القسم المرسل</th>
                <th className="py-3 px-4 text-center">مؤشر DAI</th>
                <th className="py-3 px-4">حالة التحليل</th>
                <th className="py-3 px-4">حالة المراجعة</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentSamples.map((sample) => (
                <tr key={sample.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    <button
                      onClick={() => onViewSample(sample.id)}
                      className="hover:text-[#D95B26] hover:underline"
                    >
                      {sample.id}
                    </button>
                    {sample.order.priority === 'stat' && (
                      <span className="block text-[10px] text-rose-600 font-bold">عاجل STAT</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">
                      {formatPatientName(sample.patient.fullName)}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {formatMRN(sample.patient.mrn)} • {sample.patient.age} سنة
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-700 font-medium">{sample.anatomicalSite}</div>
                    <div className="text-[11px] text-slate-400">{sample.specimenType}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{sample.order.orderingDepartment}</td>
                  <td className="py-3 px-4 text-center">
                    {sample.quantitative ? (
                      <div className="inline-flex items-center gap-1 font-bold text-[#D95B26] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded text-xs font-mono">
                        {sample.quantitative.daiPercent}%
                      </div>
                    ) : (
                      <span className="text-slate-400 font-mono">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge type="processing" value={sample.processingStatus} />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge type="review" value={sample.review.reviewStatus} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => onViewSample(sample.id)}
                        title="عرض التحليل والنموذج 3D"
                        className="p-1.5 text-slate-600 hover:text-[#D95B26] hover:bg-orange-50 rounded-md transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onViewReport(sample.id)}
                        title="فتح التقرير الطبي"
                        className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => onDeleteSample(sample.id)}
                          title="حذف العينة"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {currentSamples.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    لا توجد عينات مطابقة لخيارات البحث المحددة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            عرض {(page - 1) * itemsPerPage + 1} -{' '}
            {Math.min(page * itemsPerPage, filteredSamples.length)} من إجمالي {filteredSamples.length}
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-100 transition"
            >
              السابق
            </button>
            <span className="font-mono font-medium">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-100 transition"
            >
              التالي
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
