import { Member, AttendanceRecord } from '../types';

export interface GoogleSheetsSyncState {
  isConnected: boolean;
  accessToken: string | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  lastSyncedAt: string | null;
  userEmail?: string;
}

const STORAGE_KEY = 'bintang_google_sheets_config';

export function getStoredSheetsConfig(): GoogleSheetsSyncState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading google sheets config:', e);
  }
  return {
    isConnected: false,
    accessToken: null,
    spreadsheetId: null,
    spreadsheetUrl: null,
    lastSyncedAt: null,
  };
}

export function saveSheetsConfig(config: GoogleSheetsSyncState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving google sheets config:', e);
  }
}

export function clearSheetsConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Trigger Google OAuth Login Popup for Google Sheets Scopes
 */
export async function requestGoogleAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Library Google Identity Services belum siap. Silakan coba beberapa saat lagi.'));
      return;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: '339973094830-client.apps.googleusercontent.com', // Will work with standard OAuth token client or implicit flow
      scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
      callback: (tokenResponse: any) => {
        if (tokenResponse.error) {
          reject(new Error('Gagal menghubungkan Google: ' + tokenResponse.error));
        } else if (tokenResponse.access_token) {
          resolve(tokenResponse.access_token);
        } else {
          reject(new Error('Akses token tidak diterima.'));
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

/**
 * Sync Members and Attendance Data to Google Sheets via backend API
 */
export async function syncDataToGoogleSheets(
  accessToken: string,
  members: Member[],
  records: AttendanceRecord[],
  sessionTitle: string = 'Sesi Karang Taruna',
  existingSpreadsheetId: string | null = null
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; syncedAt: string }> {
  const response = await fetch('/api/sheets/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accessToken,
      members,
      records,
      sessionTitle,
      spreadsheetId: existingSpreadsheetId,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Gagal sinkronisasi data ke Google Sheets.');
  }

  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
    syncedAt: data.syncedAt,
  };
}
