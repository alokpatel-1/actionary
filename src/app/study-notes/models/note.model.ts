export interface Note {
  id: string;
  title: string;
  content: string;           // HTML from Tiptap
  folderId: string;          // references a NoteFolder.id
  isPinned: boolean;
  createdAt: number;         // epoch ms
  updatedAt: number;         // epoch ms
  synced: boolean;
  userId?: string;
  isDeleted?: boolean;
  tags?: string[];           // free-form tags
  status?: 'draft' | 'published'; // note status
  versions?: { content: string; savedAt: number }[]; // last 5 auto-saves
  comments?: NoteComment[];  // line/block comments
}

export interface NoteComment {
  id: string;
  blockIndex: number;
  text: string;
  userName: string;
  createdAt: number;
}

export interface QuickThought {
  id: string;
  text: string;
  createdAt: number;
}

export type NoteCreate = Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'synced'>;

export interface NoteFolder {
  id: string;
  name: string;
  icon: string;              // Emoji character e.g. '📁'
  color: string;             // hex color for accent
  order: number;
  synced?: boolean;          // false = not yet pushed to Firestore
  userId?: string;
  parentId?: string;         // optional parent folder ID for hierarchical folders
}

/** IndexedDB constants */
export const NOTE_DB_NAME = 'StudyNotesDB';
export const NOTE_STORE_NAME = 'notes';
export const FOLDER_STORE_NAME = 'folders';
export const THOUGHT_STORE_NAME = 'quick_thoughts';
export const NOTE_DB_VERSION = 4;

/** Default folder — cannot be deleted */
export const DEFAULT_FOLDER: NoteFolder = {
  id: '__uncategorized__',
  name: 'General',
  icon: '📁',
  color: '#4DA3FF',
  order: 0
};

export const QUICK_NOTES_FOLDER: NoteFolder = {
  id: '__quick_notes__',
  name: 'Quick Notes',
  icon: '⚡',
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

/** Preset folder icons (emojis — universal, no font-loading issues) */
export const FOLDER_ICONS: string[] = [
  '📁',  // Folder
  '📂',  // Open Folder
  '📚',  // Books
  '📖',  // Open Book
  '📝',  // Memo
  '⭐',  // Star
  '❤️',  // Heart
  '⚡',  // Lightning
  '💻',  // Laptop
  '🎨',  // Art
  '🔬',  // Science
  '🧮',  // Calculator
  '🌍',  // Globe
  '🚀',  // Rocket
  '🎯',  // Target
  '💡',  // Idea
  '🔒',  // Lock
  '🎵',  // Music
  '🏆',  // Trophy
  '🌿',  // Plant
];

/** Maps legacy PrimeIcons class strings → emoji equivalents */
const PI_TO_EMOJI: Record<string, string> = {
  'pi pi-folder':       '📁',
  'pi pi-folder-open':  '📂',
  'pi pi-book':         '📚',
  'pi pi-bookmark':     '📖',
  'pi pi-file':         '📝',
  'pi pi-star':         '⭐',
  'pi pi-heart':        '❤️',
  'pi pi-bolt':         '⚡',
  'pi pi-code':         '💻',
  'pi pi-palette':      '🎨',
  'pi pi-calculator':   '🧮',
  'pi pi-globe':        '🌍',
  'pi pi-home':         '🏠',
  'pi pi-lock':         '🔒',
  'pi pi-music':        '🎵',
  'pi pi-tag':          '🏷️',
  'pi pi-inbox':        '📥',
  'pi pi-check':        '✅',
  'pi pi-cog':          '⚙️',
};

/**
 * Normalises a folder icon value.
 * Old IndexedDB/Firestore data stored PrimeIcons strings like "pi pi-folder".
 * New data stores emoji directly like "📁".
 * Converts any legacy pi-class to an emoji; returns the value unchanged if it's already an emoji.
 */
export function normalizeIcon(icon: string): string {
  if (!icon) return '📁';
  // Legacy PrimeIcons value — convert to emoji
  if (icon.startsWith('pi ') || icon.startsWith('pi-') || icon === 'pi') {
    const key = icon.startsWith('pi-') ? `pi ${icon}` : icon.trim();
    return PI_TO_EMOJI[key] ?? '📁';
  }
  return icon;
}

