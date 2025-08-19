# Web Search & Scraping Tool

A comprehensive tool for searching Google and scraping structured data from discovered websites. This tool combines Google search capabilities with advanced web scraping to extract contact information, social links, content structure, and more.

## 🚀 Features

- **Google Search Integration**: Performs comprehensive searches with multiple variations
- **General Web Scraping**: Extracts structured data from any website
- **Contact Information Extraction**: Finds emails, phone numbers, and social media links
- **Content Analysis**: Analyzes page structure, headings, and content
- **Anti-Detection**: Uses stealth techniques to avoid bot detection
- **Multiple Output Formats**: View data in terminal or export to JSON
- **Required Field Validation**: Ensures data quality with proper validation

## 📦 Installation

```bash
npm install
npm run build
```

## 🛠️ Available Commands

### 1. Search and Scrape (Interactive)
Search Google and scrape all found websites with detailed output in terminal.

```bash
# Basic usage
node dist/cli-search-and-scrape.cjs "John" "Doe" "john.doe@example.com"

# Detailed analysis mode
node dist/cli-search-and-scrape.cjs "John" "Doe" "john.doe@example.com" --detailed
```

**Features:**
- ✅ All three fields required (firstName, lastName, email)
- ✅ Email validation
- ✅ Detailed website analysis
- ✅ Contact information extraction
- ✅ Social media link detection
- ✅ Content structure analysis

### 2. Export to JSON
Search and scrape with complete data export to JSON file.

```bash
# Export to default directory (./exports)
node dist/cli-export-json.cjs "John" "Doe" "john.doe@example.com"

# Export to custom directory
node dist/cli-export-json.cjs "John" "Doe" "john.doe@example.com" ./my-exports
```

**Features:**
- 💾 Complete structured data export
- 📁 Automatic timestamped filenames
- 🔍 All search results included
- 📊 Performance metrics
- 📈 Summary statistics

### 3. Google Search Only (Updated)
Perform Google searches with all fields required.

```bash
# Basic search
node dist/cli-search.cjs "John" "Doe" "john.doe@example.com"

# Detailed search variations
node dist/cli-search.cjs "John" "Doe" "john.doe@example.com" --detailed
```

### 4. Legacy LinkedIn Search (Still Available)
Original LinkedIn-focused search functionality.

```bash
node dist/cli-search-with-linkedin.cjs "John" "Doe" "john.doe@example.com"
```

## 📊 Data Structure

### Extracted Information

Each scraped website provides:

#### 🌐 Basic Information
- **URL & Domain**: Full URL and domain name
- **Title & Description**: Page title and meta description
- **Load Performance**: Response time and load metrics

#### 📋 Content Structure
- **Headings**: H1, H2, H3 elements with text content
- **Paragraphs**: Meaningful text content (filtered for quality)
- **Links**: Internal and external links with context
- **Images**: Image sources with alt text

#### 📞 Contact Information
- **Email Addresses**: Extracted from page content
- **Phone Numbers**: US format phone numbers
- **Social Media Links**: Detected social platform links
  - Facebook, Twitter/X, LinkedIn, Instagram
  - YouTube, GitHub, TikTok, Pinterest
  - WhatsApp, Telegram, Discord, Reddit, Medium

#### 🏗️ Page Structure
- **Navigation Elements**: Header, footer, navigation presence
- **Content Organization**: Articles, forms, sidebar detection
- **Metadata**: Open Graph, Twitter Cards, SEO data

### Example Output Structure

