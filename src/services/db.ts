import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Member, AttendanceRecord, AttendanceSession, EventAnnouncement } from '../types';

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
  announcements: {
    key: string;
    value: EventAnnouncement;
    indexes: { 'by-createdAt': number };
  };
}

const DB_NAME = 'BintangRemajaAbsensiDB';
const DB_VERSION = 2;

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

        // Announcements Store
        if (!db.objectStoreNames.contains('announcements')) {
          const annStore = db.createObjectStore('announcements', { keyPath: 'id' });
          annStore.createIndex('by-createdAt', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
}


// Initial seed data is kept empty so admin can input fresh members
export async function initSeedData(): Promise<void> {
  const db = await getDB();

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

  // Initialize seed announcements if empty
  const annCount = await db.count('announcements');
  if (annCount === 0) {
    const tx = db.transaction('announcements', 'readwrite');
    const defaultEvents: Omit<EventAnnouncement, 'id' | 'createdAt'>[] = [
      {
        title: 'Rapat Bulanan Karang Taruna & Evaluasi Program Kerja',
        description: 'Diharapkan seluruh anggota Karang Taruna Bintang Remaja menghadiri rapat rutin bulanan untuk membahas persiapan turnamen olahraga dan bakti sosial.',
        eventDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        eventTime: '19:30 WIB',
        location: 'Balai Desa RT 04 / Aula Pemuda',
        category: 'RAPAT',
        isActive: true,
      },
      {
        title: 'Kerja Bakti Masal Bersama Warga',
        description: 'Pembersihan lingkungan desa dan drainase persiapan musim hujan. Harap membawa perlengkapan masing-masing.',
        eventDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        eventTime: '07:00 WIB',
        location: 'Lapangan Utama Desa',
        category: 'KERJA_BAKTI',
        isActive: true,
      },
    ];

    for (const ev of defaultEvents) {
      await tx.store.add({
        ...ev,
        id: 'ann_' + Math.random().toString(36).substring(2, 9),
        createdAt: Date.now(),
      });
    }
    await tx.done;
  }
}

// ANNOUNCEMENTS & EVENT NOTICES MANAGEMENT
export async function getAllAnnouncements(): Promise<EventAnnouncement[]> {
  const db = await getDB();
  const announcements = await db.getAll('announcements');
  return announcements.sort((a, b) => b.createdAt - a.createdAt);
}

export async function addAnnouncement(ann: Omit<EventAnnouncement, 'id' | 'createdAt'>): Promise<EventAnnouncement> {
  const db = await getDB();
  const newAnn: EventAnnouncement = {
    ...ann,
    id: 'ann_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    createdAt: Date.now(),
  };
  await db.put('announcements', newAnn);
  return newAnn;
}

export async function updateAnnouncement(ann: EventAnnouncement): Promise<void> {
  const db = await getDB();
  await db.put('announcements', ann);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('announcements', id);
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

export async function clearAllMembersData(): Promise<void> {
  const db = await getDB();
  await db.clear('members');
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
