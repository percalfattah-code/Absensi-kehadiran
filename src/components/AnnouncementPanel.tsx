import React, { useState } from 'react';
import {
  Bell,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Megaphone,
  Tag,
  Users,
  AlertCircle,
  X,
  Share2,
  Sparkles,
} from 'lucide-react';
import { EventAnnouncement, EventCategory, RoleMode } from '../types';

interface AnnouncementPanelProps {
  announcements: EventAnnouncement[];
  roleMode: RoleMode;
  onAddAnnouncement: (ann: Omit<EventAnnouncement, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateAnnouncement: (ann: EventAnnouncement) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
}

export const AnnouncementPanel: React.FC<AnnouncementPanelProps> = ({
  announcements,
  roleMode,
  onAddAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<EventAnnouncement | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<EventCategory>('RAPAT');
  const [isActive, setIsActive] = useState(true);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const openCreateModal = () => {
    setEditingAnn(null);
    setTitle('');
    setDescription('');
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    setEventDate(tomorrow);
    setEventTime('19:30 WIB');
    setLocation('Balai Warga Karang Taruna');
    setCategory('RAPAT');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (ann: EventAnnouncement) => {
    setEditingAnn(ann);
    setTitle(ann.title);
    setDescription(ann.description);
    setEventDate(ann.eventDate);
    setEventTime(ann.eventTime);
    setLocation(ann.location);
    setCategory(ann.category);
    setIsActive(ann.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;

    if (editingAnn) {
      await onUpdateAnnouncement({
        ...editingAnn,
        title: title.trim(),
        description: description.trim(),
        eventDate,
        eventTime,
        location,
        category,
        isActive,
      });
    } else {
      await onAddAnnouncement({
        title: title.trim(),
        description: description.trim(),
        eventDate,
        eventTime,
        location,
        category,
        isActive,
      });
    }

    setIsModalOpen(false);
  };

  const filteredAnnouncements = announcements.filter((ann) => {
    if (selectedCategory === 'ALL') return true;
    return ann.category === selectedCategory;
  });

  return (
    <div className="space-y-6 pb-24">
      {/* 3D HERO HEADER */}
      <div className="card-3d p-6 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-violet-300 to-transparent" />

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-violet-950 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase tracking-wider mb-1">
            <Megaphone className="w-3.5 h-3.5" />
            <span>AGENDA & PENGUMUMAN</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">Pemberitahuan Kegiatan</h2>
          <p className="text-xs text-violet-200/80 mt-1">
            Jadwal rapat, bakti sosial, olahraga, dan agenda Karang Taruna.
          </p>
        </div>

        {roleMode === 'ADMIN' && (
          <button
            onClick={openCreateModal}
            className="px-5 py-3.5 btn-3d-amber text-purple-950 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Buat Agenda Baru</span>
          </button>
        )}
      </div>

      {/* 3D FILTER CHIPS */}
      <div className="card-3d-subtle p-3 flex items-center gap-2 overflow-x-auto">
        {(['ALL', 'RAPAT', 'KERJA_BAKTI', 'EVENT', 'OLAHRAGA', 'PENGUMUMAN'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 ${
              selectedCategory === cat
                ? 'btn-3d-violet text-white'
                : 'btn-3d-dark text-violet-300'
            }`}
          >
            {cat === 'ALL' ? 'Semua Kategori' : cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* 3D ANNOUNCEMENT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="col-span-full card-3d p-8 text-center text-xs text-violet-400">
            Belum ada agenda atau pengumuman dalam kategori ini.
          </div>
        ) : (
          filteredAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className="card-3d-subtle p-5 flex flex-col justify-between space-y-4 text-white hover:border-violet-400/60 transition-all text-xs"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide bg-violet-900/80 text-amber-300 border border-violet-700">
                    {ann.category.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-violet-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-violet-400" />
                    {ann.eventDate}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-white leading-snug">{ann.title}</h3>
                <p className="text-xs text-violet-200/70 leading-relaxed">{ann.description}</p>
              </div>

              <div className="pt-3 border-t border-violet-800/60 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-violet-300">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{ann.eventTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span className="truncate max-w-[150px]">{ann.location}</span>
                  </div>
                </div>

                {roleMode === 'ADMIN' && (
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => openEditModal(ann)}
                      className="px-3 py-1 btn-3d-dark text-violet-200 rounded-lg text-[11px] font-bold flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3 text-violet-400" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus pengumuman "${ann.title}"?`)) {
                          onDeleteAnnouncement(ann.id);
                        }
                      }}
                      className="px-3 py-1 btn-3d-rose text-white rounded-lg text-[11px] font-bold"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3D MODAL CREATE/EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-3d p-6 max-w-lg w-full space-y-4 text-white text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-violet-800/80 pb-3">
              <h3 className="text-base font-black">
                {editingAnn ? 'Edit Pengumuman' : 'Tambah Pengumuman Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-violet-950 text-violet-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-violet-300 font-bold mb-1">Judul Kegiatan *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Rapat Koordinasi Agustusan"
                  className="w-full bg-[#110526] text-white p-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label className="block text-violet-300 font-bold mb-1">Deskripsi / Detail</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Penjelasan ringkas mengenai agenda ini..."
                  className="w-full bg-[#110526] text-white p-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-violet-300 font-bold mb-1">Tanggal Kegiatan</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-[#110526] text-white p-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400"
                  />
                </div>

                <div>
                  <label className="block text-violet-300 font-bold mb-1">Waktu / Jam</label>
                  <input
                    type="text"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    placeholder="Contoh: 19:30 WIB"
                    className="w-full bg-[#110526] text-white p-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-violet-300 font-bold mb-1">Lokasi</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Contoh: Balai Desa"
                    className="w-full bg-[#110526] text-white p-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400"
                  />
                </div>

                <div>
                  <label className="block text-violet-300 font-bold mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventCategory)}
                    className="w-full bg-[#110526] text-white p-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400"
                  >
                    <option value="RAPAT">RAPAT</option>
                    <option value="KERJA_BAKTI">KERJA BAKTI</option>
                    <option value="EVENT">EVENT</option>
                    <option value="OLAHRAGA">OLAHRAGA</option>
                    <option value="PENGUMUMAN">PENGUMUMAN</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-3 btn-3d-dark text-violet-300 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 btn-3d-amber text-purple-950 font-black rounded-xl uppercase tracking-wider"
                >
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
