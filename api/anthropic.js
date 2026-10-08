// Compatibility route: exactly the same consent, auth, quotas, validation and
// normalized response as /api/ai. There is no alternate raw-provider relay.
export { default, handleAiRequest as handleAnthropicRequest, MAX_REQUEST_BYTES } from './ai.js';
