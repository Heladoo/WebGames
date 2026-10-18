// Limits for player ideas. api/ideas.js enforces the same ones on the server
// (a test checks the two match); keep this file free of browser globals so
// the tests can import it in Node. There are no content rules: every idea is
// read by the owner on the stats page before anyone else can see it.

export const LIMITS = { text: 500, name: 30, perDay: 5, queue: 300, shown: 60 };
