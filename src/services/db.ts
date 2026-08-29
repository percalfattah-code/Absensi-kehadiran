import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import { firestoreDb } from './firebase';
import { Member, AttendanceRecord, AttendanceSession, EventAnnouncement } from '../types';

// ==========================================
// INDEXED DB SCHEMA (LOCAL RESILIENT CACHE)
// ==========================================
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
        if (!db.objectStoreNames.contains('members')) {
          const memberStore = db.createObjectStore('members', { keyPath: 'id' });
          memberStore.createIndex('by-name', 'name');
        }
        if (!db.objectStoreNames.contains('attendance')) {
          const attStore = db.createObjectStore('attendance', { keyPath: 'id' });
          attStore.createIndex('by-memberId', 'memberId');
          attStore.createIndex('by-date', 'date');
          attStore.createIndex('by-timestamp', 'timestamp');
        }
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('announcements')) {
          const annStore = db.createObjectStore('announcements', { keyPath: 'id' });
          annStore.createIndex('by-createdAt', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
}

// Enable offline persistence in Firestore if available in browser
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(firestoreDb).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence is not supported by this browser');
    }
  });
}

// ==========================================
// FIRESTORE COLLECTIONS & DOC REFS
// ==========================================
const MEMBERS_COLLECTION = 'members';
const ATTENDANCE_COLLECTION = 'attendance_records';
const ANNOUNCEMENTS_COLLECTION = 'announcements';
const SESSION_COLLECTION = 'session_config';
const ACTIVE_SESSION_DOC_ID = 'active_session';

// ==========================================
// REAL-TIME FIRESTORE SUBSCRIPTIONS
// (Auto-syncs across any phone/device instantly)
// ==========================================

export function subscribeMembers(onUpdate: (members: Member[]) => void): () => void {
  const q = collection(firestoreDb, MEMBERS_COLLECTION);
  return onSnapshot(
    q,
    async (snapshot) => {
      const members: Member[] = [];
      const idb = await getDB();
      const tx = idb.transaction('members', 'readwrite');
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Member;
        members.push({ ...data, id: docSnap.id });
      });

      // Sort alphabetically
      members.sort((a, b) => a.name.localeCompare(b.name));

      // Cache to IndexedDB for offline resilience
      try {
        await tx.store.clear();
        for (const m of members) {
          await tx.store.put(m);
        }
        await tx.done;
      } catch (e) {
        console.warn('IDB cache update error:', e);
      }

      onUpdate(members);
    },
    (err) => {
      console.error('Firestore Members Subscription Error:', err);
    }
  );
}

export function subscribeAttendanceRecords(onUpdate: (records: AttendanceRecord[]) => void): () => void {
  const q = collection(firestoreDb, ATTENDANCE_COLLECTION);
  return onSnapshot(
    q,
    async (snapshot) => {
      const records: AttendanceRecord[] = [];
      const idb = await getDB();
      const tx = idb.transaction('attendance', 'readwrite');

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as AttendanceRecord;
        records.push({ ...data, id: docSnap.id });
      });

      // Sort latest first
      records.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      try {
        await tx.store.clear();
        for (const r of records) {
          await tx.store.put(r);
        }
        await tx.done;
      } catch (e) {
        console.warn('IDB attendance cache update error:', e);
      }

      onUpdate(records);
    },
    (err) => {
      console.error('Firestore Attendance Subscription Error:', err);
    }
  );
}

export function subscribeAnnouncements(onUpdate: (announcements: EventAnnouncement[]) => void): () => void {
  const q = collection(firestoreDb, ANNOUNCEMENTS_COLLECTION);
  return onSnapshot(
    q,
    async (snapshot) => {
      const annList: EventAnnouncement[] = [];
      const idb = await getDB();
      const tx = idb.transaction('announcements', 'readwrite');

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as EventAnnouncement;
        annList.push({ ...data, id: docSnap.id });
      });

      annList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      try {
        await tx.store.clear();
        for (const a of annList) {
          await tx.store.put(a);
        }
        await tx.done;
      } catch (e) {
        console.warn('IDB announcements cache update error:', e);
      }

      onUpdate(annList);
    },
    (err) => {
      console.error('Firestore Announcements Subscription Error:', err);
    }
  );
}

export function subscribeActiveSession(onUpdate: (session: AttendanceSession) => void): () => void {
  const sessionDocRef = doc(firestoreDb, SESSION_COLLECTION, ACTIVE_SESSION_DOC_ID);
  return onSnapshot(
    sessionDocRef,
    async (docSnap) => {
      if (docSnap.exists()) {
        const session = docSnap.data() as AttendanceSession;
        const idb = await getDB();
        await idb.put('sessions', session);
        onUpdate(session);
      }
    },
    (err) => {
      console.error('Firestore Session Subscription Error:', err);
    }
  );
}

