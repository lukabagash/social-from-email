#!/usr/bin/env node

import puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';

dotenv.config();

async function testLinkedInCookie() {
  const liAtCookie = process.env.LI_AT;
  if (!liAtCookie) {
    console.log('❌ LI_AT cookie not found in .env file.');
    process.exit(1);
  }

  console.log('🔧 Testing LinkedIn cookie...');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set the cookie
    await page.goto('https://www.linkedin.com');
    await page.setCookie({
      name: 'li_at',
      value: liAtCookie,
      domain: '.linkedin.com'
    });

    console.log('🍪 Cookie set, navigating to LinkedIn feed...');
    await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'networkidle2' });
    
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    if (currentUrl.includes('/feed') || currentUrl.includes('/in/')) {
      console.log('✅ Cookie is working! Successfully logged in.');
    } else if (currentUrl.includes('authwall') || currentUrl.includes('login')) {
      console.log('❌ Cookie is not working. Being redirected to login/authwall.');
      console.log('💡 You may need to refresh your LinkedIn cookie.');
    } else {
      console.log('🤔 Unexpected redirect:', currentUrl);
    }

    // Wait a bit so you can see the browser
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testLinkedInCookie();
