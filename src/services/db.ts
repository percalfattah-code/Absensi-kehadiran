import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Member, AttendanceRecord, AttendanceSession } from '../types';

interface BintangRemajaDB extends DBSchema {
  members: {
    key: string;
    value: Member;
    indexes: { 'by-name': string };
  };
  attendance: {
    key: string;
    value: AttendanceRecord;
    indexes: { 'by-memberId': string; 'by-date': string; 'by-timestamp': number };
  };
  sessions: {
    key: string;
    value: AttendanceSession;
  };
}

const DB_NAME = 'BintangRemajaAbsensiDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<BintangRemajaDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<BintangRemajaDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BintangRemajaDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Members Store
        if (!db.objectStoreNames.contains('members')) {
          const memberStore = db.createObjectStore('members', { keyPath: 'id' });
          memberStore.createIndex('by-name', 'name');
        }

        // Attendance Store
        if (!db.objectStoreNames.contains('attendance')) {
          const attStore = db.createObjectStore('attendance', { keyPath: 'id' });
          attStore.createIndex('by-memberId', 'memberId');
          attStore.createIndex('by-date', 'date');
          attStore.createIndex('by-timestamp', 'timestamp');
        }

        // Sessions Store
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// Initial default seed members
const INITIAL_MEMBERS: Omit<Member, 'id' | 'createdAt'>[] = [
  { name: 'Ahmad Fauzan', memberNumber: 'BR-001', isActive: true },
  { name: 'Budi Santoso', memberNumber: 'BR-002', isActive: true },
  { name: 'Candra Wijaya', memberNumber: 'BR-003', isActive: true },
  { name: 'Dina Rosiana', memberNumber: 'BR-004', isActive: true },
  { name: 'Eko Prasetyo', memberNumber: 'BR-005', isActive: true },
  { name: 'Fitri Handayani', memberNumber: 'BR-006', isActive: true },
  { name: 'Gilang Ramadhan', memberNumber: 'BR-007', isActive: true },
  { name: 'Hani Saputri', memberNumber: 'BR-008', isActive: true },
  { name: 'Indra Kusuma', memberNumber: 'BR-009', isActive: true },
  { name: 'Julia Putri', memberNumber: 'BR-010', isActive: true },
  { name: 'Kiki Pratama', memberNumber: 'BR-011', isActive: true },
  { name: 'Larasati', memberNumber: 'BR-012', isActive: true },
  { name: 'Muhammad Rizky', memberNumber: 'BR-013', isActive: true },
  { name: 'Nurul Hidayah', memberNumber: 'BR-014', isActive: true },
  { name: 'Oktavianus', memberNumber: 'BR-015', isActive: true },
  { name: 'Putu Ayu', memberNumber: 'BR-016', isActive: true },
  { name: 'Qori Rahmawati', memberNumber: 'BR-017', isActive: true },
  { name: 'Rian Hidayat', memberNumber: 'BR-018', isActive: true },
  { name: 'Siska Amelia', memberNumber: 'BR-019', isActive: true },
  { name: 'Taufik Hidayat', memberNumber: 'BR-020', isActive: true },
];

export async function initSeedData(): Promise<void> {
  const db = await getDB();
  const count = await db.count('members');
  if (count === 0) {
    const tx = db.transaction('members', 'readwrite');
    for (const m of INITIAL_MEMBERS) {
      await tx.store.add({
        ...m,
        id: 'mem_' + Math.random().toString(36).substring(2, 9),
        createdAt: Date.now(),
      });
    }
    await tx.done;
  }

  // Initialize active session if none
  const session = await db.get('sessions', 'active_session');
  if (!session) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    await db.put('sessions', {
      id: 'active_session',
      sessionDate: dateStr,
      startTime: '18:00',
      endTime: '22:00',
      lateThreshold: '19:15',
      isOpen: true,
      autoPdfGenerated: false,
    });
  }
}

// MEMBER MANAGEMENT
export async function getAllMembers(): Promise<Member[]> {
  const db = await getDB();
  const members = await db.getAll('members');
  return members.sort((a, b) => a.name.localeCompare(b.name));
}

export async function addMember(member: Omit<Member, 'id' | 'createdAt'>): Promise<Member> {
  const db = await getDB();
  const newMember: Member = {
    ...member,
    id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    createdAt: Date.now(),
  };
  await db.put('members', newMember);
  return newMember;
}

export async function updateMember(member: Member): Promise<void> {
  const db = await getDB();
  await db.put('members', member);
}

export async function deleteMember(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('members', id);
}

// ATTENDANCE RECORDS
export async function getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
  const db = await getDB();
  const records = await db.getAll('attendance');
  return records.sort((a, b) => b.timestamp - a.timestamp);
}

export async function getAttendanceByMemberAndDate(memberId: string, dateStr: string): Promise<AttendanceRecord | undefined> {
  const db = await getDB();
  const records = await db.getAllFromIndex('attendance', 'by-memberId', memberId);
  return records.find((r) => r.date === dateStr);
}

export async function saveAttendanceRecord(record: AttendanceRecord): Promise<void> {
  const db = await getDB();
  await db.put('attendance', record);
}

export async function deleteAttendanceRecord(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('attendance', id);
}

export async function clearAllAttendanceData(): Promise<void> {
  const db = await getDB();
  await db.clear('attendance');
}

// SESSION MANAGEMENT
export async function getActiveSession(): Promise<AttendanceSession> {
  const db = await getDB();
  let session = await db.get('sessions', 'active_session');
  if (!session) {
    const now = new Date();
    session = {
      id: 'active_session',
      sessionDate: now.toISOString().split('T')[0],
      startTime: '18:00',
      endTime: '22:00',
      lateThreshold: '19:15',
      isOpen: true,
      autoPdfGenerated: false,
    };
    await db.put('sessions', session);
  }
  return session;
}

export async function updateActiveSession(session: AttendanceSession): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}