// ==========================================
// INITIAL SEED & CLOUD MIGRATION
// ==========================================

export async function initSeedData(): Promise<void> {
  const idb = await getDB();

  try {
    // 1. Initialize Active Session in Firestore if none
    const sessionDocRef = doc(firestoreDb, SESSION_COLLECTION, ACTIVE_SESSION_DOC_ID);
    const sessionSnap = await getDoc(sessionDocRef);

    if (!sessionSnap.exists()) {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const initialSession: AttendanceSession = {
        id: ACTIVE_SESSION_DOC_ID,
        sessionDate: dateStr,
        startTime: '18:00',
        endTime: '22:00',
        lateThreshold: '19:15',
        isOpen: true,
        autoPdfGenerated: false,
      };
      await setDoc(sessionDocRef, initialSession);
      await idb.put('sessions', initialSession);
    } else {
      await idb.put('sessions', sessionSnap.data() as AttendanceSession);
    }

    // 2. Initialize Seed Announcements if empty
    const annSnap = await getDocs(collection(firestoreDb, ANNOUNCEMENTS_COLLECTION));
    if (annSnap.empty) {
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
        const annId = 'ann_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const newAnn: EventAnnouncement = {
          ...ev,
          id: annId,
          createdAt: Date.now(),
        };
        await setDoc(doc(firestoreDb, ANNOUNCEMENTS_COLLECTION, annId), newAnn);
      }
    }

    // 3. Migrate any legacy local members into Firestore if Firestore is empty
    const membersSnap = await getDocs(collection(firestoreDb, MEMBERS_COLLECTION));
    if (membersSnap.empty) {
      const localMembers = await idb.getAll('members');
      if (localMembers.length > 0) {
        const batch = writeBatch(firestoreDb);
        for (const m of localMembers) {
          const ref = doc(firestoreDb, MEMBERS_COLLECTION, m.id);
          batch.set(ref, m);
        }
        await batch.commit();
        console.log(`Migrated ${localMembers.length} local members to Firestore Cloud.`);
      }
    }
  } catch (err) {
    console.error('Firestore init error, falling back to local cache:', err);
  }
}

// ==========================================
// MEMBER CRUD (FIRESTORE CLOUD)
// ==========================================

