import { t } from '../i18n';

const HEADER = 'QETORET-RECOVERY-V1';
const MAX_SIZE = 16 * 1024;

// The stable header works across languages. Files and secrets stay local.
export function emergencyBackupText(account, code, lang) {
  return `${HEADER}\n${code}\n\n${t(lang, 'protectionCodeFileBody', { account, code })}\n`;
}

export async function readEmergencyBackupFile(file) {
  if (!file || file.size > MAX_SIZE) throw new Error('invalid_backup');
  const text = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('invalid_backup'));
    reader.readAsText(file);
  });
  const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  const code = (lines[0] === HEADER ? lines[1] || '' : lines.length === 1 ? lines[0] : '').trim();
  const normalized = code.toUpperCase().replace(/-/g, '');
  if (![16, 26].includes(normalized.length) || !/^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]+$/.test(normalized)) throw new Error('invalid_backup');
  return code;
}