```json
{
  "searchResults": [...],
  "scrapedData": [
    {
      "url": "https://example.com",
      "title": "Example Page",
      "domain": "example.com",
      "metadata": {
        "description": "Page description",
        "ogTitle": "Open Graph title",
        "ogImage": "https://example.com/image.jpg"
      },
      "content": {
        "headings": {
          "h1": ["Main Title"],
          "h2": ["Section 1", "Section 2"],
          "h3": ["Subsection A", "Subsection B"]
        },
        "paragraphs": ["Content paragraph 1", "Content paragraph 2"],
        "contactInfo": {
          "emails": ["contact@example.com"],
          "phones": ["(555) 123-4567"],
          "socialLinks": [
            {"platform": "LinkedIn", "url": "https://linkedin.com/company/example"}
          ]
        }
      },
      "structure": {
        "hasNav": true,
        "hasHeader": true,
        "hasFooter": true,
        "articleCount": 3
      },
      "performance": {
        "loadTime": 1250,
        "responseTime": 890
      }
    }
  ],
  "summary": {
    "totalSearchResults": 10,
    "successfulScrapes": 8,
    "contactsFound": {
      "totalEmails": 15,
      "totalPhones": 8,
      "totalSocialLinks": 25
    }
  }
}
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file for configuration:

```bash
# Optional: Custom user agents, timeouts, etc.
SCRAPER_TIMEOUT=15000
SCRAPER_USER_AGENT="Custom User Agent"
```

### Scraping Options

The scrapers use these default settings:

```typescript
{
  timeout: 15000,           // 15 second timeout
  extractImages: false,     // Skip images for speed
  extractLinks: true,       // Extract all links
  maxContentLength: 5000,   // Limit content size
  followRedirects: true     // Follow redirects
}
```

## 🛡️ Anti-Detection Features

- **Puppeteer-Extra Stealth Plugin**: Advanced bot detection evasion
- **Realistic User Agent**: Latest Chrome user agent strings
- **Human-like Timing**: Random delays between requests
- **Resource Blocking**: Skip unnecessary resources for speed
- **WebDriver Detection Removal**: Remove automation signatures

## 📈 Performance

### Speed Optimizations
- **Resource Blocking**: Images, fonts, and media blocked by default
- **Parallel Processing**: Multiple scrapers can run simultaneously
- **Efficient Selectors**: Optimized DOM queries
- **Memory Management**: Proper browser cleanup

### Rate Limiting
- **Respectful Delays**: 1-3 second delays between requests
- **Error Handling**: Graceful failure handling
- **Timeout Management**: Configurable request timeouts

## 🚨 Error Handling

The tool handles various error conditions:

- **Invalid URLs**: Skips malformed URLs
- **Timeout Errors**: Continues with remaining sites
- **Access Denied**: Logs errors and continues
- **Network Issues**: Retries with exponential backoff

## 📝 Example Use Cases

### 1. Personal Research
```bash
# Research a potential business contact
node dist/cli-search-and-scrape.cjs "Jane" "Smith" "jane.smith@company.com" --detailed
```

### 2. Lead Generation
```bash
# Export contact data for CRM import
node dist/cli-export-json.cjs "John" "Director" "j.director@startup.com"
```

### 3. Competitive Analysis
```bash
# Analyze competitor's online presence
node dist/cli-search-and-scrape.cjs "CEO" "Name" "ceo@competitor.com"
```

## ⚠️ Important Notes

### Legal Compliance
- **Respect robots.txt**: Check website policies before scraping
- **Rate Limiting**: Built-in delays to be respectful
- **Terms of Service**: Ensure compliance with website terms
- **Data Privacy**: Handle extracted data responsibly

### Technical Limitations
- **JavaScript-Heavy Sites**: Some dynamic content may not load
- **Anti-Bot Measures**: Some sites may block automated access
- **API Alternatives**: Consider official APIs when available

## 🔍 Validation

All inputs are validated:

- **First Name**: Minimum 2 characters, required
- **Last Name**: Minimum 2 characters, required  
- **Email**: Valid email format required (user@domain.com)
- **Output Directory**: Created automatically if doesn't exist

## 📞 Contact Information Detection

The tool automatically detects and extracts:

### Email Patterns
- Standard format: `user@domain.com`
- Various TLD formats: `.com`, `.org`, `.edu`, etc.
- Subdomain emails: `user@mail.domain.com`

### Phone Patterns
- US Format: `(555) 123-4567`
- Alternative formats: `555-123-4567`, `555.123.4567`
- International prefixes: `+1-555-123-4567`

### Social Media Platforms
Automatically detects links to 15+ platforms:
- **Professional**: LinkedIn
- **Social**: Facebook, Instagram, Twitter/X
- **Development**: GitHub
- **Video**: YouTube, TikTok
- **Messaging**: WhatsApp, Telegram, Discord
- **Other**: Pinterest, Snapchat, Reddit, Medium

## 🏆 Best Practices

1. **Verify Email Addresses**: Ensure valid email format for better results
2. **Use Detailed Mode**: For comprehensive analysis of important contacts
3. **Export to JSON**: For integration with other tools and analysis
4. **Respect Rate Limits**: Don't run multiple instances simultaneously
5. **Check Output Quality**: Review results for accuracy and completeness

## 🛠️ Development

### Building
```bash
npm run build     # Build for production
npm run dev       # Build with watch mode
```

### Testing
```bash
npm test          # Run test suite
npm run test:run  # Run tests once
```

## 📋 TODO / Future Enhancements

- [ ] Add support for more international phone formats
- [ ] Implement caching for repeated searches
- [ ] Add CSV export option
- [ ] Create web interface
- [ ] Add image analysis capabilities
- [ ] Implement OCR for text in images
- [ ] Add support for PDF content extraction
- [ ] Create API endpoint version

---

*Built with TypeScript, Puppeteer, and modern web scraping techniques.*
