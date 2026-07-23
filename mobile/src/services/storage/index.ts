/**
 * Persistence strategy entry point.
 *
 * AsyncStorage: profiles, settings, resume session (Phase 2+)
 * SQLite: prepared in services/database — card-level progress later
 */

export { getItem, setItem, removeItem, storageKeys } from './asyncStorage';
