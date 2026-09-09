import React, { useState } from 'react';
import {
  Database,
  Sliders,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Cpu,
  RefreshCw,
  Stethoscope,
  Building2,
  Award,
  Phone,
  Mail,
  UserPlus,
  Edit3,
  Save,
  LogOut,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { db } from '../../services/db';
import { saveUserProfile } from '../../services/firebase';

interface SettingsViewProps {
  currentUser: UserProfile;
  onUserChanged: (user: UserProfile) => void;
  samplesCount: number;
  onOpenAuthModal?: (mode: 'register' | 'login') => void;
  onLogout?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onUserChanged,
  samplesCount,
  onOpenAuthModal,
  onLogout,
}) => {
  const [daiLowCutoff, setDaiLowCutoff] = useState(25);
  const [daiHighCutoff, setDaiHighCutoff] = useState(50);
  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState(85);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Doctor Profile Editing State
  const [isEditingDoctor, setIsEditingDoctor] = useState(false);
  const [docName, setDocName] = useState(currentUser.name || '');
  const [docTitle, setDocTitle] = useState(currentUser.title || '');
  const [docSpecialty, setDocSpecialty] = useState(currentUser.specialty || 'علم الأمراض النسيجي الرقمي والنانوي');
  const [docHospital, setDocHospital] = useState(currentUser.hospital || 'مستشفى الملك فيصل التخصصي ومركز الأبحاث');
  const [docDept, setDocDept] = useState(currentUser.department || 'قسم علم الأمراض والطب المخبري');
  const [docLicense, setDocLicense] = useState(currentUser.licenseNumber || 'SCFHS-26-PATH-94810');
  const [docEmail, setDocEmail] = useState(currentUser.email || '');
  const [docPhone, setDocPhone] = useState(currentUser.phone || '');

  const handleSaveDoctorProfile = async () => {
    if (!docName.trim()) {
      setStatusMsg({ type: 'error', text: 'يرجى إدخال اسم الطبيب الكامل.' });
      return;
    }

    const updatedUser: UserProfile = {
      ...currentUser,
      name: docName.trim(),
      title: docTitle.trim(),
      specialty: docSpecialty.trim(),
      hospital: docHospital.trim(),
      department: docDept.trim(),
      licenseNumber: docLicense.trim(),
      email: docEmail.trim(),
      phone: docPhone.trim(),
    };

    db.setCurrentUser(updatedUser);
    onUserChanged(updatedUser);

    try {
      await saveUserProfile(updatedUser);
    } catch (e) {
      console.warn('Firestore update note:', e);
    }

    setIsEditingDoctor(false);
    setStatusMsg({ type: 'success', text: 'تم حفظ وتحديث بيانات الطبيب بنجاح في النظام!' });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleClearDb = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في تفريغ قاعدة البيانات بالكامل؟ لا يمكن التراجع عن هذا الإجراء.')) {
      db.clearDatabase();
      setStatusMsg({ type: 'success', text: 'تم تفريغ قاعدة البيانات بنجاح وتهيئة النظام.' });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleExportBackup = () => {
    const jsonStr = db.exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pantissue_db_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMsg({ type: 'success', text: 'تم تنزيل النسخة الاحتياطية بنجاح.' });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = db.importDatabaseJson(content);
      if (res.success) {
        setStatusMsg({ type: 'success', text: `تم استيراد ${res.count} عينة بنجاح إلى قاعدة البيانات!` });
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'فشل استيراد الملف' });
      }
      setTimeout(() => setStatusMsg(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">بيانات الطبيب وإعدادات النظام</h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة الملف المهني للطبيب، بيانات الاعتماد والترخيص، وضبط إعدادات النظام
          </p>
        </div>

        <div className="flex items-center gap-2 self-start flex-wrap">
          {onOpenAuthModal && (
            <button
              onClick={() => onOpenAuthModal('register')}
              className="inline-flex items-center gap-2 bg-[#D95B26] hover:bg-[#C24C1B] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ إنشاء حساب طبيب جديد</span>
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs"
              title="تسجيل الخروج والعودة لبوابة الدخول"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>تسجيل الخروج</span>
            </button>
          )}
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Doctor Profile & Credentials Card (TOP PRIORITY) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#D95B26] flex items-center justify-center font-bold">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                الملف المهني وبيانات الطبيب الحالية
              </h3>
              <span className="text-[11px] text-slate-500">
                البيانات المعتمدة المرفقة بتقارير الفحص والتشخيص النسيجي
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditingDoctor ? (
              <button
                onClick={() => setIsEditingDoctor(true)}
                className="text-xs font-bold text-slate-700 hover:text-[#D95B26] px-3 py-1.5 rounded-lg border border-slate-200 hover:border-orange-200 hover:bg-orange-50/50 transition flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل البيانات</span>
              </button>
            ) : (
              <button
                onClick={handleSaveDoctorProfile}
                className="text-xs font-bold text-white bg-[#D95B26] hover:bg-[#C24C1B] px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ التعديلات</span>
              </button>
            )}
          </div>
        </div>

        {/* Doctor Data View / Edit Form */}
        {!isEditingDoctor ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium block text-[11px]">اسم الطبيب الكامل:</span>
              <span className="font-bold text-slate-800 text-sm">{currentUser.name || 'لم يُحدد'}</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium block text-[11px]">اللقب والمسمى الوظيفي:</span>
              <span className="font-bold text-slate-800">{currentUser.title || 'اختصاصي علم الأمراض'}</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium block text-[11px]">التخصص الطبي الدقيق:</span>
              <span className="font-medium text-slate-700">{currentUser.specialty || 'علم الأمراض النسيجي الرقمي'}</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium block text-[11px]">رقم الترخيص / التصنيف المهني:</span>
              <span className="font-mono font-bold text-[#D95B26]">{currentUser.licenseNumber || 'SCFHS-26-PATH-94810'}</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium block text-[11px]">المنشأة الصحية / المستشفى:</span>
              <span className="font-medium text-slate-700">{currentUser.hospital || 'مستشفى الملك فيصل التخصصي'}</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium block text-[11px]">القسم السريري / المختبر:</span>
              <span className="font-medium text-slate-700">{currentUser.department || 'قسم علم الأمراض'}</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium block text-[11px]">البريد الإلكتروني المهني:</span>
              <span className="font-mono text-slate-700">{currentUser.email || 'غير مدخل'}</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium block text-[11px]">رقم الجوال المهني:</span>
              <span className="font-mono text-slate-700">{currentUser.phone || 'غير مدخل'}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">اسم الطبيب الكامل مع اللقب</label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#D95B26]"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">اللقب والمسمى الوظيفي</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#D95B26]"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">التخصص الطبي الدقيق</label>
                <input
                  type="text"
                  value={docSpecialty}
                  onChange={(e) => setDocSpecialty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#D95B26]"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">رقم الترخيص والتصنيف المهني (SCFHS)</label>
                <input
                  type="text"
                  value={docLicense}
                  onChange={(e) => setDocLicense(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#D95B26] font-mono"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">المنشأة الصحية / المستشفى</label>
                <input
                  type="text"
                  value={docHospital}
                  onChange={(e) => setDocHospital(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#D95B26]"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">القسم الطبي / المختبر</label>
                <input
                  type="text"
                  value={docDept}
                  onChange={(e) => setDocDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#D95B26]"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">البريد الإلكتروني المهني</label>
                <input
                  type="email"
                  value={docEmail}
                  onChange={(e) => setDocEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#D95B26]"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">رقم الجوال المهني</label>
                <input
                  type="tel"
                  value={docPhone}
                  onChange={(e) => setDocPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#D95B26] font-mono text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingDoctor(false)}
                className="text-xs px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveDoctorProfile}
                className="text-xs px-4 py-2 rounded-lg bg-[#D95B26] hover:bg-[#C24C1B] text-white font-bold shadow-xs"
              >
                حفظ التحديثات
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Database Management */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-4 h-4 text-[#D95B26]" />
            <span>إدارة قاعدة البيانات والحفظ المحلي</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {samplesCount} عينة مخزنة
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Export */}
          <button
            onClick={handleExportBackup}
            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 rounded-xl transition text-xs font-semibold text-slate-700 hover:text-[#D95B26] gap-2"
          >
            <Download className="w-5 h-5 text-[#D95B26]" />
            <span>تصدير نسخة احتياطية (JSON)</span>
          </button>

          {/* Import */}
          <label className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 rounded-xl transition text-xs font-semibold text-slate-700 hover:text-[#D95B26] gap-2 cursor-pointer">
            <Upload className="w-5 h-5 text-[#D95B26]" />
            <span>استيراد بيانات (JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          {/* Clear DB */}
          <button
            onClick={handleClearDb}
            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition text-xs font-semibold text-slate-700 hover:text-rose-600 gap-2"
          >
            <Trash2 className="w-5 h-5 text-rose-500" />
            <span>تفريغ قاعدة البيانات</span>
          </button>
        </div>
      </div>
    </div>
  );
};
