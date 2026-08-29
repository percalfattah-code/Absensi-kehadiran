import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  ShieldCheck,
  History,
  X,
  Check,
  Camera,
  Upload,
  Image as ImageIcon,
  Lock,
  Sparkles,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react';
import { Member, AttendanceRecord, RoleMode } from '../types';
import { extractLandmarksFromImage, captureFacePhotoBlob } from '../services/faceDetection';

interface MemberManagementProps {
  members: Member[];
  records: AttendanceRecord[];
  roleMode: RoleMode;
  onAddMember: (member: Omit<Member, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateMember: (member: Member) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
  onClearAllMembers?: () => Promise<void>;
  onOpenAdminLogin?: () => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  members,
  records,
  roleMode,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onClearAllMembers,
  onOpenAdminLogin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Form fields
  const [nameInput, setNameInput] = useState('');
  const [memberNumInput, setMemberNumInput] = useState('');
  const [avatarUrlInput, setAvatarUrlInput] = useState<string>('');
  const [faceLandmarksInput, setFaceLandmarksInput] = useState<number[] | undefined>(undefined);
  const [isActiveInput, setIsActiveInput] = useState(true);

  // Camera snapshot state
  const [isCapturingCam, setIsCapturingCam] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // History modal state
  const [historyMember, setHistoryMember] = useState<Member | null>(null);

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.memberNumber && m.memberNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingMember(null);
    setNameInput('');
    setMemberNumInput(`KTR-${String(members.length + 1).padStart(3, '0')}`);
    setAvatarUrlInput('');
    setFaceLandmarksInput(undefined);
    setIsActiveInput(true);
    setIsCapturingCam(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setNameInput(m.name);
    setMemberNumInput(m.memberNumber || '');
    setAvatarUrlInput(m.avatarUrl || '');
    setFaceLandmarksInput(m.faceLandmarks);
    setIsActiveInput(m.isActive);
    setIsCapturingCam(false);
    setIsModalOpen(true);
  };

  // Start live webcam for snapshot
  const startCamera = async () => {
    setIsCapturingCam(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      alert('Tidak dapat mengakses kamera untuk foto anggota.');
      setIsCapturingCam(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturingCam(false);
  };

  const takeSnapshot = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 300, 300);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setAvatarUrlInput(dataUrl);

      // Extract facial landmarks for biometric verification
      const landmarks = await extractLandmarksFromImage(dataUrl);
      if (landmarks) {
        setFaceLandmarksInput(landmarks);
      }
    }
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      setAvatarUrlInput(result);

      const landmarks = await extractLandmarksFromImage(result);
      if (landmarks) {
        setFaceLandmarksInput(landmarks);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    if (editingMember) {
      await onUpdateMember({
        ...editingMember,
        name: nameInput.trim(),
        memberNumber: memberNumInput.trim(),
        avatarUrl: avatarUrlInput || undefined,
        faceLandmarks: faceLandmarksInput,
        isActive: isActiveInput,
      });
    } else {
      await onAddMember({
        name: nameInput.trim(),
        memberNumber: memberNumInput.trim(),
        avatarUrl: avatarUrlInput || undefined,
        faceLandmarks: faceLandmarksInput,
        isActive: isActiveInput,
      });
    }
    stopCamera();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 3D HERO HEADER */}
      <div className="card-3d p-6 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-violet-300 to-transparent" />
        
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-500/40 text-[10px] font-black uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span>DATABASE ANGGOTA KARANG TARUNA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Kelola Data Anggota</h2>
          <p className="text-xs text-violet-200/80 mt-1">
            Daftar profil, nomor induk & foto referensi biometrik wajah anggota.
          </p>
        </div>

        {roleMode === 'ADMIN' && (
          <button
            onClick={handleOpenAdd}
            className="px-5 py-3.5 btn-3d-amber text-purple-950 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Anggota Baru</span>
          </button>
        )}
      </div>

      {/* 3D SEARCH & FILTER BAR */}
      <div className="card-3d-subtle p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama anggota atau nomor induk..."
            className="w-full bg-[#110526] text-white placeholder-violet-400/60 text-xs pl-10 pr-4 py-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* 3D MEMBERS GRID LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-xs text-violet-300/70 card-3d p-6">
            Tidak ada anggota yang cocok dengan pencarian "{searchQuery}".
          </div>
        ) : (
          filteredMembers.map((member) => {
            const memberRecords = records.filter((r) => r.memberId === member.id);

            return (
              <div
                key={member.id}
                className="card-3d-subtle p-4 flex flex-col justify-between space-y-4 hover:border-violet-400/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#100522] border-2 border-violet-600/40 shrink-0 flex items-center justify-center font-black text-violet-200 text-sm shadow-md">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      member.name.substring(0, 2).toUpperCase()
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-white truncate">{member.name}</h4>
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${
                        member.isActive
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                      }`}>
                        {member.isActive ? 'AKTIF' : 'NON-AKTIF'}
                      </span>
                    </div>

                    <div className="text-[11px] text-violet-300 font-mono mt-0.5">
                      {member.memberNumber || 'Tanpa ID'}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {member.avatarUrl ? (
                        <span className="text-[10px] font-black text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                          <Fingerprint className="w-3 h-3" /> Biometrik Siap
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-amber-300/80 bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-500/30">
                          Foto Belum Ada
                        </span>
                      )}
                      <span className="text-[10px] text-violet-400">
                        {memberRecords.length}x Absen
                      </span>
                    </div>
                  </div>
                </div>

                {roleMode === 'ADMIN' && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-violet-800/60 text-xs">
                    <button
                      onClick={() => setHistoryMember(member)}
                      className="px-3 py-1.5 btn-3d-dark text-violet-200 rounded-xl font-bold flex items-center gap-1 text-[11px]"
                    >
                      <History className="w-3.5 h-3.5 text-amber-400" />
                      <span>Riwayat</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(member)}
                      className="px-3 py-1.5 btn-3d-dark text-violet-200 rounded-xl font-bold flex items-center gap-1 text-[11px]"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-violet-400" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Yakin ingin menghapus anggota ${member.name}?`)) {
                          onDeleteMember(member.id);
                        }
                      }}
                      className="px-3 py-1.5 btn-3d-rose text-white rounded-xl font-bold flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 3D MODAL: TAMBAH / EDIT ANGGOTA */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-3d p-6 max-w-lg w-full space-y-5 text-white max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              <div className="flex items-center justify-between border-b border-violet-800/80 pb-3">
                <h3 className="text-lg font-black text-white">
                  {editingMember ? 'Edit Profil Anggota' : 'Tambah Anggota Baru'}
                </h3>
                <button
                  onClick={() => {
                    stopCamera();
                    setIsModalOpen(false);
                  }}
                  className="p-1.5 rounded-xl bg-violet-950 text-violet-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div>
                  <label className="block text-violet-300 font-extrabold mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Contoh: Muhammad Rizky"
                    className="w-full bg-[#110526] text-white p-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400"
                  />
                </div>

