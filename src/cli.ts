#!/usr/bin/env node
import { enrichEmail } from "./index.js";

const email = process.argv[2];
if (!email) {
  console.error("Usage: social-from-email <email>");
  process.exit(1);
}

enrichEmail(email)
  .then((res) => {
    console.log(JSON.stringify(res, null, 2));
  })
  .catch((err) => {
    console.error(err.message || String(err));
    process.exit(1);
  });