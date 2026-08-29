export type AttendanceStatus = 'HADIR' | 'TERLAMBAT' | 'TIDAK HADIR';

export interface Member {
  id: string;
  name: string;
  memberNumber?: string;
  avatarUrl?: string; // Data URL or Blob URL of reference face photo
  faceLandmarks?: number[]; // Feature vector array extracted from reference photo
  isActive: boolean;
  createdAt: number;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  name: string;
  date: string; // DD/MM/YYYY
  time: string; // HH:MM:SS
  status: AttendanceStatus;
  photoBlob: Blob | string; // Stored as Blob or base64 DataURL
  fileName: string; // ABSENSI_NAME_DD-MM-YYYY_HH-MM-SS.jpg
  timestamp: number; // Unix Epoch ms
}

export interface AttendanceSession {
  id: string;
  sessionDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  lateThreshold: string; // HH:mm
  isOpen: boolean;
  adminPin?: string; // Default '1234' for Admin Panel access
  autoPdfGenerated?: boolean;
}

export type LivenessTask = 'LOOK_CAMERA' | 'SMILE' | 'BLINK';

export interface VerificationProgress {
  faceDetected: boolean;
  singleFace: boolean;
  smileDetected: boolean;
  blinkDetected: boolean;
  completed: boolean;
}

export type ViewMode = 'absensi' | 'dashboard' | 'anggota' | 'rekap' | 'pengumuman' | 'pengaturan';
export type RoleMode = 'MEMBER' | 'ADMIN';

export type EventCategory = 'RAPAT' | 'KERJA_BAKTI' | 'ACARA_SOSIAL' | 'OLAHRAGA' | 'INFO';

export interface EventAnnouncement {
  id: string;
  title: string;
  description: string;
  eventDate: string; // e.g. YYYY-MM-DD
  eventTime?: string; // e.g. 19:00 WIB
  location?: string; // e.g. Balai Desa RT 04
  category: EventCategory;
  isActive: boolean;
  createdAt: number;
}

