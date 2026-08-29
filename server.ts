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

  // ==========================================
  // GITHUB AUTO-SYNC & PERSISTENCE API ENDPOINTS
  // ==========================================
  
  // 1. Get default GitHub config (from server env if available)
  app.get('/api/github/config', (req, res) => {
    res.json({
      hasEnvToken: Boolean(process.env.GITHUB_TOKEN),
      defaultOwner: process.env.GITHUB_REPO_OWNER || '',
      defaultRepo: process.env.GITHUB_REPO_NAME || '',
      defaultBranch: process.env.GITHUB_BRANCH || 'main',
    });
  });

  // 2. Test GitHub connection & repository permissions
  app.post('/api/github/test', async (req, res) => {
    try {
      const token = req.body.token || process.env.GITHUB_TOKEN;
      const owner = req.body.owner || process.env.GITHUB_REPO_OWNER;
      const repo = req.body.repo || process.env.GITHUB_REPO_NAME;
      const branch = req.body.branch || process.env.GITHUB_BRANCH || 'main';

      if (!token) {
        return res.status(400).json({ error: 'GitHub Personal Access Token (PAT) wajib diisi.' });
      }
      if (!owner || !repo) {
        return res.status(400).json({ error: 'Owner (Username/Org) dan Nama Repository GitHub wajib diisi.' });
      }

      // Check repository access
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'BintangRemaja-App',
        },
      });

      if (!repoRes.ok) {
        if (repoRes.status === 401) {
          return res.status(401).json({ error: 'Token GitHub tidak valid atau sudah kedaluwarsa. Periksa kembali token Anda.' });
        }
        if (repoRes.status === 404) {
          return res.status(404).json({ error: `Repository "${owner}/${repo}" tidak ditemukan atau token tidak memiliki izin akses ke repo ini.` });
        }
        const errText = await repoRes.text();
        return res.status(repoRes.status).json({ error: `Gagal mengakses repo (${repoRes.status}): ${errText}` });
      }

      const repoData = await repoRes.json();

      // Check branch
      const branchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/${branch}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'BintangRemaja-App',
        },
      });

      const branchExists = branchRes.ok;

      return res.json({
        success: true,
        fullName: repoData.full_name,
        isPrivate: repoData.private,
        defaultBranch: repoData.default_branch,
        targetBranch: branch,
        branchExists,
        permissions: repoData.permissions,
        htmlUrl: repoData.html_url,
      });
    } catch (error: any) {
      console.error('GitHub Test Error:', error);
      return res.status(500).json({ error: 'Terjadi kesalahan saat memeriksa GitHub: ' + error.message });
    }
  });

  // 3. Push / Auto-Commit files to GitHub Repository
  app.post('/api/github/sync', async (req, res) => {
    try {
      const token = req.body.token || process.env.GITHUB_TOKEN;
      const owner = req.body.owner || process.env.GITHUB_REPO_OWNER;
      const repo = req.body.repo || process.env.GITHUB_REPO_NAME;
      const branch = req.body.branch || process.env.GITHUB_BRANCH || 'main';
      const commitMessage = req.body.commitMessage || `Auto-sync data from Bintang Remaja App (${new Date().toLocaleString('id-ID')})`;
      const files: Array<{ path: string; content: string }> = req.body.files || [];

      if (!token) {
        return res.status(400).json({ error: 'GitHub Token tidak ditemukan. Silakan konfigurasi token terlebih dahulu.' });
      }
      if (!owner || !repo) {
        return res.status(400).json({ error: 'Owner dan Repository GitHub belum diatur.' });
      }
      if (files.length === 0) {
        return res.status(400).json({ error: 'Tidak ada data file yang akan disinkronkan ke GitHub.' });
      }

      const updatedFiles: Array<{ path: string; sha: string; commitUrl?: string }> = [];

      for (const file of files) {
        const filePath = file.path.replace(/^\//, ''); // Strip leading slash
        const rawContent = file.content;
        const base64Content = Buffer.from(rawContent, 'utf-8').toString('base64');

        // Step A: Check if file exists to obtain current SHA
        let existingSha: string | undefined;
        let existingContentBase64: string | undefined;

        try {
          const getFileRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'BintangRemaja-App',
              },
            }
          );

          if (getFileRes.ok) {
            const fileData = await getFileRes.json();
            existingSha = fileData.sha;
            existingContentBase64 = (fileData.content || '').replace(/\n/g, '');
          }
        } catch (err) {
          console.warn(`Could not check existing file ${filePath}:`, err);
        }

        // If content is completely unchanged, skip to avoid spamming identical commits
        if (existingContentBase64 && existingContentBase64 === base64Content) {
          updatedFiles.push({ path: filePath, sha: existingSha || 'unchanged' });
          continue;
        }

        // Step B: Put/Commit file
        const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'BintangRemaja-App',
          },
          body: JSON.stringify({
            message: `${commitMessage} [${filePath}]`,
            content: base64Content,
            sha: existingSha,
            branch: branch,
          }),
        });

        if (!putRes.ok) {
          const errText = await putRes.text();
          console.error(`Failed to commit file ${filePath}:`, errText);
          return res.status(putRes.status).json({
            error: `Gagal commit file ${filePath} ke GitHub (${putRes.status}): ${errText}`,
          });
        }

        const putData = await putRes.json();
        updatedFiles.push({
          path: filePath,
          sha: putData.content?.sha || putData.commit?.sha,
          commitUrl: putData.commit?.html_url,
        });
      }

      const latestCommitUrl = updatedFiles.find((f) => f.commitUrl)?.commitUrl || `https://github.com/${owner}/${repo}/commits/${branch}`;

      return res.json({
        success: true,
        message: 'Data aplikasi berhasil di-update dan di-commit otomatis ke GitHub!',
        repo: `${owner}/${repo}`,
        branch,
        updatedFiles,
        latestCommitUrl,
        syncedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('GitHub Sync Error:', error);
      return res.status(500).json({ error: 'Terjadi kesalahan saat menyinkronkan data ke GitHub: ' + error.message });
    }
  });

  // 4. Pull / Import data from GitHub repository
  app.post('/api/github/pull', async (req, res) => {
    try {
      const token = req.body.token || process.env.GITHUB_TOKEN;
      const owner = req.body.owner || process.env.GITHUB_REPO_OWNER;
      const repo = req.body.repo || process.env.GITHUB_REPO_NAME;
      const branch = req.body.branch || process.env.GITHUB_BRANCH || 'main';

      if (!token) {
        return res.status(400).json({ error: 'GitHub Token tidak ditemukan.' });
      }
      if (!owner || !repo) {
        return res.status(400).json({ error: 'Owner dan Repository GitHub belum diatur.' });
      }

      async function fetchRepoFile(filePath: string): Promise<any | null> {
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'BintangRemaja-App',
            },
          }
        );
        if (!response.ok) return null;
        const fileData = await response.json();
        if (!fileData.content) return null;
        const decoded = Buffer.from(fileData.content, 'base64').toString('utf-8');
        try {
          return JSON.parse(decoded);
        } catch {
          return decoded;
        }
      }

      // Try reading combined database or individual files
      const dbCombined = await fetchRepoFile('data/database.json');
      const members = (await fetchRepoFile('data/members.json')) || dbCombined?.members || null;
      const attendance = (await fetchRepoFile('data/attendance.json')) || dbCombined?.attendance || null;
      const announcements = (await fetchRepoFile('data/announcements.json')) || dbCombined?.announcements || null;
      const session = (await fetchRepoFile('data/session.json')) || dbCombined?.session || null;

      if (!members && !attendance && !announcements && !session && !dbCombined) {
        return res.status(404).json({
          error: `Tidak ditemukan file data JSON di repository "${owner}/${repo}" pada branch "${branch}" (misal: data/members.json atau data/database.json).`,
        });
      }

      return res.json({
        success: true,
        message: 'Data berhasil ditarik dari repository GitHub!',
        data: {
          members: members || [],
          attendance: attendance || [],
          announcements: announcements || [],
          session: session || null,
        },
        syncedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('GitHub Pull Error:', error);
      return res.status(500).json({ error: 'Gagal menarik data dari GitHub: ' + error.message });
    }
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