export async function getAllMembers(): Promise<Member[]> {
  try {
    const snap = await getDocs(collection(firestoreDb, MEMBERS_COLLECTION));
    const members: Member[] = [];
    snap.forEach((d) => members.push({ ...(d.data() as Member), id: d.id }));
    members.sort((a, b) => a.name.localeCompare(b.name));
    return members;
  } catch (e) {
    console.warn('Falling back to local IDB for members:', e);
    const idb = await getDB();
    const members = await idb.getAll('members');
    return members.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export async function addMember(member: Omit<Member, 'id' | 'createdAt'>): Promise<Member> {
  const id = 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const newMember: Member = {
    ...member,
    id,
    createdAt: Date.now(),
  };

  // 1. Write to Firestore Cloud (instantly propagates to all other phones)
  await setDoc(doc(firestoreDb, MEMBERS_COLLECTION, id), newMember);

  // 2. Local Cache
  const idb = await getDB();
  await idb.put('members', newMember);

  return newMember;
}

export async function updateMember(member: Member): Promise<void> {
  await setDoc(doc(firestoreDb, MEMBERS_COLLECTION, member.id), member);
  const idb = await getDB();
  await idb.put('members', member);
}

export async function deleteMember(id: string): Promise<void> {
  await deleteDoc(doc(firestoreDb, MEMBERS_COLLECTION, id));
  const idb = await getDB();
  await idb.delete('members', id);
}

export async function clearAllMembersData(): Promise<void> {
  const snap = await getDocs(collection(firestoreDb, MEMBERS_COLLECTION));
  const batch = writeBatch(firestoreDb);
  snap.forEach((d) => batch.delete(d.ref));
  await batch.commit();

  const idb = await getDB();
  await idb.clear('members');
}

// ==========================================
// ATTENDANCE RECORDS (FIRESTORE CLOUD)
// ==========================================

export async function getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
  try {
    const snap = await getDocs(collection(firestoreDb, ATTENDANCE_COLLECTION));
    const records: AttendanceRecord[] = [];
    snap.forEach((d) => records.push({ ...(d.data() as AttendanceRecord), id: d.id }));
    records.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return records;
  } catch (e) {
    console.warn('Falling back to local IDB for attendance:', e);
    const idb = await getDB();
    const records = await idb.getAll('attendance');
    return records.sort((a, b) => b.timestamp - a.timestamp);
  }
}

export async function getAttendanceByMemberAndDate(memberId: string, dateStr: string): Promise<AttendanceRecord | undefined> {
  const all = await getAllAttendanceRecords();
  return all.find((r) => r.memberId === memberId && r.date === dateStr);
}

export async function saveAttendanceRecord(record: AttendanceRecord): Promise<void> {
  // 1. Write to Firestore Cloud (broadcast to all devices)
  await setDoc(doc(firestoreDb, ATTENDANCE_COLLECTION, record.id), record);

  // 2. Local cache
  const idb = await getDB();
  await idb.put('attendance', record);
}

export async function deleteAttendanceRecord(id: string): Promise<void> {
  await deleteDoc(doc(firestoreDb, ATTENDANCE_COLLECTION, id));
  const idb = await getDB();
  await idb.delete('attendance', id);
}

export async function clearAllAttendanceData(): Promise<void> {
  const snap = await getDocs(collection(firestoreDb, ATTENDANCE_COLLECTION));
  const batch = writeBatch(firestoreDb);
  snap.forEach((d) => batch.delete(d.ref));
  await batch.commit();

  const idb = await getDB();
  await idb.clear('attendance');
}

// ==========================================
// ANNOUNCEMENTS (FIRESTORE CLOUD)
// ==========================================

export async function getAllAnnouncements(): Promise<EventAnnouncement[]> {
  try {
    const snap = await getDocs(collection(firestoreDb, ANNOUNCEMENTS_COLLECTION));
    const list: EventAnnouncement[] = [];
    snap.forEach((d) => list.push({ ...(d.data() as EventAnnouncement), id: d.id }));
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return list;
  } catch (e) {
    const idb = await getDB();
    const announcements = await idb.getAll('announcements');
    return announcements.sort((a, b) => b.createdAt - a.createdAt);
  }
}

export async function addAnnouncement(ann: Omit<EventAnnouncement, 'id' | 'createdAt'>): Promise<EventAnnouncement> {
  const id = 'ann_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const newAnn: EventAnnouncement = {
    ...ann,
    id,
    createdAt: Date.now(),
  };
  await setDoc(doc(firestoreDb, ANNOUNCEMENTS_COLLECTION, id), newAnn);
  const idb = await getDB();
  await idb.put('announcements', newAnn);
  return newAnn;
}

export async function updateAnnouncement(ann: EventAnnouncement): Promise<void> {
  await setDoc(doc(firestoreDb, ANNOUNCEMENTS_COLLECTION, ann.id), ann);
  const idb = await getDB();
  await idb.put('announcements', ann);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await deleteDoc(doc(firestoreDb, ANNOUNCEMENTS_COLLECTION, id));
  const idb = await getDB();
  await idb.delete('announcements', id);
}

// ==========================================
// SESSION MANAGEMENT (FIRESTORE CLOUD)
// ==========================================

export async function getActiveSession(): Promise<AttendanceSession> {
  try {
    const sessionDocRef = doc(firestoreDb, SESSION_COLLECTION, ACTIVE_SESSION_DOC_ID);
    const snap = await getDoc(sessionDocRef);
    if (snap.exists()) {
      return snap.data() as AttendanceSession;
    }
  } catch (e) {
    console.warn('Falling back to local IDB for active session:', e);
  }

  const idb = await getDB();
  let session = await idb.get('sessions', ACTIVE_SESSION_DOC_ID);
  if (!session) {
    const now = new Date();
    session = {
      id: ACTIVE_SESSION_DOC_ID,
      sessionDate: now.toISOString().split('T')[0],
      startTime: '18:00',
      endTime: '22:00',
      lateThreshold: '19:15',
      isOpen: true,
      autoPdfGenerated: false,
    };
    try {
      await setDoc(doc(firestoreDb, SESSION_COLLECTION, ACTIVE_SESSION_DOC_ID), session);
    } catch {}
    await idb.put('sessions', session);
  }
  return session;
}

export async function updateActiveSession(session: AttendanceSession): Promise<void> {
  try {
    await setDoc(doc(firestoreDb, SESSION_COLLECTION, ACTIVE_SESSION_DOC_ID), session);
  } catch (e) {
    console.warn('Error updating session in Firestore:', e);
  }
  const idb = await getDB();
  await idb.put('sessions', session);
}
