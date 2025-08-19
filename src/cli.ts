#!/usr/bin/env node
import { enrichEmail } from "./index";

const email = process.argv[2];
const firstName = process.argv[3];
const lastName = process.argv[4];

if (!email) {
  console.error("Usage: social-from-email <email> [firstName] [lastName]");
  console.error("Example: social-from-email luka.yep@gmail.com Luka Bagashvili");
  console.error("For Google search: use google-search <firstName> <lastName> [email]");
  process.exit(1);
}

enrichEmail(email, { firstName, lastName })
  .then(r => console.log(JSON.stringify(r, null, 2)))
  .catch(e => { console.error(e.message || String(e)); process.exit(1); });
