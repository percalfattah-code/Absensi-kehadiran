import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, UserCheck, Star, Camera, AlertCircle, Clock, Plus, CheckCircle2, ShieldCheck, Sparkles, UserX } from 'lucide-react';
import { Member, AttendanceRecord, AttendanceSession, RoleMode } from '../types';
import { audioService } from '../services/audioService';

interface MemberSelectProps {
  members: Member[];
  todayRecords: AttendanceRecord[];
  session?: AttendanceSession | null;
  selectedMember: Member | null;
  onSelectMember: (member: Member) => void;
  onProceedToCamera?: () => void;
  onStartAttendance?: () => void;
  onAddNewMemberClick?: () => void;
  isSessionOpen?: boolean;
  roleMode?: RoleMode;
  countdownText?: string;
}

export const MemberSelect: React.FC<MemberSelectProps> = ({
  members,
  todayRecords,
  session,
  selectedMember,
  onSelectMember,
  onProceedToCamera,
  onStartAttendance,
  onAddNewMemberClick,
  isSessionOpen,
  roleMode = 'MEMBER',
  countdownText,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = (member: Member) => {
    audioService.unlock();
    audioService.playPromptDing();
    onSelectMember(member);
  };

  const handleStart = () => {
    audioService.unlock();
    audioService.playPromptDing();
    if (onProceedToCamera) onProceedToCamera();
    else if (onStartAttendance) onStartAttendance();
  };

  // Map today's attendance records by member ID
  const todayRecordMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    todayRecords.forEach((r) => map.set(r.memberId, r));
    return map;
  }, [todayRecords]);

  // Filter active members by search query
  const filteredMembers = useMemo(() => {
    return members.filter(
      (m) =>
        m.isActive &&
        (m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.memberNumber && m.memberNumber.toLowerCase().includes(searchQuery.toLowerCase())))
    );
  }, [members, searchQuery]);

  // Check if currently selected member has already attended
  const selectedAlreadyAttendedRecord = selectedMember ? todayRecordMap.get(selectedMember.id) : null;
  const isOpen = session?.isOpen ?? isSessionOpen ?? false;

  return (
    <div className="space-y-6 pb-20">
      {/* 3D HERO CARD: SELECTION BANNER */}
      <div className="card-3d p-6 text-center text-white relative overflow-hidden">
        {/* Glow & light streaks */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-violet-300 to-transparent" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-950/90 border border-violet-400/40 text-amber-300 text-xs font-black uppercase tracking-wider shadow-md">
            <Star className="w-3.5 h-3.5 fill-amber-300 animate-spin" style={{ animationDuration: '10s' }} />
            <span>Portal Absensi Biometrik Wajah</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-[0_4px_10px_rgba(139,92,246,0.5)]">
            Pilih Nama & Mulai Absensi
          </h2>
          <p className="text-xs sm:text-sm text-violet-200/80 max-w-lg mx-auto leading-relaxed">
            Tekan nama Anda dari daftar anggota Karang Taruna di bawah ini, lalu arahkan wajah ke kamera untuk verifikasi biometrik.
          </p>

          {/* Sesi Info Pill */}
          {session && (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs">
              <div className="flex items-center gap-2 bg-violet-950/80 px-3.5 py-1.5 rounded-xl border border-violet-700/60 text-violet-200">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Jam Sesi: <b>{session.startTime} - {session.endTime} WIB</b></span>
              </div>

              {countdownText && (
                <div className="flex items-center gap-1.5 bg-violet-950/80 px-3.5 py-1.5 rounded-xl border border-amber-400/40 text-amber-300 font-mono font-bold">
                  <span>Sisa:</span>
                  <span className="text-amber-400 font-black">{countdownText}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3D SELECTION PANEL */}
      <div className="card-3d-subtle p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-400" />
              <span>1. Temukan Nama Anda</span>
            </h3>
            <p className="text-xs text-violet-300/70">
              Total {members.length} anggota terdaftar dalam database
            </p>
          </div>

          {roleMode === 'ADMIN' && onAddNewMemberClick && (
            <button
              onClick={onAddNewMemberClick}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 btn-3d-amber text-purple-950 rounded-xl text-xs font-black transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Anggota</span>
            </button>
          )}
        </div>

        {/* 3D Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik nama atau nomor anggota..."
            className="w-full bg-[#120626] text-white placeholder-violet-400/60 text-sm pl-10 pr-4 py-3.5 rounded-2xl border border-violet-700/60 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30 transition-all shadow-inner"
          />
        </div>

        {/* 3D Members List Grid */}
        <div className="max-h-72 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-10 text-violet-300/60 text-xs font-medium bg-[#120626]/50 rounded-2xl border border-violet-800/40 p-4">
              <UserX className="w-8 h-8 text-violet-400/40 mx-auto mb-2" />
              Tidak ada nama anggota ditemukan dengan kata kunci "{searchQuery}".
            </div>
          ) : (
            filteredMembers.map((member) => {
              const isSelected = selectedMember?.id === member.id;
              const attendanceRecord = todayRecordMap.get(member.id);
              const isAttended = Boolean(attendanceRecord);

              return (
                <motion.button
                  key={member.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(member)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all duration-150 flex items-center justify-between ${
                    isSelected
                      ? 'bg-gradient-to-r from-violet-700/90 to-purple-800/90 border border-amber-300 text-white shadow-[0_6px_0_0_#4c1d95,0_10px_20px_rgba(0,0,0,0.5)] translate-y-[-2px]'
                      : 'bg-[#15072d]/80 hover:bg-[#1f0b3e] border border-violet-800/60 text-violet-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center font-black text-sm shrink-0 border transition-all ${
                      isSelected
                        ? 'bg-amber-400 text-purple-950 border-white shadow-md'
                        : 'bg-violet-900/60 text-violet-200 border-violet-700/60'
                    }`}>
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        member.name.substring(0, 2).toUpperCase()
                      )}
                    </div>

                    <div>
                      <div className="font-extrabold text-sm flex items-center gap-2">
                        <span>{member.name}</span>
                        {member.avatarUrl && (
                          <span className="text-[10px] font-black text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                            Foto ✓
                          </span>
                        )}
                      </div>
                      {member.memberNumber && (
                        <div className="text-[11px] text-violet-300/70 font-mono mt-0.5">
                          ID: {member.memberNumber}
                        </div>
                      )}
                    </div>
                  </div>

                  {isAttended ? (
                    <span className="flex items-center gap-1.5 text-[11px] font-black text-emerald-300 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-500/50 shadow-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{attendanceRecord?.time}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-violet-400/70 font-medium px-2.5 py-1 rounded-lg bg-violet-950/60">
                      Belum Absen
                    </span>
                  )}
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* 3D SELECTED MEMBER PROCEED CARD */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.96 }}
            className="card-3d p-6 space-y-4 border-amber-400/50"
          >
            <div className="flex items-center justify-between border-b border-violet-800/60 pb-3">
              <div>
                <span className="text-[11px] text-violet-300 uppercase tracking-wider font-bold">Anggota Terpilih:</span>
                <div className="text-xl font-black text-white flex items-center gap-2 mt-0.5">
                  <span className="text-amber-300">{selectedMember.name}</span>
                  <span className="text-[11px] font-extrabold text-violet-200 bg-violet-900/80 px-2.5 py-0.5 rounded-full border border-violet-600">
                    {selectedMember.memberNumber || 'Anggota'}
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance Double Check */}
            {selectedAlreadyAttendedRecord ? (
              <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-400/50 text-amber-200 flex items-start gap-3 shadow-inner">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-black text-sm text-amber-300">
                    Anda sudah melakukan absensi pada pukul {selectedAlreadyAttendedRecord.time} WIB!
                  </p>
                  <p className="text-amber-200/80">
                    Status kehadiran: <b className="text-emerald-400 font-bold">{selectedAlreadyAttendedRecord.status}</b> ({selectedAlreadyAttendedRecord.date}). Data telah tersimpan secara resmi.
                  </p>
                </div>
              </div>
            ) : !isOpen ? (
              <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 flex items-start gap-3 shadow-inner">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-black text-sm text-rose-300">SESI ABSENSI DITUTUP</p>
                  <p className="text-rose-200/80">
                    Sesi absensi saat ini sedang ditutup. Hubungi Pengurus Karang Taruna untuk membuka sesi.
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleStart}
                className="w-full py-4 btn-3d-violet text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl flex items-center justify-center gap-2.5"
              >
                <Camera className="w-5 h-5 text-amber-300" />
                <span>Buka Kamera & Verifikasi Biometrik Wajah</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
