# Social Profile Search with LinkedIn Scraping

A comprehensive tool for finding social media profiles and personal information through Google search, with enhanced LinkedIn profile scraping capabilities.

## Features

- **Google Search Integration**: Search for people using various strategies (basic name search, email search, domain-specific searches)
- **LinkedIn Profile Scraping**: Automatically scrape detailed LinkedIn profiles including:
  - Profile information (name, title, location, photo, description)
  - Work experience with dates and descriptions
  - Education history
  - Skills with endorsement counts
  - Volunteer experiences
- **Multi-platform Discovery**: Find profiles across LinkedIn, Twitter, Facebook, Instagram, and other platforms
- **Anti-detection Measures**: Built-in request throttling and realistic browser behavior
- **Detailed Output**: Comprehensive formatting of results with LinkedIn profile data

## Installation

```bash
npm install
npm run build
```

## Required Dependencies

The LinkedIn scraper requires several additional packages:

```bash
npm install moment-timezone i18n-iso-countries all-the-cities tree-kill
```

## Configuration

### LinkedIn Cookie Setup

To scrape LinkedIn profiles, you need to obtain your LinkedIn session cookie:

1. **Log into LinkedIn** with your browser
2. **Open Developer Tools** (F12)
3. **Go to Application/Storage tab** → Cookies → https://www.linkedin.com
4. **Find the 'li_at' cookie** and copy its value
5. **Create a .env file** in your project root:

```bash
cp .env.example .env
```

6. **Add your cookie value** to the .env file:

```
LI_AT=your_linkedin_li_at_cookie_value_here
```

### Important Notes about LinkedIn Cookies

- **Privacy**: Create a dedicated LinkedIn account for scraping to protect your personal account
- **Expiration**: LinkedIn cookies can expire. You'll need to refresh them periodically
- **Rate Limiting**: The scraper includes built-in delays to respect LinkedIn's usage limits
- **Terms of Service**: Ensure your usage complies with LinkedIn's Terms of Service

## Usage

### CLI Commands

The tool provides multiple CLI interfaces:

#### 1. Google Search with LinkedIn Scraping (Recommended)

```bash
# Basic search
node dist/cli-search-with-linkedin.cjs "First Last"
node dist/cli-search-with-linkedin.cjs "Elon Musk"

# Search with email
node dist/cli-search-with-linkedin.cjs "Luka Bagashvili" bagash_l2@denison.edu

# Detailed search with multiple variations
node dist/cli-search-with-linkedin.cjs "Luka Bagashvili" bagash_l2@denison.edu --detailed
```

#### 2. Google Search Only (No LinkedIn Scraping)

```bash
# Basic Google search
node dist/cli-search.cjs "Elon Musk"
node dist/cli-search.cjs "Luka Bagashvili" bagash_l2@denison.edu --detailed
```

#### 3. Original Social Media Enrichment

```bash
# Original email-based social discovery
node dist/cli.cjs user@example.com
```

### Output Examples

#### Basic Search Results

```
📊 Found 3 search results:

1. Luka Bagashvili - Software Engineer @ Company
   🔗 https://www.linkedin.com/in/lukabagashvili
   🌐 www.linkedin.com
   👤 Luka Bagashvili - Software Engineer

2. Luka Bagashvili | Facebook
   🔗 https://www.facebook.com/luka.bagashvili
   🌐 www.facebook.com

📈 LinkedIn Scraping Summary:
   ✅ Successfully scraped: 1 profile(s)
```

#### Detailed Search with LinkedIn Data

```
🌐 LINKEDIN.COM (1 result)

  1. Luka Bagashvili - Software Engineer @ Company
     🔗 https://www.linkedin.com/in/lukabagashvili
     📝 Experienced software engineer specializing in full-stack development...

    🔍 LinkedIn Profile Details:

    👤 Profile Information:
       Name: Luka Bagashvili
       Title: Software Engineer
       Location: San Francisco, CA, United States
       About: Passionate software engineer with expertise in TypeScript, React, and Node.js...

    💼 Recent Experience:
       • Software Engineer at Tech Company (2023-01-01 - Present)
       • Full Stack Developer at Startup Inc (2021-06-01 - 2022-12-01)

    🎓 Education:
       • Bachelor of Science at Denison University (Computer Science)

    🎯 Top Skills:
       TypeScript, React, Node.js, Python, AWS
```

## Programmatic Usage

### Using the LinkedIn Scraper Directly

```typescript
import { LinkedInProfileScraper } from './src/linkedin/scraper.js';

const scraper = new LinkedInProfileScraper({
  sessionCookieValue: 'your_li_at_cookie_value',
  keepAlive: false,
  headless: true,
  timeout: 20000
});

await scraper.setup();

const profile = await scraper.run('https://www.linkedin.com/in/someone/');
console.log(profile);

await scraper.close();
```

