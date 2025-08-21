// Core exports for enhanced person analysis workflow
export { UltimateCrawlerEngine } from "./hybrid-search/ultimate-scraper";
export { GeneralWebScraper } from "./web-scraper/general-scraper";
export { PersonAnalyzer } from "./person-analysis/enhanced-analyzer";
export { SiteDiscoveryEngine } from "./site-discovery/site-finder";
export { AdvancedPersonClusterer } from "./advanced-clustering/advanced-clusterer";
export { AdvancedInfoExtractor } from "./advanced-nlp/keyword-extractor";
export { EnhancedKeywordExtractor } from "./advanced-nlp/enhanced-keyword-extractor";

// Crawlee-enhanced exports
export { EnhancedCrawleeEngine } from "./crawlee/enhanced-crawler";
export { CrawleeSearchEngine } from "./crawlee-search/search-engine";

// Type exports
export type { 
  GoogleSearchResult,
  UltimateSearchOptions 
} from "./hybrid-search/ultimate-scraper";

export type { 
  ScrapedData,
  ScrapingOptions 
} from "./web-scraper/general-scraper";

export type { 
  PersonAnalysisResult,
  PersonCluster,
  PersonEvidence 
} from "./person-analysis/enhanced-analyzer";

export type { 
  SiteDiscoveryResult 
} from "./site-discovery/site-finder";

export type { 
  ExtractedKeywords 
} from "./advanced-nlp/keyword-extractor";

export type { 
  PersonBio 
} from "./advanced-nlp/enhanced-keyword-extractor";

export type { 
  ClusteringResult 
} from "./advanced-clustering/advanced-clusterer";

// Crawlee type exports
export type {
  CrawleeScrapedData,
  CrawleeOptions
} from "./crawlee/enhanced-crawler";

export type {
  SearchEngineResult,
  CrawleeSearchOptions
} from "./crawlee-search/search-engine";