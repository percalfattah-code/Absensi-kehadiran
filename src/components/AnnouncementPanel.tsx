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
  Send,
  Copy,
  MessageSquare,
  Volume2,
} from 'lucide-react';
import { EventAnnouncement, EventCategory, RoleMode } from '../types';
import { audioService } from '../services/audioService';

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
  const [broadcastModalAnn, setBroadcastModalAnn] = useState<EventAnnouncement | null>(null);
  const [broadcastSuccessMsg, setBroadcastSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    setEventTime(ann.eventTime || '19:30 WIB');
    setLocation(ann.location || 'Balai Karang Taruna');
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
      // Sound chime for creation
      audioService.playNotificationBell();
    }

    setIsModalOpen(false);
  };

  // Generate Official WhatsApp Broadcast Message Text
  const formatBroadcastText = (ann: EventAnnouncement) => {
    return (
      `📢 *PEMBERITAHUAN KEGIATAN KARANG TARUNA BINTANG REMAJA* 📢\n\n` +
      `📌 *Agenda:* ${ann.title}\n` +
      `🏷️ *Kategori:* ${ann.category.replace('_', ' ')}\n` +
      `📅 *Tanggal:* ${ann.eventDate}\n` +
      `⏰ *Waktu:* ${ann.eventTime || '19:30 WIB'}\n` +
      `📍 *Lokasi:* ${ann.location || 'Balai Karang Taruna'}\n\n` +
      `📝 *Keterangan:*\n${ann.description || 'Diharapkan kehadiran seluruh rekan Karang Taruna tepat waktu.'}\n\n` +
      `📱 *Silakan lakukan absensi biometrik wajah pada aplikasi saat kegiatan dimulai.*\n` +
      `Salam Pemuda, Semangat Karang Taruna! ✊🇮🇩`
    );
  };

  // Trigger Member Broadcast Action
  const handleBroadcastNotification = (ann: EventAnnouncement) => {
    audioService.playNotificationBell();

    // Store active broadcast in localStorage for instant member banner display
    const broadcastData = {
      id: ann.id,
      title: ann.title,
      eventDate: ann.eventDate,
      eventTime: ann.eventTime || '19:30 WIB',
      location: ann.location || 'Balai Warga',
      description: ann.description,
      broadcastedAt: Date.now(),
    };
    localStorage.setItem('bintang_remaja_active_broadcast', JSON.stringify(broadcastData));

    // Audio TTS confirmation
    audioService.speakIndonesian(`Pemberitahuan agenda ${ann.title} telah berhasil disiarkan kepada seluruh anggota.`);

    setBroadcastModalAnn(ann);
    setBroadcastSuccessMsg(`Pemberitahuan untuk "${ann.title}" telah aktif dan disiarkan ke seluruh anggota!`);
    setTimeout(() => setBroadcastSuccessMsg(null), 5000);
  };

  // Share via WhatsApp Web / App
  const handleShareWhatsApp = (ann: EventAnnouncement) => {
    const text = encodeURIComponent(formatBroadcastText(ann));
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Copy Broadcast Text to Clipboard
  const handleCopyText = (ann: EventAnnouncement) => {
    const text = formatBroadcastText(ann);
    navigator.clipboard.writeText(text);
    setCopiedId(ann.id);
    audioService.playNotificationBell();
    setTimeout(() => setCopiedId(null), 3000);
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
            className="px-5 py-3.5 btn-3d-amber text-purple-950 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Buat Agenda Baru</span>
          </button>
        )}
      </div>

      {/* Broadcast Success Alert Banner */}
      {broadcastSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border-2 border-emerald-400 text-emerald-200 text-xs flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-bold">{broadcastSuccessMsg}</span>
          </div>
          <button onClick={() => setBroadcastSuccessMsg(null)} className="text-emerald-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3D FILTER CHIPS */}
      <div className="card-3d-subtle p-3 flex items-center gap-2 overflow-x-auto">
        {(['ALL', 'RAPAT', 'KERJA_BAKTI', 'ACARA_SOSIAL', 'OLAHRAGA', 'INFO'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 ${
              selectedCategory === cat
                ? 'btn-3d-violet text-amber-300'
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

              <div className="pt-3 border-t border-violet-800/60 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-violet-300">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{ann.eventTime || '19:30 WIB'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span className="truncate max-w-[150px]">{ann.location || 'Balai Karang Taruna'}</span>
                  </div>
                </div>

                {/* Broadcast & Admin Action Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-violet-800/40">
                  {/* Broadcast Trigger Button (Available for Admin) */}
                  {roleMode === 'ADMIN' ? (
                    <button
                      onClick={() => handleBroadcastNotification(ann)}
                      className="px-3 py-1.5 btn-3d-amber text-purple-950 rounded-xl text-[11px] font-black flex items-center gap-1.5 shadow-md"
                      title="Kirim pemberitahuan agenda ini ke seluruh anggota"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim ke Anggota</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Agenda Resmi Pengurus
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    {/* Share to WhatsApp Button */}
                    <button
                      onClick={() => handleShareWhatsApp(ann)}
                      className="p-1.5 rounded-xl bg-emerald-950 border border-emerald-600/60 text-emerald-300 hover:bg-emerald-900 transition-all"
                      title="Kirim ke Grup WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>

                    {/* Copy Text Button */}
                    <button
                      onClick={() => handleCopyText(ann)}
                      className="p-1.5 rounded-xl bg-violet-950 border border-violet-700/60 text-amber-300 hover:bg-violet-900 transition-all"
                      title="Salin Teks Broadcast"
                    >
                      {copiedId === ann.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {roleMode === 'ADMIN' && (
                      <>
                        <button
                          onClick={() => openEditModal(ann)}
                          className="px-2.5 py-1 btn-3d-dark text-violet-200 rounded-xl text-[11px] font-bold flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3 text-violet-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus agenda "${ann.title}"?`)) {
                              onDeleteAnnouncement(ann.id);
                            }
                          }}
                          className="p-1.5 btn-3d-rose text-white rounded-xl text-[11px] font-bold"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
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
                {editingAnn ? 'Edit Agenda / Pengumuman' : 'Tambah Agenda Baru'}
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
                  placeholder="Contoh: Rapat Pleno Karang Taruna"
                  className="w-full bg-[#110526] text-white p-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-violet-300 font-bold mb-1">Deskripsi / Detail Agenda</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Penjelasan ringkas mengenai agenda, susunan acara, atau pakaian..."
                  className="w-full bg-[#110526] text-white p-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-violet-300 font-bold mb-1">Tanggal Kegiatan *</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-[#110526] text-white p-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-violet-300 font-bold mb-1">Waktu / Jam</label>
                  <input
                    type="text"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    placeholder="Contoh: 19:30 WIB"
                    className="w-full bg-[#110526] text-white p-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400 font-bold"
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
                    placeholder="Contoh: Balai Warga RT 04"
                    className="w-full bg-[#110526] text-white p-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400"
                  />
                </div>

                <div>
                  <label className="block text-violet-300 font-bold mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventCategory)}
                    className="w-full bg-[#110526] text-white p-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400 font-bold"
                  >
                    <option value="RAPAT">RAPAT</option>
                    <option value="KERJA_BAKTI">KERJA BAKTI</option>
                    <option value="ACARA_SOSIAL">ACARA SOSIAL</option>
                    <option value="OLAHRAGA">OLAHRAGA</option>
                    <option value="INFO">INFO / PENGUMUMAN</option>
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
                  Simpan & Siapkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Quick Action Dialog */}
      {broadcastModalAnn && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-3d p-6 max-w-md w-full space-y-4 text-white text-xs">
            <div className="flex items-center justify-between border-b border-violet-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black">Siarkan Agenda ke Anggota</h3>
              </div>
              <button
                onClick={() => setBroadcastModalAnn(null)}
                className="p-1.5 rounded-xl bg-violet-950 text-violet-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 bg-[#120526] p-4 rounded-xl border border-violet-700/60">
              <div className="text-amber-300 font-black text-sm">{broadcastModalAnn.title}</div>
              <div className="text-violet-300 text-[11px]">
                📅 {broadcastModalAnn.eventDate} • ⏰ {broadcastModalAnn.eventTime || '19:30 WIB'} • 📍 {broadcastModalAnn.location || 'Balai Karang Taruna'}
              </div>
              <p className="text-violet-200/80 text-xs mt-1">{broadcastModalAnn.description}</p>
            </div>

            <div className="text-[11px] text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Notifikasi pop-up & banner telah dikirim ke seluruh sesi anggota yang aktif.</span>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleShareWhatsApp(broadcastModalAnn)}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center justify-center gap-2 shadow-lg"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Kirim ke Grup WhatsApp Anggota</span>
              </button>

              <button
                onClick={() => handleCopyText(broadcastModalAnn)}
                className="w-full py-2.5 btn-3d-violet text-amber-300 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedId === broadcastModalAnn.id ? 'Teks Berhasil Disalin!' : 'Salin Format Teks Pengumuman'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
