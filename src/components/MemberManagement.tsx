import React, { useState } from 'react';
import { Users, Search, Plus, Edit2, Trash2, UserCheck, ShieldCheck, History, X, Check } from 'lucide-react';
import { Member, AttendanceRecord } from '../types';

interface MemberManagementProps {
  members: Member[];
  records: AttendanceRecord[];
  onAddMember: (member: Omit<Member, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateMember: (member: Member) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  members,
  records,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Form fields
  const [nameInput, setNameInput] = useState('');
  const [memberNumInput, setMemberNumInput] = useState('');
  const [isActiveInput, setIsActiveInput] = useState(true);

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
    setMemberNumInput(`BR-${String(members.length + 1).padStart(3, '0')}`);
    setIsActiveInput(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: Member) => {
    setEditingMember(member);
    setNameInput(member.name);
    setMemberNumInput(member.memberNumber || '');
    setIsActiveInput(member.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    if (editingMember) {
      await onUpdateMember({
        ...editingMember,
        name: nameInput.trim(),
        memberNumber: memberNumInput.trim(),
        isActive: isActiveInput,
      });
    } else {
      await onAddMember({
        name: nameInput.trim(),
        memberNumber: memberNumInput.trim(),
        isActive: isActiveInput,
      });
    }

    setIsModalOpen(false);
  };

  const getMemberRecords = (memberId: string) => {
    return records.filter((r) => r.memberId === memberId);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header Banner */}
      <div className="bg-blue-900 p-5 rounded-3xl border border-blue-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
        <div>
          <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Keanggotaan</span>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>Daftar Anggota Karang Taruna</span>
          </h2>
          <p className="text-xs text-blue-200 mt-1 font-medium">
            Total {members.length} anggota terdaftar dalam sistem Bintang Remaja
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-blue-950 rounded-full text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4 text-blue-950" />
          <span>Tambah Anggota</span>
        </button>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama atau nomor anggota..."
          className="w-full bg-white text-slate-900 placeholder-slate-400 text-sm pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm transition-all"
        />
      </div>

      {/* Members Grid / Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs shadow-sm">
            Tidak ada anggota ditemukan dengan pencarian "{searchQuery}".
          </div>
        ) : (
          filteredMembers.map((member) => {
            const memberRecords = getMemberRecords(member.id);
            return (
              <div
                key={member.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-900 text-amber-400 font-extrabold text-sm flex items-center justify-center border border-blue-800">
                      {member.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <span>{member.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {member.memberNumber || 'Tanpa Nomor'}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      member.isActive
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}
                  >
                    {member.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setHistoryMember(member)}
                    className="text-slate-500 hover:text-blue-600 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <History className="w-3.5 h-3.5 text-blue-600" />
                    <span>{memberRecords.length} kali hadir</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(member)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all"
                      title="Edit Anggota"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus anggota "${member.name}"?`)) {
                          onDeleteMember(member.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-all"
                      title="Hapus Anggota"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingMember ? 'Edit Data Anggota' : 'Tambah Anggota Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzan"
                  className="w-full bg-slate-50 text-slate-900 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nomor Anggota (Opsional)</label>
                <input
                  type="text"
                  value={memberNumInput}
                  onChange={(e) => setMemberNumInput(e.target.value)}
                  placeholder="Contoh: BR-001"
                  className="w-full bg-slate-50 text-slate-900 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:bg-white text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActiveInput}
                  onChange={(e) => setIsActiveInput(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-50 border-slate-300"
                />
                <label htmlFor="isActive" className="text-slate-700 font-bold">
                  Status Anggota Aktif
                </label>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 text-slate-700 rounded-full font-bold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 text-white rounded-full font-extrabold hover:bg-blue-700 shadow-md"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Riwayat Kehadiran</h3>
                <p className="text-xs text-blue-600 font-bold">{historyMember.name}</p>
              </div>
              <button
                onClick={() => setHistoryMember(null)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 text-xs">
              {getMemberRecords(historyMember.id).length === 0 ? (
                <div className="text-center py-6 text-slate-500">Belum ada catatan riwayat absensi.</div>
              ) : (
                getMemberRecords(historyMember.id).map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{rec.date}</div>
                      <div className="text-slate-500 text-[11px]">{rec.time} WIB</div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        rec.status === 'HADIR'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
