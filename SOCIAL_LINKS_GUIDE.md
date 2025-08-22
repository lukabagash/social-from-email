# Social Media Links Extraction - User Guide

## Overview

Your OSINT tool has been enhanced with comprehensive social media link extraction capabilities. The tool can now find, analyze, and present social media profiles associated with a person with confidence levels and detailed analytics.

## Available Tools

### 1. Full Hybrid Analysis (Recommended)
**Command:** `node dist/cli-hybrid-person-analysis.cjs`

**Usage:**
```bash
node dist/cli-hybrid-person-analysis.cjs "FirstName" "LastName" "email@domain.com" [queryCount] [options]
```

**Example:**
```bash
node dist/cli-hybrid-person-analysis.cjs "Jed" "Burdick" "jed@votaryfilms.com" 8 --detailed --social-links --export-social=results.json
```

**Key Features:**
- ✅ Complete person analysis + social media extraction
- ✅ Confidence levels (High: >70%, Medium: 40-70%, Low: <40%)
- ✅ Platform breakdown and statistics
- ✅ JSON export capability
- ✅ Consolidated and ranked results
- ✅ Best links per platform identification

**Available Flags:**
- `--social-links`: Enable comprehensive social media extraction
- `--export-social=FILE.json`: Export results to JSON file
- `--detailed`: Enhanced search analysis
- `--extended`: Show biographical insights and social metrics
- `--technical`: Show detailed technical metrics
- `--keywords`: Show keyword analysis
- `--priority=social-first`: Prioritize social media platforms (default)

### 2. Quick Social Finder (Fast & Focused)
**Command:** `node dist/quick-social-finder.cjs`

**Usage:**
```bash
node dist/quick-social-finder.cjs "FirstName" "LastName" "email@domain.com" [queryCount]
```

**Example:**
```bash
node dist/quick-social-finder.cjs "Jed" "Burdick" "jed@votaryfilms.com" 6
```

**Key Features:**
- ⚡ Optimized for speed (15-30 seconds)
- 🎯 Returns only most relevant social links
- 🔍 Filters out generic/irrelevant URLs
- 📊 Shows confidence and relevance scores
- 🏆 Perfect for quick lookups

## What You Get

### Social Link Information
Each social media link includes:
- **Platform**: LinkedIn, Twitter, Facebook, Instagram, YouTube, etc.
- **URL**: Direct link to the profile
- **Username**: Handle/username (when available)
- **Confidence Level**: 0-100% (how sure we are this belongs to the person)
- **Relevance Score**: 0-100% (how relevant the source is)
- **Person ID**: Which identified person this belongs to
- **Source Count**: Number of sources that contributed to this finding
- **Verification Status**: If the profile is verified ✅
- **Social Metrics**: Followers, following, posts, engagement (when available)

### Output Formats

#### 1. Console Output
```
🔗 SOCIAL MEDIA LINKS SUMMARY
📊 Overview:
   Total Social Links Found: 76
   🟢 High Confidence (>70%): 76
   🟡 Medium Confidence (40-70%): 0
   🔴 Low Confidence (<40%): 0
   🌐 Unique Platforms: 5

🎯 RECOMMENDED SOCIAL LINKS (Consolidated & Ranked):
1. 🟢 YOUTUBE
   🌐 URL: https://www.youtube.com/@jedburdick
   📊 Confidence: 100% | Relevance: 80%
   👤 Person: person_1 | Sources: 28
   🏷️  Username: @jedburdick
```

#### 2. JSON Export
```json
{
  "summary": {
    "totalSocialLinks": 76,
    "highConfidenceCount": 76,
    "mediumConfidenceCount": 0,
    "lowConfidenceCount": 0,
    "uniquePlatforms": ["youtube", "facebook", "twitter", "linkedin", "instagram"],
    "platformBreakdown": {
      "youtube": 9,
      "facebook": 56,
      "twitter": 2,
      "linkedin": 2,
      "instagram": 7
    }
  },
  "consolidatedLinks": [
    {
      "platform": "YouTube",
      "url": "https://www.youtube.com/@jedburdick",
      "username": "@jedburdick",
      "confidence": 100,
      "personId": "person_1",
      "sourceCount": 28,
      "relevanceScore": 80
    }
  ]
}
```