                <div>
                  <label className="block text-violet-300 font-extrabold mb-1">Nomor Induk Anggota</label>
                  <input
                    type="text"
                    value={memberNumInput}
                    onChange={(e) => setMemberNumInput(e.target.value)}
                    placeholder="Contoh: KTR-001"
                    className="w-full bg-[#110526] text-white p-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400 font-mono"
                  />
                </div>

                {/* 3D Foto Referensi Biometrik Wajah */}
                <div className="space-y-2 pt-1">
                  <label className="block text-violet-300 font-extrabold">Foto Referensi Wajah Biometrik</label>
                  
                  {isCapturingCam ? (
                    <div className="space-y-3 bg-[#110526] p-4 rounded-2xl border border-violet-700/60 text-center">
                      <div className="relative w-48 h-48 mx-auto rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md">
                        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                      </div>
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={takeSnapshot}
                          className="px-4 py-2 btn-3d-amber text-purple-950 font-black rounded-xl"
                        >
                          Ambil Jepretan
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-4 py-2 btn-3d-dark text-violet-300 rounded-xl font-bold"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 bg-[#110526] p-3.5 rounded-2xl border border-violet-700/60">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-violet-950 border border-violet-700 shrink-0 flex items-center justify-center">
                        {avatarUrlInput ? (
                          <img src={avatarUrlInput} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-violet-500" />
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={startCamera}
                            className="px-3 py-2 btn-3d-violet text-white font-bold rounded-xl flex items-center gap-1.5 text-[11px]"
                          >
                            <Camera className="w-3.5 h-3.5 text-amber-300" />
                            <span>Kamera Live</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-2 btn-3d-dark text-violet-200 font-bold rounded-xl flex items-center gap-1.5 text-[11px]"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload File</span>
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>

                        {avatarUrlInput && (
                          <button
                            type="button"
                            onClick={() => {
                              setAvatarUrlInput('');
                              setFaceLandmarksInput(undefined);
                            }}
                            className="text-[10px] text-rose-400 hover:underline"
                          >
                            Hapus Foto
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="statusActive"
                    checked={isActiveInput}
                    onChange={(e) => setIsActiveInput(e.target.checked)}
                    className="rounded text-violet-600 bg-[#110526] border-violet-700"
                  />
                  <label htmlFor="statusActive" className="text-violet-300 font-medium cursor-pointer">
                    Anggota Aktif (Dapat Melakukan Absensi)
                  </label>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setIsModalOpen(false);
                    }}
                    className="w-1/2 py-3 btn-3d-dark text-violet-300 rounded-xl font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-3 btn-3d-amber text-purple-950 font-black rounded-xl uppercase tracking-wider"
                  >
                    Simpan Data
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3D MODAL: RIWAYAT ANGGOTA */}
      <AnimatePresence>
        {historyMember && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-3d p-6 max-w-md w-full space-y-4 text-white max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-violet-800/80 pb-3">
                <div>
                  <h3 className="font-black text-base text-white">{historyMember.name}</h3>
                  <p className="text-[11px] text-violet-300 font-mono">{historyMember.memberNumber}</p>
                </div>
                <button
                  onClick={() => setHistoryMember(null)}
                  className="p-1.5 rounded-xl bg-violet-950 text-violet-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-black text-violet-300 uppercase tracking-wider">
                  Log Kehadiran ({records.filter((r) => r.memberId === historyMember.id).length} kali)
                </span>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {records.filter((r) => r.memberId === historyMember.id).length === 0 ? (
                    <div className="text-center py-6 text-xs text-violet-400">Belum ada riwayat absensi.</div>
                  ) : (
                    records
                      .filter((r) => r.memberId === historyMember.id)
                      .map((rec) => (
                        <div
                          key={rec.id}
                          className="p-3 bg-[#110526] rounded-xl border border-violet-800/60 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-white">{rec.date}</div>
                            <div className="text-[10px] text-violet-400 font-mono">{rec.time} WIB</div>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-black">
                            {rec.status}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <button
                onClick={() => setHistoryMember(null)}
                className="w-full py-3 btn-3d-dark text-violet-200 rounded-xl font-bold text-xs"
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
