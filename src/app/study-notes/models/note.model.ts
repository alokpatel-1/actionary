export interface Note {
  id: string;
  title: string;
  content: string;           // HTML from CKEditor
  folderId: string;          // references a NoteFolder.id
  isPinned: boolean;
  createdAt: number;         // epoch ms
  updatedAt: number;         // epoch ms
  synced: boolean;
  userId?: string;
  isDeleted?: boolean;
}

export type NoteCreate = Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'synced'>;

export interface NoteFolder {
  id: string;
  name: string;
  icon: string;              // PrimeIcons class e.g. 'pi pi-folder'
  color: string;             // hex color for accent
  order: number;
  userId?: string;
}

/** IndexedDB constants */
export const NOTE_DB_NAME = 'StudyNotesDB';
export const NOTE_STORE_NAME = 'notes';
export const FOLDER_STORE_NAME = 'folders';
export const NOTE_DB_VERSION = 3;

/** Default folder — cannot be deleted */
export const DEFAULT_FOLDER: NoteFolder = {
  id: '__uncategorized__',
  name: 'General',
  icon: 'pi pi-folder',
  color: '#4DA3FF',
  order: 0
};

export const QUICK_NOTES_FOLDER: NoteFolder = {
  id: '__quick_notes__',
  name: 'Quick Notes',
  icon: 'pi pi-bolt',
  color: '#F59E0B',
  order: 1
};

/** All default folders that should always exist */
export const DEFAULT_FOLDERS: NoteFolder[] = [DEFAULT_FOLDER, QUICK_NOTES_FOLDER];

/** Preset folder colors */
export const FOLDER_COLORS: string[] = [
  '#4DA3FF',  // Blue
  '#22C55E',  // Green
  '#F59E0B',  // Amber
  '#EF4444',  // Red
  '#8B5CF6',  // Purple
  '#EC4899',  // Pink
  '#14B8A6',  // Teal
  '#F97316',  // Orange
  '#6366F1',  // Indigo
  '#64748B',  // Slate
];

/** Preset folder icons */
export const FOLDER_ICONS: string[] = [
  'pi pi-folder',
  'pi pi-book',
  'pi pi-bookmark',
  'pi pi-star',
  'pi pi-heart',
  'pi pi-bolt',
  'pi pi-code',
  'pi pi-palette',
  'pi pi-calculator',
  'pi pi-globe',
];
