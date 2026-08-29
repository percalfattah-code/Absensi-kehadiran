import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Member, AttendanceRecord, AttendanceSession, ViewMode } from './types';
import {
  initSeedData,
  getAllMembers,
  addMember,
  updateMember,
  deleteMember,
  getAllAttendanceRecords,
  saveAttendanceRecord,
  deleteAttendanceRecord,
  clearAllAttendanceData,
  getActiveSession,
  updateActiveSession,
} from './services/db';
import { generateAttendancePdf, downloadOrSharePdf } from './services/pdf';

// Components
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { MemberSelect } from './components/MemberSelect';
import { CameraView } from './components/CameraView';
import { SuccessView } from './components/SuccessView';
import { AdminDashboard } from './components/AdminDashboard';
import { MemberManagement } from './components/MemberManagement';
import { AttendanceLog } from './components/AttendanceLog';
import { SessionSettings } from './components/SessionSettings';
import { InstallPwaModal } from './components/InstallPwaModal';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('absensi');

  const [members, setMembers] = useState<Member[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [session, setSession] = useState<AttendanceSession | null>(null);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [lastSubmittedRecord, setLastSubmittedRecord] = useState<AttendanceRecord | null>(null);

  // Countdown & PWA states
  const [countdownText, setCountdownText] = useState('00:00:00');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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
    } catch (e) {
      console.error('Data initialization error:', e);
    }
  }, []);

  useEffect(() => {
    loadData();

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

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [loadData]);

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
        // If session was open and timer expired, auto close & auto generate PDF
        if (session.isOpen) {
          const updatedSession: AttendanceSession = {
            ...session,
            isOpen: false,
            autoPdfGenerated: true,
          };
          setSession(updatedSession);
          await updateActiveSession(updatedSession);

          // Auto generate PDF rekap
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
    // Convert sessionDate (YYYY-MM-DD) to DD/MM/YYYY for comparison
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
    const dateStr = `${day}/${month}/${year}`; // DD/MM/YYYY

    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    const timeStr = `${hours}:${minutes}:${seconds}`; // HH:MM:SS

    // Determine status (HADIR vs TERLAMBAT)
    let status: 'HADIR' | 'TERLAMBAT' = 'HADIR';
    if (session.lateThreshold) {
      const [lateH, lateM] = session.lateThreshold.split(':').map((n) => parseInt(n, 10));
      const lateTime = new Date(now);
      lateTime.setHours(lateH, lateM, 0, 0);

      if (now.getTime() > lateTime.getTime()) {
        status = 'TERLAMBAT';
      }
    }

    // Format file name: ABSENSI_AHMAD_FAUZAN_29-08-2026_19-32-15.jpg
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

    // Save to IndexedDB
    await saveAttendanceRecord(newRecord);

    // Refresh records state
    const updatedRecords = await getAllAttendanceRecords();
    setAttendanceRecords(updatedRecords);

    setLastSubmittedRecord(newRecord);
    setIsCameraActive(false);
  };

  // Member CRUD Actions
  const handleAddMember = async (newM: Omit<Member, 'id' | 'createdAt'>) => {
    await addMember(newM);
    setMembers(await getAllMembers());
  };

  const handleUpdateMember = async (updatedM: Member) => {
    await updateMember(updatedM);
    setMembers(await getAllMembers());
  };

  const handleDeleteMember = async (id: string) => {
    await deleteMember(id);
    setMembers(await getAllMembers());
  };

  // Delete Record Action
  const handleDeleteRecord = async (id: string) => {
    await deleteAttendanceRecord(id);
    setAttendanceRecords(await getAllAttendanceRecords());
  };

  // Clear All Attendance Data Action
  const handleClearAllData = async () => {
    await clearAllAttendanceData();
    setAttendanceRecords([]);
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

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
        <div className="animate-pulse text-sm text-slate-600 font-semibold">
          Memuat Sistem Absensi Bintang Remaja...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* App Top Header */}
      <Header
        session={session}
        deferredPrompt={deferredPrompt}
        onInstallClick={() => setIsInstallModalOpen(true)}
        isOffline={isOffline}
      />

      {/* App Desktop / Mobile Navigation Tabs */}
      <Navigation currentView={currentView} onViewChange={setCurrentView} />

      {/* Main Container View Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentView === 'absensi' && (
            <motion.div
              key="absensi"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              {lastSubmittedRecord ? (
                <SuccessView
                  record={lastSubmittedRecord}
                  onDone={() => {
                    setLastSubmittedRecord(null);
                    setSelectedMember(null);
                  }}
                  onViewRekap={() => {
                    setLastSubmittedRecord(null);
                    setSelectedMember(null);
                    setCurrentView('rekap');
                  }}
                />
              ) : isCameraActive && selectedMember ? (
                <CameraView
                  member={selectedMember}
                  onVerificationSuccess={handleVerificationSuccess}
                  onCancel={() => setIsCameraActive(false)}
                />
              ) : (
                <MemberSelect
                  members={members}
                  todayRecords={todayRecords}
                  session={session}
                  selectedMember={selectedMember}
                  onSelectMember={setSelectedMember}
                  onStartAttendance={() => setIsCameraActive(true)}
                  onAddNewMemberClick={() => setCurrentView('anggota')}
                  countdownText={countdownText}
                />
              )}
            </motion.div>
          )}

          {currentView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <AdminDashboard
                session={session}
                allMembers={members}
                records={attendanceRecords}
                countdownText={countdownText}
                onToggleSession={handleToggleSession}
                onExportPdf={async () => {
                  const res = await generateAttendancePdf(session, members, attendanceRecords);
                  await downloadOrSharePdf(res);
                }}
                onNavigate={setCurrentView}
              />
            </motion.div>
          )}

          {currentView === 'anggota' && (
            <motion.div
              key="anggota"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <MemberManagement
                members={members}
                records={attendanceRecords}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                onDeleteMember={handleDeleteMember}
              />
            </motion.div>
          )}

          {currentView === 'rekap' && (
            <motion.div
              key="rekap"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <AttendanceLog
                records={attendanceRecords}
                allMembers={members}
                session={session}
                onDeleteRecord={handleDeleteRecord}
              />
            </motion.div>
          )}

          {currentView === 'pengaturan' && (
            <motion.div
              key="pengaturan"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <SessionSettings
                session={session}
                onUpdateSession={handleUpdateSessionConfig}
                onClearAllData={handleClearAllData}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* PWA Install Guide Modal */}
      <InstallPwaModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onInstall={handleInstallPwa}
      />
    </div>
  );
}
