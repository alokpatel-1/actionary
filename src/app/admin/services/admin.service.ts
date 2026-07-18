import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionGroup, getDocs, doc, setDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { NoteIdbService } from '../../study-notes/services/note-idb.service';
import { Note, NoteFolder, QuickThought } from '../../study-notes/models/note.model';
import { from, Observable, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

export interface UserAdminData {
  uid: string;
  email: string;
  displayName?: string;
  notes: Note[];
  folders: NoteFolder[];
  thoughts: QuickThought[];
  notesCount: number;
  thoughtsCount: number;
  foldersCount: number;
  lastActive?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private firestore = inject(Firestore);
  private idb = inject(NoteIdbService);
  private auth = inject(Auth);

  /** Fetch all registered users and their notes/thoughts/folders data from Firebase Firestore */
  fetchAllUsersData(): Observable<UserAdminData[]> {
    this.ensureCurrentUserDocCreated();

    // Discover all user UIDs in Firebase using users collection AND collectionGroups
    const discoverUsers$ = from(this.discoverAllFirebaseUserUids());

    return discoverUsers$.pipe(
      switchMap(userMap => {
        const uids = Array.from(userMap.keys());
        if (uids.length === 0) {
          return this.fallbackLocalUserData();
        }

        const userFetches$ = uids.map(uid => this.fetchSingleUserData(uid, userMap.get(uid)));
        return forkJoin(userFetches$);
      }),
      catchError(err => {
        console.warn('[AdminService] Error discovering users, using fallback:', err);
        return this.fallbackLocalUserData();
      })
    );
  }

  private async discoverAllFirebaseUserUids(): Promise<Map<string, any>> {
    const userMap = new Map<string, any>();

    // 1. Check root /users collection
    try {
      const usersSnap = await getDocs(collection(this.firestore, 'users'));
      usersSnap.docs.forEach(d => {
        userMap.set(d.id, d.data());
      });
    } catch (e) {
      console.warn('[AdminService] Root users collection fetch error:', e);
    }

    // 2. Discover UIDs from studyNotes collectionGroup across all users
    try {
      const notesGroupSnap = await getDocs(collectionGroup(this.firestore, 'studyNotes'));
      notesGroupSnap.docs.forEach(d => {
        const parentUid = d.ref.parent?.parent?.id;
        if (parentUid && !userMap.has(parentUid)) {
          userMap.set(parentUid, {});
        }
      });
    } catch (e) {
      console.warn('[AdminService] studyNotes collectionGroup fetch error:', e);
    }

    // 3. Discover UIDs from studyThoughts collectionGroup across all users
    try {
      const thoughtsGroupSnap = await getDocs(collectionGroup(this.firestore, 'studyThoughts'));
      thoughtsGroupSnap.docs.forEach(d => {
        const parentUid = d.ref.parent?.parent?.id;
        if (parentUid && !userMap.has(parentUid)) {
          userMap.set(parentUid, {});
        }
      });
    } catch (e) {
      console.warn('[AdminService] studyThoughts collectionGroup fetch error:', e);
    }

    // 4. Discover UIDs from studyFolders collectionGroup across all users
    try {
      const foldersGroupSnap = await getDocs(collectionGroup(this.firestore, 'studyFolders'));
      foldersGroupSnap.docs.forEach(d => {
        const parentUid = d.ref.parent?.parent?.id;
        if (parentUid && !userMap.has(parentUid)) {
          userMap.set(parentUid, {});
        }
      });
    } catch (e) {
      console.warn('[AdminService] studyFolders collectionGroup fetch error:', e);
    }

    // 5. Always include currently logged-in user UID
    const currentUid = this.auth.currentUser?.uid || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('localId') : null);
    if (currentUid && !userMap.has(currentUid)) {
      const currentEmail = this.auth.currentUser?.email || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('email')?.replace(/"/g, '') : 'alokpatel863@gmail.com');
      const currentName = this.auth.currentUser?.displayName || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('displayName')?.replace(/"/g, '') : 'Alok Patel');
      userMap.set(currentUid, { email: currentEmail, displayName: currentName });
    }

    return userMap;
  }

  private ensureCurrentUserDocCreated(): void {
    const u = this.auth.currentUser;
    if (!u) return;
    const userDocRef = doc(this.firestore, `users/${u.uid}`);
    setDoc(userDocRef, {
      email: u.email || 'alokpatel863@gmail.com',
      displayName: u.displayName || 'Alok Patel',
      lastLogin: Date.now()
    }, { merge: true }).catch(err => console.warn('[AdminService] Error setting user doc:', err));
  }

  private fetchSingleUserData(uid: string, rawData: any): Observable<UserAdminData> {
    const notesRef = collection(this.firestore, `users/${uid}/studyNotes`);
    const foldersRef = collection(this.firestore, `users/${uid}/studyFolders`);
    const thoughtsRef = collection(this.firestore, `users/${uid}/studyThoughts`);

    const notes$ = from(getDocs(notesRef)).pipe(
      map(snap => snap.docs.map(d => ({ id: d.id, ...d.data() } as Note))),
      catchError(() => of([]))
    );

    const folders$ = from(getDocs(foldersRef)).pipe(
      map(snap => snap.docs.map(d => ({ id: d.id, ...d.data() } as NoteFolder))),
      catchError(() => of([]))
    );

    const thoughts$ = from(getDocs(thoughtsRef)).pipe(
      map(snap => snap.docs.map(d => ({ id: d.id, ...d.data() } as QuickThought))),
      catchError(() => of([]))
    );

    return forkJoin({ notes: notes$, folders: folders$, thoughts: thoughts$ }).pipe(
      switchMap(({ notes, folders, thoughts }) => {
        // If this is the current user, merge with IndexedDB notes/folders/thoughts
        const isCurrent = uid === (this.auth.currentUser?.uid || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('localId') : ''));
        if (isCurrent) {
          return from(Promise.all([this.idb.getAllNotes(), this.idb.getAllFolders(), this.idb.getAllThoughts()])).pipe(
            map(([localNotes, localFolders, localThoughts]) => {
              const noteMap = new Map<string, Note>();
              localNotes.forEach(n => noteMap.set(n.id, n));
              notes.forEach(n => noteMap.set(n.id, n));
              const mergedNotes = Array.from(noteMap.values());

              const thoughtMap = new Map<string, QuickThought>();
              localThoughts.forEach(t => thoughtMap.set(t.id, t));
              thoughts.forEach(t => thoughtMap.set(t.id, t));
              const mergedThoughts = Array.from(thoughtMap.values());

              const folderMap = new Map<string, NoteFolder>();
              localFolders.forEach(f => folderMap.set(f.id, f));
              folders.forEach(f => folderMap.set(f.id, f));
              const mergedFolders = Array.from(folderMap.values());

              return { notes: mergedNotes, folders: mergedFolders, thoughts: mergedThoughts };
            })
          );
        }
        return of({ notes, folders, thoughts });
      }),
      map(({ notes, folders, thoughts }) => {
        const lastActive = Math.max(
          ...notes.map(n => n.updatedAt || n.createdAt || 0),
          ...thoughts.map(t => t.createdAt || 0),
          0
        );

        let email = rawData?.email || rawData?.userEmail || '';
        let displayName = rawData?.displayName || rawData?.username || rawData?.name || '';

        // Search notes or thoughts for author metadata if email/name missing
        if (!email) {
          const noteWithEmail = notes.find(n => (n as any).userEmail || (n as any).email || (n as any).authorEmail);
          if (noteWithEmail) {
            email = (noteWithEmail as any).userEmail || (noteWithEmail as any).email || (noteWithEmail as any).authorEmail;
          }
        }

        if (!displayName) {
          const noteWithName = notes.find(n => (n as any).userName || (n as any).authorName);
          if (noteWithName) {
            displayName = (noteWithName as any).userName || (noteWithName as any).authorName;
          }
        }

        if (!displayName) {
          if (email && email.includes('@')) {
            displayName = email.split('@')[0];
          } else {
            displayName = `User (${uid.substring(0, 8)})`;
          }
        }

        if (!email) {
          email = `UID: ${uid}`;
        }

        return {
          uid,
          email,
          displayName,
          notes,
          folders,
          thoughts,
          notesCount: notes.length,
          thoughtsCount: thoughts.length,
          foldersCount: folders.length,
          lastActive: lastActive || Date.now()
        };
      })
    );
  }

  private fallbackLocalUserData(): Observable<UserAdminData[]> {
    return from(Promise.all([this.idb.getAllNotes(), this.idb.getAllFolders(), this.idb.getAllThoughts()])).pipe(
      map(([notes, folders, thoughts]) => {
        let currentEmail = 'alokpatel863@gmail.com';
        let currentUid = this.auth.currentUser?.uid || 'alokpatel863';
        let displayName = this.auth.currentUser?.displayName || 'Alok Patel';

        if (typeof sessionStorage !== 'undefined') {
          const rawEmail = sessionStorage.getItem('email');
          if (rawEmail) currentEmail = rawEmail.replace(/"/g, '');
          const localId = sessionStorage.getItem('localId');
          if (localId) currentUid = localId;
          const dName = sessionStorage.getItem('displayName');
          if (dName) displayName = dName;
        }

        const adminUser: UserAdminData = {
          uid: currentUid,
          email: currentEmail,
          displayName,
          notes,
          folders,
          thoughts,
          notesCount: notes.length,
          thoughtsCount: thoughts.length,
          foldersCount: folders.length,
          lastActive: Date.now()
        };

        return [adminUser];
      })
    );
  }
}
