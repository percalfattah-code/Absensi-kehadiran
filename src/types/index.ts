export type AttendanceStatus = 'HADIR' | 'TERLAMBAT' | 'TIDAK HADIR';

export interface Member {
  id: string;
  name: string;
  memberNumber?: string;
  avatarUrl?: string;
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

export type ViewMode = 'absensi' | 'dashboard' | 'anggota' | 'rekap' | 'pengaturan';
