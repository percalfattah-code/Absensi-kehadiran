import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Trash2,
  Eye,
  Download,
  Share2,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  Image as ImageIcon,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import { AttendanceRecord, Member, AttendanceSession, RoleMode } from '../types';
import { generateAttendancePdf, downloadOrSharePdf } from '../services/pdf';

interface AttendanceLogProps {
  records: AttendanceRecord[];
  allMembers?: Member[];
  members?: Member[];
  session?: AttendanceSession | null;
  onDeleteRecord?: (id: string) => Promise<void>;
  onClearAllData?: () => Promise<void>;
  roleMode?: RoleMode;
}

export const AttendanceLog: React.FC<AttendanceLogProps> = ({
  records,
  allMembers = [],
  members = [],
  session,
  onDeleteRecord,
  onClearAllData,
  roleMode = 'ADMIN',
}) => {
  const memberList = members.length > 0 ? members : allMembers;
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HADIR' | 'TERLAMBAT'>('ALL');
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; record: AttendanceRecord } | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesName =
        r.name.toLowerCase().includes(searchName.toLowerCase()) ||
        (r.position && r.position.toLowerCase().includes(searchName.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchesName && matchesStatus;
    });
  }, [records, searchName, statusFilter]);

  const handleExportPdf = async () => {
    if (!session) return;
    setIsGeneratingPdf(true);
    try {
      const pdfRes = await generateAttendancePdf(session, memberList, records);
      await downloadOrSharePdf(pdfRes);
    } catch (e) {
      alert('Gagal membuat dokumen PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleViewPhoto = (record: AttendanceRecord) => {
    if (!record.photoBlob) return;
    let url = '';
    if (typeof record.photoBlob === 'string') {
      url = record.photoBlob;
    } else {
      url = URL.createObjectURL(record.photoBlob);
    }
    setPreviewPhoto({ url, record });
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 3D HERO HEADER */}
      <div className="card-3d p-6 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-300 to-transparent" />

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-500/40 text-[10px] font-black uppercase tracking-wider mb-1">
            <FileText className="w-3.5 h-3.5 text-amber-300" />
            <span>LAPORAN REKAPITULASI</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Rekap Absensi Kehadiran</h2>
          <p className="text-xs text-violet-200/80 mt-1">
            Daftar lengkap kehadiran anggota, waktu presensi & bukti foto biometrik.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {session && (
            <button
              onClick={handleExportPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-3 btn-3d-amber text-purple-950 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>{isGeneratingPdf ? 'Exporting...' : 'Unduh Laporan PDF'}</span>
            </button>
          )}

          {roleMode === 'ADMIN' && onClearAllData && (
            <button
              onClick={() => {
                if (confirm('PERINGATAN: Yakin ingin mengosongkan semua riwayat absensi?')) {
                  onClearAllData();
                }
              }}
              className="px-3.5 py-3 btn-3d-rose text-white rounded-2xl text-xs font-black"
              title="Kosongkan Semua Data"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3D SEARCH & FILTER CONTROLS */}
      <div className="card-3d-subtle p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-400" />
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Filter berdasarkan nama..."
            className="w-full bg-[#110526] text-white placeholder-violet-400/60 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['ALL', 'HADIR', 'TERLAMBAT'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                statusFilter === st
                  ? 'btn-3d-violet text-white'
                  : 'btn-3d-dark text-violet-300'
              }`}
            >
              {st === 'ALL' ? 'Semua Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* 3D TABLE / CARD LIST */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="card-3d p-8 text-center text-xs text-violet-400">
            Tidak ada riwayat absensi yang ditemukan.
          </div>
        ) : (
          filteredRecords.map((r) => (
            <div
              key={r.id}
              className="card-3d-subtle p-4 flex items-center justify-between gap-3 hover:border-violet-400/60 transition-all text-xs"
            >
              <div className="flex items-center gap-3.5">
                <div
                  onClick={() => handleViewPhoto(r)}
                  className="w-12 h-12 rounded-2xl overflow-hidden bg-[#100522] border-2 border-violet-600/40 shrink-0 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                >
                  <Eye className="w-5 h-5 text-amber-300" />
                </div>

                <div>
                  <div className="font-extrabold text-sm text-white flex items-center gap-2 flex-wrap">
                    <span>{r.name}</span>
                    {r.position && (
                      <span className="px-2 py-0.5 bg-violet-800/40 text-violet-200 border border-violet-600/40 text-[10px] font-black rounded-lg">
                        {r.position}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-violet-300/80 font-mono mt-0.5">
                    {r.date} • {r.time} WIB
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-[10px] font-black rounded-xl border ${
                  r.status === 'HADIR'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-950 text-amber-300 border-amber-500/40'
                }`}>
                  {r.status}
                </span>

                <button
                  onClick={() => handleViewPhoto(r)}
                  className="p-2 btn-3d-dark text-violet-300 rounded-xl"
                  title="Lihat Foto Absensi"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {roleMode === 'ADMIN' && onDeleteRecord && (
                  <button
                    onClick={() => {
                      if (confirm(`Hapus catatan absensi ${r.name}?`)) {
                        onDeleteRecord(r.id);
                      }
                    }}
                    className="p-2 btn-3d-rose text-white rounded-xl"
                    title="Hapus Rekord"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3D PHOTO PREVIEW MODAL */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-3d p-6 max-w-sm w-full space-y-4 text-white text-center relative border-violet-400/50">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-violet-950 text-violet-400"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="font-black text-base text-white">{previewPhoto.record.name}</h3>
              {previewPhoto.record.position && (
                <span className="inline-block mt-1 px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black rounded-lg">
                  {previewPhoto.record.position}
                </span>
              )}
            </div>
            <div className="w-64 h-64 mx-auto rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xl bg-black">
              <img src={previewPhoto.url} alt="Bukti Foto" className="w-full h-full object-cover" />
            </div>
            <p className="text-[11px] text-violet-300 font-mono">
              Waktu Presensi: {previewPhoto.record.date} {previewPhoto.record.time} WIB
            </p>

            <button
              onClick={() => setPreviewPhoto(null)}
              className="w-full py-3 btn-3d-dark text-white rounded-xl font-bold text-xs"
            >
              Tutup Foto
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
