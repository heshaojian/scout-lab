import { describe, expect, it, vi } from 'vitest';

import { hasPermission, verifyPermission, writeArchiveToHandle } from '../src/services/archive.js';

const archiveHandle = ({ permission = 'granted' } = {}) => {
  const write = vi.fn();
  const close = vi.fn();
  const createWritable = vi.fn(async () => ({ write, close }));
  const getFileHandle = vi.fn(async () => ({ createWritable }));
  const monthHandle = { getFileHandle };
  const yearHandle = { getDirectoryHandle: vi.fn(async () => monthHandle) };
  const root = {
    name: 'Scout Lab Archive',
    queryPermission: vi.fn(async () => permission),
    requestPermission: vi.fn(async () => permission),
    getDirectoryHandle: vi.fn(async () => yearHandle),
  };
  return { root, write, close, createWritable, getFileHandle, yearHandle };
};

describe('archive filesystem writer', () => {
  it('creates year/month folders and writes the daily Markdown file', async () => {
    const handles = archiveHandle();
    const path = await writeArchiveToHandle(handles.root, '2026-08-29', '# Daily');

    expect(handles.root.getDirectoryHandle).toHaveBeenCalledWith('2026', { create: true });
    expect(handles.yearHandle.getDirectoryHandle).toHaveBeenCalledWith('08', { create: true });
    expect(handles.getFileHandle).toHaveBeenCalledWith('2026-08-29.md', { create: true });
    expect(handles.write).toHaveBeenCalledWith('# Daily');
    expect(handles.close).toHaveBeenCalled();
    expect(path).toBe('Scout Lab Archive/2026/08/2026-08-29.md');
  });

  it('requests permission when it is not already granted', async () => {
    const handle = {
      queryPermission: vi.fn(async () => 'prompt'),
      requestPermission: vi.fn(async () => 'granted'),
    };
    expect(await verifyPermission(handle)).toBe(true);
    expect(handle.requestPermission).toHaveBeenCalledWith({ mode: 'readwrite' });
  });

  it('checks stored permission without prompting during startup', async () => {
    const handle = {
      queryPermission: vi.fn(async () => 'prompt'),
      requestPermission: vi.fn(),
    };

    expect(await hasPermission(handle)).toBe(false);
    expect(handle.requestPermission).not.toHaveBeenCalled();
  });

  it('rejects denied writes and invalid archive input', async () => {
    const denied = archiveHandle({ permission: 'denied' });
    await expect(writeArchiveToHandle(denied.root, '2026-08-29', '# Daily')).rejects.toThrow('permission');
    await expect(writeArchiveToHandle(archiveHandle().root, '08/29/2026', '# Daily')).rejects.toThrow('YYYY-MM-DD');
    await expect(writeArchiveToHandle(archiveHandle().root, '2026-08-29', null)).rejects.toThrow('must be text');
  });

  it('returns false when no directory handle exists', async () => {
    expect(await hasPermission(null)).toBe(false);
    expect(await verifyPermission(null)).toBe(false);
  });
});
