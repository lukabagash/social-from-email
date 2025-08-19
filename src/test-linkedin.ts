#!/usr/bin/env node

import { LinkedInProfileScraper } from './linkedin/scraper.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function testLinkedInScraper() {
  const liAtCookie = process.env.LI_AT;
  if (!liAtCookie) {
    console.log('❌ LI_AT cookie not found in .env file.');
    process.exit(1);
  }

  const scraper = new LinkedInProfileScraper({
    sessionCookieValue: liAtCookie,
    keepAlive: false,
    headless: true,
    timeout: 30000
  });

  try {
    console.log('🔧 Setting up LinkedIn scraper...');
    await scraper.setup();

    console.log('📊 Scraping LinkedIn profile...');
    const profile = await scraper.run('https://www.linkedin.com/in/lukabagashvili');
    
    console.log('\n✅ Profile scraped successfully!');
    console.log('\n👤 Profile Information:');
    console.log(`   Name: ${profile.userProfile.fullName || 'N/A'}`);
    console.log(`   Title: ${profile.userProfile.title || 'N/A'}`);
    if (profile.userProfile.location) {
      const loc = profile.userProfile.location;
      const locationStr = [loc.city, loc.province, loc.country].filter(Boolean).join(', ');
      console.log(`   Location: ${locationStr}`);
    }
    if (profile.userProfile.description) {
      console.log(`   About: ${profile.userProfile.description.substring(0, 200)}${profile.userProfile.description.length > 200 ? '...' : ''}`);
    }
    
    console.log(`\n💼 Experience (${profile.experiences.length} entries):`);
    profile.experiences.slice(0, 3).forEach((exp, index) => {
      console.log(`   ${index + 1}. ${exp.title || 'N/A'} at ${exp.company || 'N/A'}`);
      if (exp.startDate) {
        const duration = exp.endDateIsPresent ? 'Present' : exp.endDate || 'N/A';
        console.log(`      Duration: ${exp.startDate} - ${duration}`);
      }
    });
    
    console.log(`\n🎓 Education (${profile.education.length} entries):`);
    profile.education.slice(0, 2).forEach((edu, index) => {
      console.log(`   ${index + 1}. ${edu.degreeName || 'N/A'} at ${edu.schoolName || 'N/A'}`);
      if (edu.fieldOfStudy) {
        console.log(`      Field: ${edu.fieldOfStudy}`);
      }
    });
    
    console.log(`\n🎯 Skills (${profile.skills.length} total):`);
    const topSkills = profile.skills
      .filter(skill => skill.skillName)
      .sort((a, b) => (b.endorsementCount || 0) - (a.endorsementCount || 0))
      .slice(0, 10);
    
    topSkills.forEach((skill, index) => {
      console.log(`   ${index + 1}. ${skill.skillName} (${skill.endorsementCount || 0} endorsements)`);
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await scraper.close();
  }
}

testLinkedInScraper();
