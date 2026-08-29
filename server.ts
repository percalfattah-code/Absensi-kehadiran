import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Bintang Remaja Karang Taruna Backend' });
  });

  // Google Sheets Integration API Endpoint
  app.post('/api/sheets/sync', async (req, res) => {
    try {
      const { accessToken, members = [], records = [], sessionTitle = 'Sesi Rutin Karang Taruna', spreadsheetId: inputSpreadsheetId } = req.body;

      if (!accessToken) {
        return res.status(400).json({ error: 'Akses token Google Sheets tidak ditemukan. Silakan login terlebih dahulu.' });
      }

      let spreadsheetId = inputSpreadsheetId;
      let spreadsheetUrl = '';

      // 1. Create Spreadsheet if not existing
      if (!spreadsheetId) {
        const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              title: `Data Absensi Bintang Remaja - Karang Taruna (${new Date().toLocaleDateString('id-ID')})`,
            },
            sheets: [
              { properties: { title: 'Daftar Anggota' } },
              { properties: { title: 'Rekap Absensi' } },
            ],
          }),
        });

        if (!createRes.ok) {
          const errText = await createRes.text();
          console.error('Failed to create spreadsheet:', errText);
          return res.status(createRes.status).json({
            error: 'Gagal membuat Google Sheets baru. Pastikan izin akses Google Sheets diberikan.',
            details: errText,
          });
        }

        const createData = await createRes.json();
        spreadsheetId = createData.spreadsheetId;
        spreadsheetUrl = createData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
      } else {
        spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
      }

      // 2. Format Members Data
      const memberHeaders = ['ID Anggota', 'Nama Lengkap', 'Nomor Induk', 'Status Biometrik', 'Status Keanggotaan', 'Tanggal Input'];
      const memberRows = members.map((m: any) => [
        m.id,
        m.name,
        m.memberNumber || '-',
        m.avatarUrl ? 'Foto Biometrik Ada' : 'Belum Ada Foto',
        m.isActive ? 'Aktif' : 'Non-Aktif',
        m.createdAt ? new Date(m.createdAt).toLocaleDateString('id-ID') : '-',
      ]);

      const memberValues = [memberHeaders, ...memberRows];

      // 3. Format Attendance Records Data
      const recordHeaders = ['ID Rekap', 'Nama Anggota', 'Nomor Induk', 'Tanggal', 'Jam', 'Status', 'Metode Verifikasi', 'Catatan Sesi'];
      const recordRows = records.map((r: any) => [
        r.id,
        r.memberName,
        r.memberNumber || '-',
        r.date,
        r.time,
        r.status,
        r.verificationMethod || 'Biometrik Wajah',
        sessionTitle,
      ]);

      const recordValues = [recordHeaders, ...recordRows];

      // 4. Update "Daftar Anggota" Sheet
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Daftar Anggota!A1:F1000?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: memberValues }),
        }
      );

      // 5. Update "Rekap Absensi" Sheet
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Rekap Absensi!A1:H2000?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: recordValues }),
        }
      );

      return res.json({
        success: true,
        message: 'Data anggota & absensi berhasil disinkronkan ke Google Sheets!',
        spreadsheetId,
        spreadsheetUrl,
        syncedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Google Sheets Sync Error:', error);
      return res.status(500).json({ error: 'Terjadi kesalahan server saat menghubungkan Google Sheets: ' + error.message });
    }
  });

  // Vite Middleware for Development Mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Bintang Remaja running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
