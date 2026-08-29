import { Member, AttendanceRecord, EventAnnouncement, AttendanceSession } from '../types';

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  autoSyncEnabled: boolean;
  lastSyncTime?: number;
  lastCommitSha?: string;
  lastCommitUrl?: string;
  lastStatus?: 'idle' | 'syncing' | 'success' | 'error';
  lastErrorMessage?: string;
}

export interface SyncPayload {
  members: Member[];
  records: AttendanceRecord[];
  announcements: EventAnnouncement[];
  session: AttendanceSession | null;
}

const STORAGE_KEY = 'bintang_remaja_github_config_v1';

// Default config
const DEFAULT_CONFIG: GitHubConfig = {
  token: '',
  owner: '',
  repo: '',
  branch: 'main',
  autoSyncEnabled: true,
  lastStatus: 'idle',
};

class GitHubSyncManager {
  private config: GitHubConfig = { ...DEFAULT_CONFIG };
  private listeners: Set<(config: GitHubConfig) => void> = new Set();
  private debounceTimer: any = null;
  private pendingPayload: SyncPayload | null = null;
  private pendingReason: string = '';

  constructor() {
    this.loadConfig();
    this.fetchServerDefaults();
  }

  // Load configuration from local storage
  public loadConfig(): GitHubConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load GitHub config from localStorage', e);
    }
    return this.config;
  }

  // Fetch optional server environment defaults if not set
  private async fetchServerDefaults() {
    try {
      const res = await fetch('/api/github/config');
      if (res.ok) {
        const data = await res.json();
        let changed = false;
        if (!this.config.owner && data.defaultOwner) {
          this.config.owner = data.defaultOwner;
          changed = true;
        }
        if (!this.config.repo && data.defaultRepo) {
          this.config.repo = data.defaultRepo;
          changed = true;
        }
        if (!this.config.branch && data.defaultBranch) {
          this.config.branch = data.defaultBranch;
          changed = true;
        }
        if (changed) {
          this.saveConfig(this.config);
        }
      }
    } catch {
      // benign
    }
  }

  // Save config
  public saveConfig(newConfig: Partial<GitHubConfig>) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to save GitHub config to localStorage', e);
    }
    this.notify();
  }

  public getConfig(): GitHubConfig {
    return { ...this.config };
  }

  public isConfigured(): boolean {
    return Boolean(this.config.token && this.config.owner && this.config.repo);
  }

  public subscribe(listener: (config: GitHubConfig) => void) {
    this.listeners.add(listener);
    listener(this.getConfig());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const current = this.getConfig();
    this.listeners.forEach((fn) => fn(current));
  }

  // Test Connection
  public async testConnection(override?: { token?: string; owner?: string; repo?: string; branch?: string }) {
    const token = override?.token ?? this.config.token;
    const owner = override?.owner ?? this.config.owner;
    const repo = override?.repo ?? this.config.repo;
    const branch = override?.branch ?? this.config.branch ?? 'main';

    const res = await fetch('/api/github/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, owner, repo, branch }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal terhubung ke repository GitHub.');
    }
    return data;
  }

  // Format data payload for GitHub Files
  private prepareFiles(payload: SyncPayload): Array<{ path: string; content: string }> {
    // 1. Members JSON (clean format)
    const membersClean = payload.members.map((m) => ({
      id: m.id,
      name: m.name,
      position: m.position || 'Anggota',
      memberNumber: m.memberNumber || '',
      avatarUrl: m.avatarUrl || '',
      faceLandmarks: m.faceLandmarks || [],
      isActive: m.isActive,
      createdAt: m.createdAt,
    }));

    // 2. Attendance Records JSON
    const recordsClean = payload.records.map((r) => ({
      id: r.id,
      memberId: r.memberId,
      name: r.name,
      position: r.position || '',
      date: r.date,
      time: r.time,
      status: r.status,
      fileName: r.fileName,
      timestamp: r.timestamp,
      photoUrl: typeof r.photoBlob === 'string' ? r.photoBlob : undefined,
    }));

    // 3. Announcements JSON
    const announcementsClean = payload.announcements.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      eventDate: a.eventDate,
      eventTime: a.eventTime || '',
      location: a.location || '',
      category: a.category,
      isActive: a.isActive,
      createdAt: a.createdAt,
    }));

    // 4. Combined Database Snapshot
    const databaseSnapshot = {
      appName: 'Karang Taruna Bintang Remaja - Sistem Absensi Biometrik',
      lastUpdated: new Date().toISOString(),
      session: payload.session,
      totalMembers: membersClean.length,
      totalRecords: recordsClean.length,
      totalAnnouncements: announcementsClean.length,
      members: membersClean,
      attendance: recordsClean,
      announcements: announcementsClean,
    };

    return [
      {
        path: 'data/members.json',
        content: JSON.stringify(membersClean, null, 2),
      },
      {
        path: 'data/attendance.json',
        content: JSON.stringify(recordsClean, null, 2),
      },
      {
        path: 'data/announcements.json',
        content: JSON.stringify(announcementsClean, null, 2),
      },
      {
        path: 'data/session.json',
        content: JSON.stringify(payload.session, null, 2),
      },
      {
        path: 'data/bintang_remaja_database.json',
        content: JSON.stringify(databaseSnapshot, null, 2),
      },
    ];
  }

  // Perform immediate push/sync to GitHub
  public async syncNow(payload: SyncPayload, reason: string = 'Update Data'): Promise<any> {
    if (!this.isConfigured()) {
      return { success: false, skipped: true, message: 'GitHub belum dikonfigurasi.' };
    }

    this.saveConfig({ lastStatus: 'syncing', lastErrorMessage: undefined });

    try {
      const files = this.prepareFiles(payload);
      const commitMessage = `Auto-sync Bintang Remaja: ${reason} (${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')})`;

      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: this.config.token,
          owner: this.config.owner,
          repo: this.config.repo,
          branch: this.config.branch || 'main',
          commitMessage,
          files,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan file ke GitHub.');
      }

      this.saveConfig({
        lastStatus: 'success',
        lastSyncTime: Date.now(),
        lastCommitUrl: data.latestCommitUrl,
        lastCommitSha: data.updatedFiles?.[0]?.sha?.substring(0, 7) || 'latest',
        lastErrorMessage: undefined,
      });

      return data;
    } catch (err: any) {
      console.error('GitHub Sync Error:', err);
      this.saveConfig({
        lastStatus: 'error',
        lastErrorMessage: err.message || 'Gagal sinkronisasi data ke GitHub.',
      });
      throw err;
    }
  }

  // Trigger Debounced Auto-sync (called automatically on any app data edit)
  public triggerAutoSync(payload: SyncPayload, reason: string = 'Edit Data') {
    if (!this.isConfigured() || !this.config.autoSyncEnabled) {
      return;
    }

    this.pendingPayload = payload;
    this.pendingReason = reason;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Debounce for 1.2 seconds so rapid typing or sequential operations merge into a single clean commit
    this.debounceTimer = setTimeout(async () => {
      if (this.pendingPayload) {
        const payloadToSync = this.pendingPayload;
        const reasonToSync = this.pendingReason;
        this.pendingPayload = null;
        try {
          await this.syncNow(payloadToSync, reasonToSync);
        } catch (e) {
          console.warn('Auto-sync execution error:', e);
        }
      }
    }, 1200);
  }

  // Pull / Import data from GitHub
  public async pullData(): Promise<{ members: Member[]; attendance: AttendanceRecord[]; announcements: EventAnnouncement[]; session: AttendanceSession | null }> {
    if (!this.isConfigured()) {
      throw new Error('GitHub belum dikonfigurasi.');
    }

    const res = await fetch('/api/github/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: this.config.token,
        owner: this.config.owner,
        repo: this.config.repo,
        branch: this.config.branch || 'main',
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Gagal menarik data dari GitHub.');
    }

    return result.data;
  }
}

export const githubService = new GitHubSyncManager();