### Combining Google Search with LinkedIn Scraping

```typescript
import { GoogleSearchScraper } from './src/google-search/scraper.js';
import { LinkedInProfileScraper } from './src/linkedin/scraper.js';

// Search for person
const googleScraper = new GoogleSearchScraper();
await googleScraper.setup();

const searchResults = await googleScraper.searchPerson('John', 'Doe', 'john@example.com');

// Find LinkedIn URLs
const linkedinUrls = searchResults
  .filter(result => result.domain.includes('linkedin.com'))
  .map(result => result.url);

// Scrape LinkedIn profiles
const linkedinScraper = new LinkedInProfileScraper({
  sessionCookieValue: process.env.LI_AT!,
  keepAlive: true
});

await linkedinScraper.setup();

for (const url of linkedinUrls) {
  const profile = await linkedinScraper.run(url);
  console.log(profile);
}

await linkedinScraper.close();
await googleScraper.close();
```

## LinkedIn Profile Data Structure

The scraper returns comprehensive profile data:

```typescript
interface LinkedInProfile {
  userProfile: {
    fullName: string | null;
    title: string | null;
    location: Location | null;
    photo: string | null;
    description: string | null;
    url: string;
  };
  experiences: Experience[];
  education: Education[];
  volunteerExperiences: VolunteerExperience[];
  skills: Skill[];
}
```

### Experience Data

```typescript
interface Experience {
  title: string | null;
  company: string | null;
  employmentType: string | null;
  location: Location | null;
  startDate: string | null;
  endDate: string | null;
  endDateIsPresent: boolean;
  durationInDays: number | null;
  description: string | null;
}
```

### Education Data

```typescript
interface Education {
  schoolName: string | null;
  degreeName: string | null;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  durationInDays: number | null;
}
```

## Performance and Limitations

### Rate Limiting

- **Built-in delays**: 3-second delays between LinkedIn profile scrapes
- **Request throttling**: Automatic delays between Google searches
- **Respectful scraping**: Designed to avoid triggering anti-bot measures

### LinkedIn Limitations

- **Session dependency**: Requires valid LinkedIn session cookie
- **Profile visibility**: Can only scrape publicly visible profile data
- **Dynamic content**: Some profile sections may not load consistently
- **Geographic restrictions**: Results may vary based on your location

### Google Search Limitations

- **Rate limiting**: Google may block requests if too many are made quickly
- **CAPTCHA challenges**: May occasionally require manual intervention
- **Result variance**: Search results can vary based on location and personalization

## Troubleshooting

### LinkedIn Cookie Issues

```
❌ SessionExpired: Bad news, we are not logged in!
```

**Solution**: Refresh your LinkedIn cookie:
1. Clear browser cache and cookies for LinkedIn
2. Log in to LinkedIn again
3. Extract new `li_at` cookie value
4. Update your `.env` file

### Google Search Blocked

```
❌ Error during Google search: TimeoutError
```

**Solutions**:
- Add delays between searches
- Use a VPN or different IP address
- Reduce the number of concurrent searches

### Empty Results

**Possible causes**:
- Person has no public LinkedIn profile
- Privacy settings restrict profile visibility
- Name spelling variations not covered
- Person uses different name professionally

## Security and Privacy

### Data Handling

- **No data storage**: Profile data is not stored persistently
- **Memory cleanup**: Browser instances are properly closed
- **Session isolation**: Each scraping session is independent

### Ethical Usage

- **Respect robots.txt**: The scraper respects website policies
- **Rate limiting**: Built-in delays prevent server overload
- **Public data only**: Only scrapes publicly available information
- **Terms compliance**: Ensure your usage complies with platform terms

### Recommended Practices

1. **Use dedicated accounts**: Create separate LinkedIn accounts for scraping
2. **Limit frequency**: Don't run large batches frequently
3. **Monitor usage**: Keep track of your scraping activity
4. **Respect privacy**: Only scrape data you have legitimate need for

## Error Handling

The scraper includes comprehensive error handling:

```typescript
try {
  const profile = await scraper.run(url);
  console.log('Profile scraped successfully:', profile);
} catch (error) {
  if (error.name === 'SessionExpired') {
    console.log('LinkedIn session expired, need new cookie');
  } else {
    console.log('Scraping failed:', error.message);
  }
}
```

## Contributing

When contributing to the LinkedIn scraper:

1. **Test thoroughly**: LinkedIn frequently changes their DOM structure
2. **Handle errors gracefully**: Add proper error handling for new features
3. **Respect rate limits**: Don't reduce the built-in delays
4. **Document changes**: Update this README for any new functionality

## License

This project is licensed under the ISC License. Please ensure your usage complies with LinkedIn's Terms of Service and applicable laws in your jurisdiction.
