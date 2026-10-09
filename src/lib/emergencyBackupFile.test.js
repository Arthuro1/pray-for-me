// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { emergencyBackupText, readEmergencyBackupFile } from './emergencyBackupFile';
import { loadLocale, t } from '../i18n';

const account = 'synthetic-account';
const code = '01234-56789-ABCDE-FGHJK-MNPQR-S';
const file = (text) => new File([text], 'recovery.txt', { type: 'text/plain;charset=utf-8' });

describe('saved emergency recovery files', () => {
  it.each(['en', 'fr'])('round-trips a localized downloaded backup (%s)', async (lang) => {
    await loadLocale(lang);
    const text = emergencyBackupText(account, code, lang);

    expect(text.startsWith(`QETORET-RECOVERY-V1\n${code}\n`)).toBe(true);
    expect(text).toContain(t(lang, 'protectionCodeFileBody', { account, code }));
    expect(await readEmergencyBackupFile(file(text))).toBe(code);
  });

  it('accepts a plain saved code without requiring Qetoret explanatory text', async () => {
    expect(await readEmergencyBackupFile(file(`  ${code}\n`))).toBe(code);
    const legacy = '01234-56789-ABCDE-F';
    expect(await readEmergencyBackupFile(file(legacy))).toBe(legacy);
  });

  it('accepts UTF-8 BOM and Windows newlines in a downloaded file', async () => {
    const text = `\uFEFF${emergencyBackupText(account, code, 'fr').replace(/\n/g, '\r\n')}`;
    expect(await readEmergencyBackupFile(file(text))).toBe(code);
  });

  it('accepts a BOM around a plain saved code without adding it to the secret', async () => {
    expect(await readEmergencyBackupFile(file(`\uFEFF${code}\r\n`))).toBe(code);
  });

  it.each([
    '',
    'QETORET-RECOVERY-V1',
    'QETORET-RECOVERY-V1\n\nSave this backup safely.',
    `QETORET-RECOVERY-V2\n${code}`,
    `Unrecognized file\n${code}`,
    `QETORET-RECOVERY-V1\n${code} <script>`,
    `QETORET-RECOVERY-V1\nSHORT`,
    'QETORET-RECOVERY-V1\nSAVETHISBACKUPSAFELY',
    '0123456789ABCDEFGHJK',
    '01234-56789-ABCDE-FGHIJ-MNPQR-S',
    `${code}\nAnother plain code`,
  ])('rejects a missing code or malformed backup rather than reading explanatory text as a credential (%j)', async (text) => {
    await expect(readEmergencyBackupFile(file(text))).rejects.toThrow('invalid_backup');
  });

  it('rejects oversized files even when their first lines contain a valid code', async () => {
    const prefix = `QETORET-RECOVERY-V1\n${code}\n`;
    await expect(readEmergencyBackupFile(file(prefix + 'x'.repeat(16 * 1024)))).rejects.toThrow('invalid_backup');
  });

  it('accepts the documented size boundary while preserving the code exactly', async () => {
    const prefix = `QETORET-RECOVERY-V1\n${code}\n`;
    const backup = file(prefix + 'x'.repeat(16 * 1024 - prefix.length));
    expect(backup.size).toBe(16 * 1024);
    expect(await readEmergencyBackupFile(backup)).toBe(code);
  });

  it('rejects absent files', async () => {
    await expect(readEmergencyBackupFile(null)).rejects.toThrow('invalid_backup');
  });
});
