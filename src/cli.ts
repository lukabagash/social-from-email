#!/usr/bin/env node
import { enrichEmail } from "./index";

const email = process.argv[2];
if (!email) {
  console.error("Usage: social-from-email <email>");
  process.exit(1);
}

enrichEmail(email)
  .then(r => console.log(JSON.stringify(r, null, 2)))
  .catch(e => { console.error(e.message || String(e)); process.exit(1); });
