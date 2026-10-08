// The passages under each step of the landing story, localized at render.
// Kept separate from the complete build-time manifest so the landing shell
// does not eagerly load the circle teaching's deeper content.
export const LANDING_BEAT_REFS = Object.freeze({
  bring: Object.freeze(['Psalm 62:8', '1 Samuel 1:15']),
  together: Object.freeze(['Luke 1:10', 'Galatians 6:2']),
  rhythm: Object.freeze(['Exodus 30:7-8', 'Luke 18:1', 'Psalm 46:10']),
  remember: Object.freeze(['Luke 1:13-17', 'Psalm 103:2']),
});
