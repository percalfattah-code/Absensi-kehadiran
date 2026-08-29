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
} from 'lucide-react';
import { AttendanceRecord, Member, AttendanceSession } from '../types';
import { generateAttendancePdf, downloadOrSharePdf } from '../services/pdf';

interface AttendanceLogProps {
  records: AttendanceRecord[];
  allMembers: Member[];
  session: AttendanceSession;
  onDeleteRecord: (id: string) => Promise<void>;
}

export const AttendanceLog: React.FC<AttendanceLogProps> = ({
  records,
  allMembers,
  session,
  onDeleteRecord,
}) => {
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HADIR' | 'TERLAMBAT' | 'TIDAK HADIR'>('ALL');
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; record: AttendanceRecord } | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesName = r.name.toLowerCase().includes(searchName.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchesName && matchesStatus;
    });
  }, [records, searchName, statusFilter]);

  // Statistics
  const totalMembers = allMembers.length;
  const attendedCount = records.length;
  const missingCount = Math.max(0, totalMembers - attendedCount);
  const percentage = totalMembers > 0 ? Math.round((attendedCount / totalMembers) * 100) : 0;

  // View Photo Blob Modal Handler
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

  // Close Photo Modal
  const handleClosePhotoModal = () => {
    if (previewPhoto && previewPhoto.url.startsWith('blob:')) {
      URL.revokeObjectURL(previewPhoto.url);
    }
    setPreviewPhoto(null);
  };

  // Export PDF Handler
  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdfResult = await generateAttendancePdf(session, allMembers, records);
      await downloadOrSharePdf(pdfResult);
    } catch (e) {
      console.error('Export PDF error:', e);
      alert('Gagal membuat PDF rekap absensi.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Top Banner */}
      <div className="bg-blue-900 p-5 rounded-3xl border border-blue-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
        <div>
          <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Laporan Kehadiran</span>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-400" />
            <span>REKAP ABSENSI KEHADIRAN</span>
          </h2>
          <p className="text-xs text-blue-200 mt-1 font-medium">
            Data kehadiran Karang Taruna Bintang Remaja sesi {session.sessionDate}
          </p>
        </div>

        <button
          onClick={handleExportPdf}
          disabled={isGeneratingPdf}
          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-extrabold rounded-full text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 active:scale-95"
        >
          {isGeneratingPdf ? (
            <span>Membuat PDF...</span>
          ) : (
            <>
              <Download className="w-4 h-4 text-blue-950" />
              <span>Export File PDF Rekap</span>
            </>
          )}
        </button>
      </div>

      {/* Summary Statistics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 font-semibold">Total Anggota</div>
          <div className="text-lg font-black text-slate-900 mt-0.5">{totalMembers}</div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 font-semibold">Hadir</div>
          <div className="text-lg font-black text-green-600 mt-0.5">{attendedCount}</div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 font-semibold">Belum Absen</div>
          <div className="text-lg font-black text-red-600 mt-0.5">{missingCount}</div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 font-semibold">Persentase</div>
          <div className="text-lg font-black text-amber-600 mt-0.5">{percentage}%</div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Cari nama..."
            className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-500 font-bold shrink-0">Filter Status:</span>
          {(['ALL', 'HADIR', 'TERLAMBAT', 'TIDAK HADIR'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-full font-extrabold whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                <th className="p-3 text-center w-12">No</th>
                <th className="p-3">Nama Anggota</th>
                <th className="p-3 text-center">Tanggal</th>
                <th className="p-3 text-center">Waktu</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center w-24">Foto</th>
                <th className="p-3 text-center w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    Belum ada data absensi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, idx) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{record.name}</td>
                    <td className="p-3 text-center font-mono text-slate-600">{record.date}</td>
                    <td className="p-3 text-center font-mono text-blue-900 font-extrabold">{record.time}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          record.status === 'HADIR'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : record.status === 'TERLAMBAT'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleViewPhoto(record)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-blue-700 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 border border-slate-200 transition-all"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span>Foto</span>
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`Hapus data absensi ${record.name}?`)) {
                            onDeleteRecord(record.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-all"
                        title="Hapus Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 max-w-sm w-full shadow-2xl space-y-4 text-center text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 text-left">{previewPhoto.record.name}</h3>
                <p className="text-[11px] text-slate-500 text-left">
                  {previewPhoto.record.date} jam {previewPhoto.record.time} WIB
                </p>
              </div>
              <button
                onClick={handleClosePhotoModal}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image display */}
            <div className="w-64 h-64 mx-auto rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
              <img
                src={previewPhoto.url}
                alt={`Foto Absensi ${previewPhoto.record.name}`}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="text-[11px] font-mono text-slate-500 break-all bg-slate-50 p-2 rounded-xl border border-slate-200">
              {previewPhoto.record.fileName}
            </div>

            <button
              onClick={handleClosePhotoModal}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-full text-xs"
            >
              Tutup Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
