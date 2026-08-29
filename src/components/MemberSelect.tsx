import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, UserCheck, Star, Camera, AlertCircle, Clock, Plus, CheckCircle2 } from 'lucide-react';
import { Member, AttendanceRecord, AttendanceSession } from '../types';

interface MemberSelectProps {
  members: Member[];
  todayRecords: AttendanceRecord[];
  session: AttendanceSession;
  selectedMember: Member | null;
  onSelectMember: (member: Member) => void;
  onStartAttendance: () => void;
  onAddNewMemberClick: () => void;
  countdownText: string;
}

export const MemberSelect: React.FC<MemberSelectProps> = ({
  members,
  todayRecords,
  session,
  selectedMember,
  onSelectMember,
  onStartAttendance,
  onAddNewMemberClick,
  countdownText,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div className="space-y-5 pb-20">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-blue-900 p-6 border border-blue-800 shadow-md text-center text-white">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400 text-blue-950 text-xs font-extrabold mb-3 shadow">
          <Star className="w-3.5 h-3.5 fill-blue-950" />
          <span>Sistem Absensi Kehadiran Karang Taruna</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Selamat Datang di Bintang Remaja
        </h2>
        <p className="mt-2 text-sm text-blue-200 max-w-lg mx-auto">
          Pilih nama Anda di bawah ini untuk memulai absensi kehadiran dengan verifikasi wajah real-time.
        </p>

        {/* Session Status Banner */}
        <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-4 bg-blue-950/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-blue-800 text-xs">
          <div className="flex items-center gap-2 text-blue-100">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Sesi: <b>{session.startTime} - {session.endTime} WIB</b></span>
          </div>

          <div className="h-3 w-[1px] bg-blue-800 hidden sm:block"></div>

          <div className="flex items-center gap-1.5 font-mono text-amber-400 font-bold">
            <span>Sisa Waktu:</span>
            <span className="bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30 text-amber-300">{countdownText}</span>
          </div>
        </div>
      </div>

      {/* Member Selection Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              1. Pilih Nama Anggota
            </h3>
            <p className="text-xs text-slate-500">Cari dan tekan nama Anda dari daftar anggota Karang Taruna</p>
          </div>

          <button
            onClick={onAddNewMemberClick}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-blue-700 rounded-xl text-xs font-bold border border-slate-200 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Anggota Baru</span>
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik nama anggota..."
            className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 transition-all"
          />
        </div>

        {/* Members List Container */}
        <div className="max-h-60 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-slate-300">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs font-medium">
              Tidak ada anggota ditemukan dengan kata kunci "{searchQuery}".
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
                  onClick={() => onSelectMember(member)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold ring-1 ring-blue-600 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs transition-colors ${
                      isSelected ? 'bg-blue-900 text-amber-400' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {member.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="font-semibold text-sm">{member.name}</div>
                      {member.memberNumber && (
                        <div className="text-[11px] text-slate-500 font-medium">{member.memberNumber}</div>
                      )}
                    </div>
                  </div>

                  {isAttended ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      <span>{attendanceRecord?.time}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">Belum Absen</span>
                  )}
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* Selected Member Warning / Action Box */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs text-slate-500 font-medium">Anggota Dipilih:</span>
                <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  {selectedMember.name}
                  <span className="text-xs font-bold text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {selectedMember.memberNumber || 'Anggota'}
                  </span>
                </div>
              </div>
            </div>

            {/* Double Attendance Prevention Check */}
            {selectedAlreadyAttendedRecord ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-sm text-amber-800">
                    Anda sudah melakukan absensi pada pukul {selectedAlreadyAttendedRecord.time}!
                  </p>
                  <p className="text-amber-700">
                    Status: <b className="text-green-700">{selectedAlreadyAttendedRecord.status}</b> pada tanggal {selectedAlreadyAttendedRecord.date}. Rekord ganda tidak diizinkan.
                  </p>
                </div>
              </div>
            ) : !session.isOpen ? (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-sm text-red-700">ABSENSI TELAH DITUTUP</p>
                  <p className="text-slate-600">
                    Sesi absensi untuk hari ini telah berakhir. Hubungi pengurus Karang Taruna jika membutuhkan penyesuaian.
                  </p>
                </div>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.01 }}
                onClick={onStartAttendance}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-full shadow-md flex items-center justify-center gap-2.5 transition-all"
              >
                <Camera className="w-5 h-5 text-amber-300" />
                <span>Buka Kamera & Liveness Verification</span>
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