## Confidence Level Guide

### 🟢 High Confidence (>70%)
- **Meaning**: Very likely belongs to the target person
- **Recommendation**: Safe to use for contact/research
- **Typical indicators**: Email match, name match, domain match, multiple source confirmation

### 🟡 Medium Confidence (40-70%)
- **Meaning**: Possibly belongs to the target person
- **Recommendation**: Verify before using
- **Typical indicators**: Partial name match, similar domain, limited sources

### 🔴 Low Confidence (<40%)
- **Meaning**: Uncertain if belongs to the target person
- **Recommendation**: Requires manual verification
- **Typical indicators**: Common name, minimal evidence, single source

## Best Practices

### 1. Start with Quick Finder
```bash
# Quick 30-second search
node dist/quick-social-finder.cjs "John" "Doe" "john@company.com" 6
```

### 2. Full Analysis for Comprehensive Results
```bash
# Detailed analysis with export
node dist/cli-hybrid-person-analysis.cjs "John" "Doe" "john@company.com" 10 --social-links --export-social=john-doe-social.json --extended
```

### 3. Focus on High Confidence Links
- Always prioritize 🟢 High Confidence (>70%) results
- Use 🟡 Medium Confidence as secondary options
- Manually verify 🔴 Low Confidence results

### 4. Platform-Specific Strategies
- **LinkedIn**: Best for professional contacts
- **Twitter**: Good for public communications
- **Facebook**: Personal connections (respect privacy)
- **Instagram**: Visual content and lifestyle
- **YouTube**: Content creation and business

### 5. Export for Further Analysis
```bash
# Export and process with other tools
node dist/cli-hybrid-person-analysis.cjs "Jane" "Smith" "jane@example.com" 8 --social-links --export-social=results.json

# The JSON can be imported into spreadsheets, databases, or other tools
```

## Performance Tips

1. **Query Count**: 
   - Use 6-8 queries for quick results (15-30 seconds)
   - Use 10-15 queries for comprehensive results (30-60 seconds)

2. **Priority Mode**:
   - `--priority=social-first` (default) for social media focus
   - `--priority=professional` for business platforms
   - `--priority=comprehensive` for everything

3. **Network Considerations**:
   - Some LinkedIn URLs may be blocked (this is normal)
   - The tool automatically retries and uses fallbacks
   - Results are still comprehensive despite some blocked sources

## Troubleshooting

### Common Issues
1. **No results found**: Try increasing query count or using comprehensive priority
2. **LinkedIn blocked**: Normal behavior, other sources compensate
3. **Low confidence results**: Common with very common names

### Error Messages
- `❌ No relevant social media links found`: Increase query count or check input
- `❌ Invalid email`: Ensure email format is correct
- `❌ Name too short`: Names must be at least 2 characters

## Integration with Other Tools

The JSON export format is designed to integrate with:
- CRM systems
- OSINT frameworks
- Spreadsheet applications
- Database imports
- Custom analysis scripts

## Legal and Ethical Considerations

⚠️ **Important**: 
- Respect privacy and platform terms of service
- Use only for legitimate research/contact purposes
- Verify information before taking action
- Be aware of local privacy laws (GDPR, CCPA, etc.)

---

## Quick Reference Commands

```bash
# Quick social media search (fast)
node dist/quick-social-finder.cjs "Name" "Surname" "email@domain.com" 6

# Full analysis with social links
node dist/cli-hybrid-person-analysis.cjs "Name" "Surname" "email@domain.com" 8 --social-links

# Export to JSON for further processing
node dist/cli-hybrid-person-analysis.cjs "Name" "Surname" "email@domain.com" 10 --social-links --export-social=results.json

# Maximum detail analysis
node dist/cli-hybrid-person-analysis.cjs "Name" "Surname" "email@domain.com" 15 --detailed --social-links --extended --technical --export-social=full-results.json
```
