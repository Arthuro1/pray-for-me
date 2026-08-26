// m:ss for a recording length, shared by the recorder and the collapsed summary.
export const fmtDuration = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
