// Limits for player ideas. api/ideas.js enforces the same ones on the server
// (a test checks the two match); keep this file free of browser globals so
// the tests can import it in Node.

export const LIMITS = { pics: 3, text: 140, names: 4, name: 20, perDay: 5, queue: 300, shown: 60 };

/** Letters only (any script), with single spaces, apostrophes or hyphens between them. */
export const NAME_RE = /^[\p{L}\p{M}]+(?:[ '\-־][\p{L}\p{M}]+)*$/u;
