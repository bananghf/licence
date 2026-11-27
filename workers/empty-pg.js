/** Stub so Wrangler does not bundle real `pg` into the Worker. */
class Pool {
  constructor() {
    throw new Error("PostgreSQL is not available on Cloudflare Workers — use D1.");
  }
}

module.exports = { Pool };
