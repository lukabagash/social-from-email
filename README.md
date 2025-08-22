# Social From Email

🔍 **A comprehensive Node.js library for discovering social profiles and analyzing online presence from email addresses.**

Transform email addresses into rich social intelligence using advanced web scraping, machine learning clustering, and multi-engine search capabilities.

[![npm version](https://badge.fury.io/js/social-from-email.svg)](https://badge.fury.io/js/social-from-email)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js CI](https://github.com/lukabagash/social-from-email/workflows/Node.js%20CI/badge.svg)](https://github.com/lukabagash/social-from-email/actions)

## 🚀 Features

- **🔍 Multi-Engine Search**: DuckDuckGo, Google, Bing, Brave, and Yandex support
- **🕷️ Advanced Web Scraping**: Powered by Crawlee with retry logic and session management
- **🤖 ML-Powered Clustering**: HDBSCAN and Spectral clustering for person identification
- **📊 Social Media Detection**: LinkedIn, Twitter, Facebook, GitHub, and more
- **🎯 Intelligent Querying**: Priority-based search strategies (social-first, professional, comprehensive)
- **📈 Confidence Scoring**: AI-driven relevance and confidence metrics
- **🌐 Professional Discovery**: Company affiliations, job titles, and career progression
- **📱 Contact Information**: Phone numbers, alternative emails, and social handles
- **🔗 Link Extraction**: Comprehensive social media link discovery and validation

## 📦 Installation

```bash
npm install social-from-email
```

## 🎯 Quick Start

### Basic Usage

```typescript
import { quickSearch, comprehensiveSearch } from 'social-from-email';

// Quick search with basic features
const basicResult = await quickSearch('John', 'Doe', 'john@example.com', 5);
console.log('Found profiles:', basicResult.profiles.length);

// Comprehensive search with all features  
const fullResult = await comprehensiveSearch('Jane', 'Smith', 'jane@company.com', 10);
console.log('Analysis:', fullResult.analysis);
console.log('Social links:', fullResult.socialLinks);
```

### 🌟 Recommended: Extended Analysis for Link Discovery

**`performExtendedAnalysis`** is currently the **recommended function** for gathering comprehensive social media links and biographical insights:

```typescript
import { performExtendedAnalysis } from 'social-from-email';

const result = await performExtendedAnalysis(
  'John',        // firstName
  'Doe',         // lastName  
  'john@example.com', // email
  5              // queryCount (required)
);

// Access discovered links via supporting sources
result.supportingSources.forEach(source => {
  console.log('Found link:', source.url);
  console.log('Domain:', source.domain);
  console.log('Evidence:', source.evidence);
});

// Rich biographical analysis included
console.log('Career Stage:', result.biographicalAnalysis?.careerStage);
console.log('Digital Presence:', result.biographicalAnalysis?.digitalPresence);
```

**Key Benefits:**
- ✅ **Comprehensive link discovery** via `result.supportingSources`
- ✅ **Biographical intelligence** with career insights
- ✅ **Evidence-based results** with relevance scoring
- ✅ **All social platforms** automatically detected

💡 **Links are found in:** `result.supportingSources[].url` and `result.personEvidence.socialProfiles[]`

🔍 **For detailed usage examples, check the `examples/` folder**

### Advanced Examples

```typescript
import { searchAndAnalyzePerson, extractSocialLinks } from 'social-from-email';

// Fully configurable search
const result = await searchAndAnalyzePerson(
  { 
    firstName: 'John', 
    lastName: 'Doe', 
    email: 'john@example.com' 
  },
  { 
    queryCount: 15,  // REQUIRED parameter
    enableAdvancedClustering: true,
    enableKeywordExtraction: true 
  }
);

// Extract just social links
const socialLinks = await extractSocialLinks('Alice', 'Johnson', 'alice@company.com', 8);
console.log('Social profiles found:', socialLinks.length);
```

### Advanced Configuration

```typescript
import { searchAndAnalyzePerson } from 'social-from-email';

async function customSearch() {
  const result = await searchAndAnalyzePerson(
    {
      firstName: 'Alex',
      lastName: 'Johnson',
      email: 'alex.j@startup.io'
    },
    {
      // Search Options
      queryCount: 20,                    // Number of queries (REQUIRED)
      detailed: true,
      priority: 'professional',
      useAdvancedClustering: true
    },
    {
      // Analysis Options
      includeExtended: true,
      includeTechnical: true,
      includeKeywords: true,
      includeSocialLinks: true
    }
  );
  
  return result;
}
```

## 📚 API Reference

### Core Functions

#### `performExtendedAnalysis(firstName, lastName, email, queryCount)` 🌟 **RECOMMENDED**
**Best function for comprehensive link discovery and biographical analysis.**

**Parameters:**
- `firstName` (string): Person's first name
- `lastName` (string): Person's last name  
- `email` (string): Person's email address
- `queryCount` (number): Number of search queries to execute (REQUIRED)

**Returns:** `Promise<ExtendedAnalysisResult>`

**Key Features:**
- Comprehensive social media link discovery
- Biographical intelligence with career insights
- Supporting sources with evidence (`result.supportingSources[].url`)
- Professional analysis and digital presence assessment

#### `quickSearch(firstName, lastName, email, queryCount)`
Fast social profile discovery with default settings.

**Parameters:**
- `firstName` (string): Person's first name
- `lastName` (string): Person's last name  
- `email` (string): Person's email address
- `queryCount` (number): Number of search queries to execute (REQUIRED)

**Returns:** `Promise<PersonSearchResult>`

#### `comprehensiveSearch(firstName, lastName, email, queryCount)`
Complete analysis with all features enabled including ML clustering and keyword extraction.

**Parameters:**
- `firstName` (string): Person's first name
- `lastName` (string): Person's last name  
- `email` (string): Person's email address
- `queryCount` (number): Number of search queries to execute (REQUIRED)

**Returns:** `Promise<PersonSearchResult>`

#### `searchAndAnalyzePerson(person, searchOptions, analysisOptions?)`
Fully configurable search and analysis function.

**Parameters:**
- `person` (PersonSearchInput): Person details
- `searchOptions` (SearchOptions): Search configuration (queryCount is REQUIRED)
- `analysisOptions` (AnalysisOptions, optional): Analysis configuration

### Configuration Options

#### SearchOptions
```typescript
interface SearchOptions {
  queryCount?: number;           // Number of search queries (default: all)
  detailed?: boolean;            // Enhanced search depth (default: false)
  priority?: 'social-first' |    // Search strategy (default: 'social-first')
            'professional' | 
            'comprehensive';
  useAdvancedClustering?: boolean; // ML clustering (default: false)
}
```

#### AnalysisOptions
```typescript
interface AnalysisOptions {
  includeExtended?: boolean;     // Biographical insights (default: false)
  includeTechnical?: boolean;    // Technical metrics (default: false)  
  includeKeywords?: boolean;     // Keyword analysis (default: false)
  includeSocialLinks?: boolean;  // Social media extraction (default: false)
}
```

### Response Format

#### PersonSearchResult
```typescript
interface PersonSearchResult {
  analysis: PersonAnalysisResult;    // Main analysis results
  socialLinks?: SocialLinkSummary;   // Social media links (if requested)
  crawleeData: CrawleeScrapedData[]; // Raw scraped data
  executionTime: number;             // Execution time in milliseconds
  metadata: {
    searchEngine: string;            // Search engine used
    scrapingEngine: string;          // Scraping engine used
    options: SearchOptions & AnalysisOptions;
    queriesExecuted: number;         // Number of queries executed
    uniqueResults: number;           // Unique search results found
    scrapedSuccessfully: number;     // Successfully scraped pages
  };
}
```

#### ExtendedAnalysisResult 🌟 **For performExtendedAnalysis**
```typescript
interface ExtendedAnalysisResult {
  personConfidence: number;              // Overall confidence score (0-100)
  totalSources: number;                  // Total sources analyzed
  supportingSources: SupportingSource[]; // 🔗 Links found here (source.url)
  
  // Biographical insights
  biographicalAnalysis: {
    careerStage: string;                 // Career phase (entry, mid, senior)
    seniorityLevel: string;              // Professional seniority
    educationLevel: string;              // Education background
    thoughtLeadership: string;           // Leadership assessment
    digitalPresence: string;             // Online presence level
    geographicMobility: string;          // Location patterns
    industryExpertise: string[];         // Expertise areas
  } | null;
  
  biographicalIntelligenceSummary: {
    careerStage?: string;
    professionalLevel?: string;
    educationLevel?: string;
    achievementsCount?: number;
    socialPresenceScore?: number;
    biographicalConfidence?: number;
  } | null;
  
  personEvidence: PersonEvidence;        // Detailed person data
  metadata: {
    searchEngine: string;
    scrapingEngine: string;
    queriesExecuted: number;
    executionTime: number;
    enhancementMethod?: string;
  };
}
```

#### SupportingSource 🔗 **Where links are found**
```typescript
interface SupportingSource {
  index: number;
  title: string;
  url: string;                           // 🎯 The discovered link/URL
  domain: string;
  relevanceScore: number;
  enhancementMethod: string;
  snippet: string;
  evidence: {                            // Evidence found on this source
    [key: string]: string | string[];
  };
}
```

#### PersonAnalysisResult
```typescript
interface PersonAnalysisResult {
  identifiedPersons: PersonCluster[];  // Identified person clusters
  mainPersonConfidence: number;        // Main identity confidence (0-100)
  alternativePersons: PersonCluster[]; // Alternative identities
  summary: {
    totalSources: number;
    highConfidenceSources: number;
    topDomains: DomainCount[];
    keywordAnalysis?: ExtractedKeywords;
  };
}
```

#### PersonCluster
```typescript
interface PersonCluster {
  confidence: number;              // Confidence score (0-100)
  personEvidence: PersonEvidence; // Collected evidence
  sources: SourceEvidence[];      // Supporting sources
}
```

#### PersonEvidence
```typescript
interface PersonEvidence {
  name?: string;
  email?: string;
  location?: string;
  title?: string;
  company?: string;
  phone?: string;
  socialProfiles?: SocialProfile[];
  websites?: string[];
  affiliations?: string[];
  skills?: string[];
  education?: string[];
  achievements?: string[];
  careerProgression?: string[];
  industryExpertise?: string[];
  publications?: string[];
  languages?: string[];
}
```

## 📁 Examples

Detailed usage examples are available in the `examples/` folder:

### `examples/extended-analysis.ts` 🌟 **RECOMMENDED**
Complete example using `performExtendedAnalysis` for comprehensive link discovery and biographical analysis. Shows how to:
- Extract all discovered links from `result.supportingSources`
- Access social profiles by platform
- Display biographical intelligence insights
- Organize links by domain and relevance

Run the example:
```bash
npx tsx examples/extended-analysis.ts
```

**Key Learning Points:**
- Links are found in `result.supportingSources[].url`
- Social profiles organized by platform in `result.personEvidence.socialProfiles`
- Evidence details available in `source.evidence` for each supporting source
- Biographical analysis provides career stage, digital presence, and professional insights

## 🎛️ CLI Usage

The package also includes a powerful command-line interface:

```bash
# Install globally for CLI access
npm install -g social-from-email

# Basic usage (requires 4 parameters: firstName, lastName, email, queryCount)
hybrid-person-analysis "John" "Doe" "john.doe@company.com" 10

# Advanced usage with options
hybrid-person-analysis "Jane" "Smith" "jane@company.com" 15 \
  --detailed \
  --priority=social-first \
  --advanced-clustering \
  --extended \
  --social-links \
  --export-social=jane-social-links.json
```

### CLI Options

- `--detailed`: Enhanced search with more comprehensive analysis
- `--extended`: Show biographical insights, career progression, social metrics
- `--technical`: Show detailed technical metrics, quality scores, status codes  
- `--keywords`: Show detailed keyword analysis and topic extraction
- `--social-links`: Extract and display comprehensive social media links
- `--export-social=FILE`: Export social links to JSON file
- `--advanced-clustering`: Use ML-based clustering algorithms (HDBSCAN, Spectral)
- `--priority=MODE`: Search optimization mode
  - `social-first`: Prioritize social media platforms (default)
  - `professional`: Focus on professional/business platforms
  - `comprehensive`: Use all available search patterns

## 🔧 Advanced Usage

### Social Links Extraction

```typescript
import { extractSocialLinks, exportSocialLinksToFile } from 'social-from-email';

async function getSocialProfiles() {
  // Extract only social links
  const socialSummary = await extractSocialLinks(
    'Mark',
    'Wilson', 
    'mark.wilson@design-agency.com'
  );
  
  console.log('Total social links found:', socialSummary.totalSocialLinks);
  console.log('High confidence links:', socialSummary.highConfidenceLinks);
  console.log('Platform breakdown:', socialSummary.platformBreakdown);
  
  // Export to JSON file
  exportSocialLinksToFile(socialSummary, './mark-wilson-social.json');
}
```

### Validation

```typescript
import { validateEmail, validatePersonInput } from 'social-from-email';

// Validate email format
const isValid = validateEmail('test@example.com'); // true

// Validate person input
const validation = validatePersonInput({
  firstName: 'J',
  lastName: 'D', 
  email: 'invalid-email'
});

if (!validation.valid) {
  console.log('Errors:', validation.errors);
  // ['First name must be at least 2 characters long', 
  //  'Last name must be at least 2 characters long',
  //  'Email must be a valid email address']
}
```

### Using Individual Components

```typescript
import { 
  UltimateCrawlerEngine,
  EnhancedCrawleeEngine,
  PersonAnalyzer,
  SiteDiscoveryEngine
} from 'social-from-email';

async function customWorkflow() {
  // Initialize individual components
  const crawler = new UltimateCrawlerEngine();
  const scraper = new EnhancedCrawleeEngine();
  const analyzer = new PersonAnalyzer('John', 'Doe', 'john@example.com');
  
  await crawler.initialize();
  await scraper.initialize();
  
  // Custom search workflow
  const searchResults = await crawler.searchPerson('John', 'Doe', 'john@example.com');
  const scrapedData = await scraper.scrapeUrls(searchResults.map(r => r.url));
  const analysis = await analyzer.analyzePersons(searchResults, scrapedData);
  
  // Cleanup
  await crawler.close();
  await scraper.close();
  
  return analysis;
}
```

## 🏗️ Architecture

### Hybrid Engine Approach

The library uses a **hybrid architecture** that combines the strengths of multiple technologies:

1. **Ultimate Crawler Engine**: Multi-engine search across DuckDuckGo, Google, Bing, Brave, and Yandex
2. **Crawlee Scraping**: Advanced web scraping with retry logic, session management, and resource optimization
3. **ML-Powered Analysis**: HDBSCAN and Spectral clustering for intelligent person identification
4. **Intelligent Querying**: Priority-based search strategies optimized for different use cases

### Search Strategies

- **Social-First**: Prioritizes social media platforms for personal branding and social presence discovery
- **Professional**: Focuses on business profiles, LinkedIn, company websites, and professional networks  
- **Comprehensive**: Combines both approaches with news, interviews, and general web presence

### Clustering & Analysis

- **Rule-Based Clustering**: Fast, deterministic clustering based on name, email, and domain matching
- **ML Clustering**: Advanced HDBSCAN and Spectral clustering for complex identity resolution
- **Confidence Scoring**: AI-driven confidence metrics based on source reliability and evidence strength

## 🛠️ Development

### Building the Project

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Development mode
npm run dev
```

### Project Structure

```
src/
├── api.ts                          # Main API exports
├── index.ts                        # Library exports
├── cli-hybrid-person-analysis.ts   # CLI interface
├── hybrid-search/                  # Multi-engine search
├── crawlee/                        # Advanced web scraping
├── person-analysis/                # ML-powered analysis
├── advanced-clustering/            # HDBSCAN & Spectral clustering
├── advanced-nlp/                   # Keyword & entity extraction
├── utils/                          # Utility functions
└── web-scraper/                    # General scraping utilities
```

## 📋 Requirements

- **Node.js**: 18.0.0 or higher
- **TypeScript**: 5.0+ (for development)
- **Dependencies**: See package.json for complete list

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

ISC License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/lukabagash/social-from-email)
- [npm Package](https://www.npmjs.com/package/social-from-email)
- [Issues & Bug Reports](https://github.com/lukabagash/social-from-email/issues)

## ⚡ Performance

- **Average Search Time**: 10-30 seconds depending on query complexity
- **Supported Engines**: 5 search engines with automatic fallback
- **Concurrent Scraping**: Up to 3 concurrent requests with intelligent rate limiting  
- **Memory Efficient**: Streaming processing and automatic cleanup
- **Retry Logic**: Intelligent retry with exponential backoff

## 🎯 Use Cases

- **Lead Generation**: Discover social profiles for sales prospects
- **Background Research**: Gather professional information for recruiting
- **Social Intelligence**: Analyze online presence and digital footprint
- **Contact Enrichment**: Enhance existing contact databases with social data
- **Competitive Analysis**: Research competitors and industry professionals
- **OSINT Investigations**: Open-source intelligence gathering
- **Marketing Research**: Understand target audience social behavior

---

**Happy Social Hunting!** 🚀