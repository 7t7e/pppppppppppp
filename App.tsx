import React, { useState, useEffect } from 'react';
import {
  Activity,
  TestTubes,
  BarChart3,
  Settings,
  Menu,
  X,
  LogIn,
} from 'lucide-react';
import { SampleRecord, UserProfile } from './types';
import { db } from './services/db';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { SamplesTableView } from './components/samples/SamplesTableView';
import { NewSampleWizard } from './components/samples/NewSampleWizard';
import { SampleDetailView } from './components/samples/SampleDetailView';
import { PrintableReportView } from './components/reports/PrintableReportView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SettingsView } from './components/settings/SettingsView';
import { AuthModal } from './components/auth/AuthModal';

type ViewMode =
  | 'dashboard'
  | 'samples'
  | 'wizard'
  | 'detail'
  | 'report'
  | 'analytics'
  | 'settings';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => db.getCurrentUser());
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [samples, setSamples] = useState<SampleRecord[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'register' | 'login'>('login');

  // Sync state with database and Firestore
  useEffect(() => {
    const loaded = db.getSamples();
    setSamples(loaded);

    const unsubscribe = db.subscribe((newSamples) => {
      setSamples(newSamples);
    });

    db.syncWithFirestore(currentUser).then(() => {
      setSamples(db.getSamples());
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser.id]);

  // When user switches role or logs in
  const handleUserChange = (newUser: UserProfile) => {
    setCurrentUser(newUser);
    db.setCurrentUser(newUser);
    db.syncWithFirestore(newUser).then(() => {
      setSamples(db.getSamples());
    });
  };

  // Reset user session to default
  const handleLogout = () => {
    db.logout();
    setCurrentUser(db.getCurrentUser());
    setSelectedSampleId(null);
    setCurrentView('dashboard');
    setIsMobileMenuOpen(false);
  };

  const refreshSamples = () => {
    const loaded = db.getSamples();
    setSamples(loaded);
  };

  const handleAddNewSample = () => {
    setCurrentView('wizard');
    setIsMobileMenuOpen(false);
  };

  const handleSampleSaved = (newSample: SampleRecord) => {
    refreshSamples();
    setSelectedSampleId(newSample.id);
    setCurrentView('detail');
  };

  const handleViewSample = (sampleId: string) => {
    setSelectedSampleId(sampleId);
    setCurrentView('detail');
    setIsMobileMenuOpen(false);
  };

  const handleViewReport = (sampleId: string) => {
    setSelectedSampleId(sampleId);
    setCurrentView('report');
    setIsMobileMenuOpen(false);
  };

  const handleDeleteSample = (sampleId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه العينة؟')) {
      db.deleteSample(sampleId);
      refreshSamples();
      if (selectedSampleId === sampleId) {
        setSelectedSampleId(null);
        setCurrentView('samples');
      }
    }
  };

  const handleSampleUpdated = (_updated: SampleRecord) => {
    refreshSamples();
  };

  const selectedSample = samples.find((s) => s.id === selectedSampleId) || null;

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-slate-800 flex flex-col font-sans selection:bg-[#D95B26]/20 selection:text-[#D95B26]">
      {/* Top Main Navigation Header */}
      <header className="no-print sticky top-0 z-40 bg-white border-b border-orange-100/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center gap-2.5 text-right focus:outline-none group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#D95B26] flex items-center justify-center text-white font-black text-base shadow-sm group-hover:scale-105 transition">
                PT
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black text-slate-900 tracking-tight">PanTissue AI</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-orange-100 text-[#D95B26]">
                    Clinical 3D
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium block">
                  منصة التشخيص النسيجي النانوي
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${
                  currentView === 'dashboard'
                    ? 'bg-orange-50 text-[#D95B26] font-bold'
                    : 'hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>الرئيسية</span>
              </button>

              <button
                onClick={() => setCurrentView('samples')}
                className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${
                  currentView === 'samples' || currentView === 'detail'
                    ? 'bg-orange-50 text-[#D95B26] font-bold'
                    : 'hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <TestTubes className="w-4 h-4" />
                <span>قاعدة بيانات العينات</span>
                {samples.length > 0 && (
                  <span className="text-[10px] bg-orange-100/80 text-[#D95B26] px-1.5 py-0.2 rounded-full font-mono font-bold">
                    {samples.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setCurrentView('analytics')}
                className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${
                  currentView === 'analytics'
                    ? 'bg-orange-50 text-[#D95B26] font-bold'
                    : 'hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>التحليلات ومؤشر DAI</span>
              </button>

              <button
                onClick={() => setCurrentView('settings')}
                className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${
                  currentView === 'settings'
                    ? 'bg-orange-50 text-[#D95B26] font-bold'
                    : 'hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>الإعدادات</span>
              </button>
            </nav>
          </div>

          {/* Right Header Controls (User & Action Button) */}
          <div className="flex items-center gap-2.5">
            {/* Clinical Staff User Badge */}
            <button
              onClick={() => {
                setAuthModalMode('login');
                setIsAuthModalOpen(true);
              }}
              className="flex items-center gap-2 bg-orange-50/60 hover:bg-orange-100/60 border border-orange-200/80 px-3 py-1.5 rounded-xl text-right transition"
              title="إدارة جلسة الطبيب أو تبديل الحساب"
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-[#D95B26] text-white">
                {currentUser.name ? currentUser.name[0] : 'د'}
              </div>
              <div className="hidden lg:block text-right">
                <div className="text-xs font-bold text-slate-800 leading-none">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {currentUser.title}
                </div>
              </div>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1 text-xs font-semibold">
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-right px-3 py-2.5 rounded-lg hover:bg-slate-50 flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-[#D95B26]" />
              <span>لوحة التحكم</span>
            </button>

            <button
              onClick={() => {
                setCurrentView('samples');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-right px-3 py-2.5 rounded-lg hover:bg-slate-50 flex items-center gap-2"
            >
              <TestTubes className="w-4 h-4 text-[#D95B26]" />
              <span>قاعدة بيانات العينات ({samples.length})</span>
            </button>

            <button
              onClick={() => {
                setCurrentView('analytics');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-right px-3 py-2.5 rounded-lg hover:bg-slate-50 flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4 text-[#D95B26]" />
              <span>التحليلات ومؤشر DAI</span>
            </button>

            <button
              onClick={() => {
                setCurrentView('settings');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-right px-3 py-2.5 rounded-lg hover:bg-slate-50 flex items-center gap-2"
            >
              <Settings className="w-4 h-4 text-[#D95B26]" />
              <span>الإعدادات</span>
            </button>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-orange-50 text-[#D95B26] border border-orange-200 py-2.5 rounded-xl font-bold"
              >
                <LogIn className="w-4 h-4" />
                <span>تبديل الحساب أو تسجيل الدخول</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'dashboard' && (
          <DashboardView
            samples={samples}
            currentUser={currentUser}
            onAddNewSample={handleAddNewSample}
            onViewSample={handleViewSample}
            onViewAllSamples={() => setCurrentView('samples')}
          />
        )}

        {currentView === 'samples' && (
          <SamplesTableView
            samples={samples}
            currentUser={currentUser}
            onAddNewSample={handleAddNewSample}
            onViewSample={handleViewSample}
            onViewReport={handleViewReport}
            onDeleteSample={handleDeleteSample}
          />
        )}

        {currentView === 'wizard' && (
          <NewSampleWizard
            currentUser={currentUser}
            onCancel={() => setCurrentView('samples')}
            onSampleSaved={handleSampleSaved}
          />
        )}

        {currentView === 'detail' && selectedSample && (
          <SampleDetailView
            sample={selectedSample}
            currentUser={currentUser}
            onBack={() => setCurrentView('samples')}
            onViewReport={() => setCurrentView('report')}
            onSampleUpdated={handleSampleUpdated}
          />
        )}

        {currentView === 'detail' && !selectedSample && (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-4">لم يتم العثور على العينة المحددة أو ربما تم حذفها.</p>
            <button
              onClick={() => setCurrentView('samples')}
              className="text-[#D95B26] font-semibold hover:underline"
            >
              العودة إلى قائمة العينات
            </button>
          </div>
        )}

        {currentView === 'report' && selectedSample && (
          <PrintableReportView
            sample={selectedSample}
            currentUser={currentUser}
            onBack={() => setCurrentView('detail')}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView
            samples={samples}
            onViewSample={handleViewSample}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            currentUser={currentUser}
            onUserChanged={handleUserChange}
            samplesCount={samples.length}
            onOpenAuthModal={(mode) => {
              setAuthModalMode(mode);
              setIsAuthModalOpen(true);
            }}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Auth Modal for Doctor Registration (First) & Login */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleUserChange}
        initialMode={authModalMode}
      />

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            PanTissue AI © 2026 • منصة التشخيص النانو-جزيئي ثلاثي الأبعاد • إصدار النظام 0.9.0
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>محرك التجزئة: 3D U-Net</span>
            <span>•</span>
            <span>أمان البيانات: تشفير محلي وسحابي ومطابقة لمعايير HIPAA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
