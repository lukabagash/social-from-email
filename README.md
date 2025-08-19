# Social From Email + Google Search

This project helps you find social profiles and other information about people using their email address and name. It includes both social media heuristics (from the original project) and a powerful Google search system.

## Features

### Original Social Media Discovery
- **Gravatar**: Extract profile information from Gravatar
- **Heuristics**: Generate likely social media URLs based on email patterns

### New Google Search System 🆕
- **Google Search**: Search Google for person's name, email, and social profiles
- **Multi-platform search**: Automatically searches LinkedIn, Twitter, Facebook, Instagram
- **Domain-specific search**: Searches within company domains based on email
- **Detailed mode**: Runs multiple search variations for comprehensive results

## Installation

```bash
npm install
npm run build
```

## Usage

### Basic Social Media Discovery
```bash
# Original functionality - finds social profiles via Gravatar and heuristics
node dist/cli.cjs email@example.com FirstName LastName
```

### Google Search
```bash
# Basic Google search
node dist/cli-search.cjs FirstName LastName email@example.com

# Detailed search with multiple variations
node dist/cli-search.cjs FirstName LastName email@example.com --detailed
```

### Examples

#### Basic search:
```bash
node dist/cli-search.cjs Luka Bagashvili bagash_l2@denison.edu
```

#### Detailed search (recommended):
```bash
node dist/cli-search.cjs Luka Bagashvili bagash_l2@denison.edu --detailed
```

## Sample Output

The Google search will show:
- **Profile links** from LinkedIn, Facebook, Instagram, Twitter
- **Company/school pages** based on email domain
- **Personal websites** and portfolios
- **Domain summary** showing where most results were found

## Environment Variables

Create a `.env` file if you need to configure any settings:
```
# Currently no special environment variables needed for Google search
```

## How It Works

### Google Search Process
1. **Initialize** headless Chrome browser with realistic settings
2. **Search variations** including:
   - Basic name search
   - Name + email search  
   - Domain-specific searches (e.g., site:denison.edu)
   - Social platform searches (LinkedIn, Twitter, etc.)
3. **Extract results** including titles, URLs, snippets, and domains
4. **Deduplicate** and organize results
5. **Summarize** by domain for easy analysis

### Anti-Detection Features
- Realistic user agent
- Standard viewport size
- Removes automation detection
- Delays between searches
- Handles cookie consent dialogs

## Development

```bash
# Development mode with auto-rebuild
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Dependencies

- **Puppeteer**: For browser automation and web scraping
- **TypeScript**: For type safety
- **dotenv**: For environment variable management

## Notes

- The Google search respects rate limits with built-in delays
- Results may vary based on Google's search algorithms and privacy settings
- Some profiles may not be publicly accessible
- The tool is designed for legitimate research and networking purposes
