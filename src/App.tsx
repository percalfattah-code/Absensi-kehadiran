import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Member, AttendanceRecord, AttendanceSession, ViewMode, RoleMode, EventAnnouncement } from './types';
import {
  initSeedData,
  getAllMembers,
  addMember,
  updateMember,
  deleteMember,
  clearAllMembersData,
  getAllAttendanceRecords,
  saveAttendanceRecord,
  deleteAttendanceRecord,
  clearAllAttendanceData,
  getActiveSession,
  updateActiveSession,
  getAllAnnouncements,
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from './services/db';
import { generateAttendancePdf, downloadOrSharePdf } from './services/pdf';
import {
  getStoredSheetsConfig,
  saveSheetsConfig,
  GoogleSheetsSyncState,
  requestGoogleAccessToken,
  syncDataToGoogleSheets,
} from './services/googleSheets';

// Components
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { RunningMarquee } from './components/RunningMarquee';
import { MemberSelect } from './components/MemberSelect';
import { CameraView } from './components/CameraView';
import { SuccessView } from './components/SuccessView';
import { AdminDashboard } from './components/AdminDashboard';
import { MemberManagement } from './components/MemberManagement';
import { AttendanceLog } from './components/AttendanceLog';
import { SessionSettings } from './components/SessionSettings';
import { AnnouncementPanel } from './components/AnnouncementPanel';
import { AndroidShortcutModal } from './components/AndroidShortcutModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { LoginScreen } from './components/LoginScreen';
import { Shield, ShieldCheck, UserCheck, Bell, Lock, Unlock, Megaphone, FileSpreadsheet, Smartphone, Download } from 'lucide-react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<ViewMode>('absensi');
  const [roleMode, setRoleMode] = useState<RoleMode>('MEMBER');
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [pendingAdminView, setPendingAdminView] = useState<ViewMode | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [announcements, setAnnouncements] = useState<EventAnnouncement[]>([]);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [lastSubmittedRecord, setLastSubmittedRecord] = useState<AttendanceRecord | null>(null);

  // Countdown, PWA & Sheets states
  const [countdownText, setCountdownText] = useState('00:00:00');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsSyncState>(getStoredSheetsConfig());
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);

  // Initialize DB and load initial data
  const loadData = useCallback(async () => {
    try {
      await initSeedData();
      const mList = await getAllMembers();
      setMembers(mList);

      const sess = await getActiveSession();
      setSession(sess);

      const records = await getAllAttendanceRecords();
      setAttendanceRecords(records);

      const annList = await getAllAnnouncements();
      setAnnouncements(annList);
    } catch (e) {
      console.error('Data initialization error:', e);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Parse URL params for Android Shortcut / Homescreen launch
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const targetView = urlParams.get('view');
      if (targetView) {
        if (targetView === 'absensi') {
          setIsLoggedIn(true);
          setRoleMode('MEMBER');
          setCurrentView('absensi');
        } else if (targetView === 'pengumuman') {
          setIsLoggedIn(true);
          setCurrentView('pengumuman');
        } else if (targetView === 'dashboard') {
          setIsLoggedIn(true);
          setRoleMode('ADMIN');
          setCurrentView('dashboard');
        }
      }
    } catch (e) {
      console.warn('URL param parse error:', e);
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Capture PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      console.log('PWA was installed successfully');
      setDeferredPrompt(null);
      setIsInstallModalOpen(false);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [loadData]);

  // Google Sheets Auto Sync Helper
  const triggerGoogleSheetsSync = async (currentMembers = members, currentRecords = attendanceRecords) => {
    if (!sheetsConfig.accessToken) return;
    setIsSyncingSheets(true);
    try {
      const res = await syncDataToGoogleSheets(
        sheetsConfig.accessToken,
        currentMembers,
        currentRecords,
        session?.title || 'Sesi Karang Taruna',
        sheetsConfig.spreadsheetId
      );

      const updatedConfig: GoogleSheetsSyncState = {
        ...sheetsConfig,
        isConnected: true,
        spreadsheetId: res.spreadsheetId,
        spreadsheetUrl: res.spreadsheetUrl,
        lastSyncedAt: res.syncedAt,
      };
      setSheetsConfig(updatedConfig);
      saveSheetsConfig(updatedConfig);
    } catch (err) {
      console.warn('Auto sync Google Sheets background error:', err);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Google Sheets Manual / Initial Connection Handler
  const handleConnectGoogleSheets = async () => {
    try {
      const token = await requestGoogleAccessToken();
      setIsSyncingSheets(true);

      const res = await syncDataToGoogleSheets(
        token,
        members,
        attendanceRecords,
        session?.title || 'Sesi Karang Taruna',
        sheetsConfig.spreadsheetId
      );

      const newConfig: GoogleSheetsSyncState = {
        isConnected: true,
        accessToken: token,
        spreadsheetId: res.spreadsheetId,
        spreadsheetUrl: res.spreadsheetUrl,
        lastSyncedAt: res.syncedAt,
      };
      setSheetsConfig(newConfig);
      saveSheetsConfig(newConfig);

      alert('Berhasil terhubung dengan Google Sheets! Document Spreadsheet siap digunakan.');
    } catch (err: any) {
      alert(err.message || 'Gagal menghubungkan Google Sheets.');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Session Realtime Countdown & Auto PDF Generation on Expire
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(async () => {
      const now = new Date();
      const [endHour, endMin] = session.endTime.split(':').map((n) => parseInt(n, 10));

      const targetEnd = new Date(now);
      targetEnd.setHours(endHour, endMin, 0, 0);

      const diffMs = targetEnd.getTime() - now.getTime();

      if (diffMs <= 0) {
        setCountdownText('00:00:00');
        if (session.isOpen) {
          const updatedSession: AttendanceSession = {
            ...session,
            isOpen: false,
            autoPdfGenerated: true,
          };
          setSession(updatedSession);
          await updateActiveSession(updatedSession);

          if (!session.autoPdfGenerated) {
            try {
              const currentMembers = await getAllMembers();
              const currentRecords = await getAllAttendanceRecords();
              const pdfResult = await generateAttendancePdf(updatedSession, currentMembers, currentRecords);
              await downloadOrSharePdf(pdfResult);
            } catch (err) {
              console.warn('Auto PDF generation error:', err);
            }
          }
        }
      } else {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        const pad = (n: number) => String(n).padStart(2, '0');
        setCountdownText(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  // Filter today's attendance records
  const todayRecords = useMemo(() => {
    if (!session) return [];
    const [y, m, d] = session.sessionDate.split('-');
    const formattedDate = `${d}/${m}/${y}`;
    return attendanceRecords.filter((r) => r.date === formattedDate);
  }, [session, attendanceRecords]);

  // Handle Attendance Verification Success
  const handleVerificationSuccess = async (photoBlob: Blob) => {
    if (!selectedMember || !session) return;

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');

    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1);
    const year = now.getFullYear();
    const dateStr = `${day}/${month}/${year}`;

    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    const timeStr = `${hours}:${minutes}:${seconds}`;

    let status: 'HADIR' | 'TERLAMBAT' = 'HADIR';
    if (session.lateThreshold) {
      const [lateH, lateM] = session.lateThreshold.split(':').map((n) => parseInt(n, 10));
      const lateTime = new Date(now);
      lateTime.setHours(lateH, lateM, 0, 0);

      if (now.getTime() > lateTime.getTime()) {
        status = 'TERLAMBAT';
      }
    }

    const sanitizedName = selectedMember.name.toUpperCase().replace(/\s+/g, '_');
    const formattedDateForFile = `${day}-${month}-${year}`;
    const formattedTimeForFile = `${hours}-${minutes}-${seconds}`;
    const fileName = `ABSENSI_${sanitizedName}_${formattedDateForFile}_${formattedTimeForFile}.jpg`;

    const newRecord: AttendanceRecord = {
      id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      memberId: selectedMember.id,
      name: selectedMember.name,
      date: dateStr,
      time: timeStr,
      status: status,
      photoBlob: photoBlob,
      fileName: fileName,
      timestamp: Date.now(),
    };

    await saveAttendanceRecord(newRecord);

    const updatedRecords = await getAllAttendanceRecords();
    setAttendanceRecords(updatedRecords);

    setLastSubmittedRecord(newRecord);
    setIsCameraActive(false);

    // Auto sync to Google Sheets
    triggerGoogleSheetsSync(members, updatedRecords);
  };

  // Member CRUD Actions
  const handleAddMember = async (newM: Omit<Member, 'id' | 'createdAt'>) => {
    await addMember(newM);
    const updatedM = await getAllMembers();
    setMembers(updatedM);
    triggerGoogleSheetsSync(updatedM, attendanceRecords);
  };

  const handleUpdateMember = async (updatedM: Member) => {
    await updateMember(updatedM);
    const refreshed = await getAllMembers();
    setMembers(refreshed);
    triggerGoogleSheetsSync(refreshed, attendanceRecords);
  };

  const handleDeleteMember = async (id: string) => {
    await deleteMember(id);
    const refreshed = await getAllMembers();
    setMembers(refreshed);
    triggerGoogleSheetsSync(refreshed, attendanceRecords);
  };

  const handleClearAllMembers = async () => {
    await clearAllMembersData();
    setMembers([]);
    triggerGoogleSheetsSync([], attendanceRecords);
  };

  // Delete Record Action
  const handleDeleteRecord = async (id: string) => {
    await deleteAttendanceRecord(id);
    const refreshed = await getAllAttendanceRecords();
    setAttendanceRecords(refreshed);
    triggerGoogleSheetsSync(members, refreshed);
  };

  // Announcement CRUD Handlers
  const handleAddAnnouncement = async (ann: Omit<EventAnnouncement, 'id' | 'createdAt'>) => {
    const created = await addAnnouncement(ann);
    setAnnouncements((prev) => [created, ...prev]);
  };

  const handleUpdateAnnouncement = async (ann: EventAnnouncement) => {
    await updateAnnouncement(ann);
    setAnnouncements((prev) => prev.map((item) => (item.id === ann.id ? ann : item)));
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await deleteAnnouncement(id);
    setAnnouncements((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear All Attendance Data Action
  const handleClearAllData = async () => {
    await clearAllAttendanceData();
    setAttendanceRecords([]);
    triggerGoogleSheetsSync(members, []);
  };

  // Toggle Session Open Status
  const handleToggleSession = async () => {
    if (!session) return;
    const updated = { ...session, isOpen: !session.isOpen };
    setSession(updated);
    await updateActiveSession(updated);
  };

  // Update Session Configuration
  const handleUpdateSessionConfig = async (updated: AttendanceSession) => {
    setSession(updated);
    await updateActiveSession(updated);
  };

  // PWA Install Trigger
  const handleInstallPwa = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
        setIsInstallModalOpen(false);
      });
    }
  };

  // Admin Role Authentication Handlers
  const handleOpenAdminLogin = (targetView?: ViewMode) => {
    if (targetView) setPendingAdminView(targetView);
    setIsAdminAuthModalOpen(true);
  };

  const handleAdminAuthSuccess = () => {
    setRoleMode('ADMIN');
    setIsAdminAuthModalOpen(false);
    if (pendingAdminView) {
      setCurrentView(pendingAdminView);
      setPendingAdminView(null);
    }
  };

  const handleLockAdminMode = () => {
    setRoleMode('MEMBER');
    if (['dashboard', 'sesi'].includes(currentView)) {
      setCurrentView('absensi');
    }
  };

  const handleRoleSelectFromLogin = (role: RoleMode, pinVerified?: boolean) => {
    setRoleMode(role);
    setIsLoggedIn(true);
    if (role === 'ADMIN' && pinVerified) {
      setCurrentView('dashboard');
    } else {
      setCurrentView('absensi');
    }
  };

  // Show Initial Role Login Screen if user has not selected role/logged in
  if (!isLoggedIn) {
    return (
      <>
        <LoginScreen
          onSelectRole={handleRoleSelectFromLogin}
          sheetsConfig={sheetsConfig}
          onConnectGoogleSheets={handleConnectGoogleSheets}
          deferredPrompt={deferredPrompt}
          onOpenShortcutModal={() => setIsInstallModalOpen(true)}
        />
        {isInstallModalOpen && (
          <AndroidShortcutModal
            isOpen={isInstallModalOpen}
            onClose={() => setIsInstallModalOpen(false)}
            deferredPrompt={deferredPrompt}
            onInstallNative={handleInstallPwa}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0217] text-white flex flex-col font-sans selection:bg-violet-600 selection:text-white">
      {/* Running Marquee Banner across Admin & Member Views */}
      <RunningMarquee />

      {/* App Top Header */}
      <Header
        session={session}
        deferredPrompt={deferredPrompt}
        onInstallClick={() => setIsInstallModalOpen(true)}
        isOffline={isOffline}
        roleMode={roleMode}
        sheetsConfig={sheetsConfig}
        onOpenAdminLogin={() => handleOpenAdminLogin()}
        onLockAdminMode={handleLockAdminMode}
        onLogoutToLoginScreen={() => setIsLoggedIn(false)}
        onConnectGoogleSheets={handleConnectGoogleSheets}
      />

      {/* Active Role Portal Banner & Notification Ticker */}
      <div className="bg-[#120426] text-white px-4 py-2 border-b border-violet-900/60 shadow-inner">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {roleMode === 'ADMIN' ? (
              <span className="px-2.5 py-0.5 btn-3d-amber text-slate-950 font-black rounded-full text-[10px] uppercase flex items-center gap-1 shadow-sm">
                <ShieldCheck className="w-3 h-3 text-slate-950" />
                PANEL PENGURUS
              </span>
            ) : (
              <span className="px-2.5 py-0.5 btn-3d-violet text-white font-extrabold rounded-full text-[10px] uppercase flex items-center gap-1 shadow-sm">
                <UserCheck className="w-3 h-3" />
                PORTAL ANGGOTA
              </span>
            )}
            <span className="text-violet-300 font-medium hidden xs:inline text-xs">
              {roleMode === 'ADMIN'
                ? 'Mode Pengurus Aktif (Akses Penuh Kelola Data & Sesi)'
                : 'Mode Anggota (Absensi & Agenda)'}
            </span>
          </div>

          {/* Quick Notice Banner / Ticker for Active Announcements */}
          {announcements.filter((a) => a.isActive).length > 0 && (
            <div className="flex items-center gap-1.5 text-amber-300 font-bold overflow-hidden text-[11px]">
              <Megaphone className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-bounce" />
              <span className="truncate max-w-xs sm:max-w-md">
                Info Acara: {announcements.filter((a) => a.isActive)[0].title} (
                {announcements.filter((a) => a.isActive)[0].eventDate})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <AnimatePresence mode="wait">
          {/* VIEW 1: ABSENSI KEHADIRAN (MEMBER & ADMIN) */}
          {currentView === 'absensi' && (
            <motion.div
              key="absensi"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Active Session Status & Timer Banner */}
              {session && (
                <div
                  className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                    session.isOpen
                      ? 'card-3d border-violet-400/50'
                      : 'card-3d-subtle opacity-90'
                  } flex flex-col md:flex-row md:items-center justify-between gap-4`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          session.isOpen ? 'bg-emerald-400 text-purple-950 shadow-sm' : 'bg-rose-500 text-white'
                        }`}
                      >
                        {session.isOpen ? 'Sesi Berlangsung' : 'Sesi Ditutup'}
                      </span>
                      {session.isOpen && (
                        <span className="text-xs text-amber-300 font-extrabold">
                          Batas Jam: {session.endTime} WIB
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">{session.title}</h2>
                    <p className="text-xs text-violet-200">{session.description}</p>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-violet-800/60 pt-3 md:pt-0">
                    <div className="text-right space-y-0.5">
                      <div className="text-[10px] text-violet-300 uppercase font-black tracking-wider">
                        Sisa Waktu Sesi
                      </div>
                      <div className="text-xl sm:text-2xl font-mono font-black text-amber-300 tracking-wider">
                        {countdownText}
                      </div>
                    </div>

                    {roleMode === 'ADMIN' && (
                      <button
                        onClick={handleToggleSession}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap ${
                          session.isOpen
                            ? 'btn-3d-rose text-white'
                            : 'btn-3d-amber text-slate-950'
                        }`}
                      >
                        {session.isOpen ? 'Tutup Sesi Sekarang' : 'Buka Sesi Absensi'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Attendance Flow View Logic */}
              {!lastSubmittedRecord ? (
                !isCameraActive ? (
                  <MemberSelect
                    members={members}
                    todayRecords={todayRecords}
                    selectedMember={selectedMember}
                    onSelectMember={(m) => setSelectedMember(m)}
                    onProceedToCamera={() => setIsCameraActive(true)}
                    isSessionOpen={session?.isOpen ?? false}
                  />
                ) : (
                  selectedMember && (
                    <CameraView
                      selectedMember={selectedMember}
                      onSuccess={handleVerificationSuccess}
                      onCancel={() => setIsCameraActive(false)}
                    />
                  )
                )
              ) : (
                <SuccessView
                  record={lastSubmittedRecord}
                  member={members.find((m) => m.id === lastSubmittedRecord.memberId) || null}
                  onReset={() => {
                    setLastSubmittedRecord(null);
                    setSelectedMember(null);
                    setIsCameraActive(false);
                  }}
                />
              )}
            </motion.div>
          )}

          {/* VIEW 2: PEMBERITAHUAN & ACARA */}
          {currentView === 'pengumuman' && (
            <motion.div
              key="pengumuman"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AnnouncementPanel
                announcements={announcements}
                roleMode={roleMode}
                onAddAnnouncement={handleAddAnnouncement}
                onUpdateAnnouncement={handleUpdateAnnouncement}
                onDeleteAnnouncement={handleDeleteAnnouncement}
                onOpenAdminLogin={() => handleOpenAdminLogin('pengumuman')}
              />
            </motion.div>
          )}

          {/* VIEW 3: MANAJEMEN ANGGOTA (MEMBER & ADMIN) */}
          {currentView === 'anggota' && (
            <motion.div
              key="anggota"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <MemberManagement
                members={members}
                records={attendanceRecords}
                roleMode={roleMode}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                onDeleteMember={handleDeleteMember}
                onClearAllMembers={handleClearAllMembers}
                onOpenAdminLogin={() => handleOpenAdminLogin('anggota')}
              />
            </motion.div>
          )}

          {/* VIEW 4: REKAP ABSENSI */}
          {currentView === 'rekap' && (
            <motion.div
              key="rekap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AttendanceLog
                records={attendanceRecords}
                members={members}
                session={session}
                roleMode={roleMode}
                onDeleteRecord={handleDeleteRecord}
                onClearAllData={handleClearAllData}
              />
            </motion.div>
          )}

          {/* VIEW 5: DASHBOARD GRAFIK (KHUSUS ADMIN) */}
          {currentView === 'dashboard' && roleMode === 'ADMIN' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AdminDashboard
                members={members}
                records={attendanceRecords}
                session={session}
                announcements={announcements}
                countdownText={countdownText}
                onToggleSession={handleToggleSession}
                onNavigate={(v) => setCurrentView(v)}
              />
            </motion.div>
          )}

          {/* VIEW 6: PENGATURAN SESI (KHUSUS ADMIN) */}
          {currentView === 'pengaturan' && roleMode === 'ADMIN' && (
            <motion.div
              key="pengaturan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SessionSettings
                session={session}
                onUpdateSession={handleUpdateSessionConfig}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Sticky Navigation Bar */}
      <Navigation
        currentView={currentView}
        roleMode={roleMode}
        onViewChange={(v) => setCurrentView(v)}
        onOpenAdminLogin={() => handleOpenAdminLogin()}
      />

      {/* Admin PIN Auth Modal Sheet */}
      {isAdminAuthModalOpen && (
        <AdminAuthModal
          onClose={() => setIsAdminAuthModalOpen(false)}
          onSuccess={handleAdminAuthSuccess}
        />
      )}

      {/* Android Shortcut & PWA Install Guide Modal */}
      {isInstallModalOpen && (
        <AndroidShortcutModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
          deferredPrompt={deferredPrompt}
          onInstallNative={handleInstallPwa}
        />
      )}
    </div>
  );
}
