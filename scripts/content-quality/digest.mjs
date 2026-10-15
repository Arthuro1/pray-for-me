import { createHash } from 'node:crypto';

// SHA-256 of a value's JSON form: the fingerprint every review record pins.
export const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
