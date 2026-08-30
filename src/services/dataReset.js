import { deleteArchiveDatabase } from './archive.js';

export const DATA_SCHEMA_KEY = 'scout-lab:data-schema';
export const DATA_SCHEMA_VERSION = '2';

const scoutLabKeys = (storage) => Array.from({ length: storage.length }, (_, index) => storage.key(index))
  .filter((key) => key?.startsWith('scout-lab:'));

export const ensureCurrentDataSchema = async ({
  storage = localStorage,
  deleteArchiveDatabase: resetArchive = deleteArchiveDatabase,
} = {}) => {
  if (storage.getItem(DATA_SCHEMA_KEY) === DATA_SCHEMA_VERSION) return false;

  scoutLabKeys(storage).forEach((key) => storage.removeItem(key));
  await resetArchive();
  storage.setItem(DATA_SCHEMA_KEY, DATA_SCHEMA_VERSION);
  return true;
};
