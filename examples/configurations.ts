/**
 * Example configuration for different use cases
 */

import { SearchOptions, AnalysisOptions } from '../src/api';

// Configuration presets for different use cases

// 1. Quick Lead Generation
export const leadGenerationConfig = {
  search: {
    queryCount: 10,
    detailed: false,
    priority: 'professional' as const,
    useAdvancedClustering: false
  } as SearchOptions,
  analysis: {
    includeSocialLinks: true,
    includeExtended: false,
    includeTechnical: false,
    includeKeywords: false
  } as AnalysisOptions
};

// 2. Social Media Research
export const socialMediaConfig = {
  search: {
    queryCount: 15,
    detailed: true,
    priority: 'social-first' as const,
    useAdvancedClustering: false
  } as SearchOptions,
  analysis: {
    includeSocialLinks: true,
    includeExtended: true,
    includeTechnical: false,
    includeKeywords: true
  } as AnalysisOptions
};

// 3. OSINT Investigation
export const osintConfig = {
  search: {
    queryCount: 25,
    detailed: true,
    priority: 'comprehensive' as const,
    useAdvancedClustering: true
  } as SearchOptions,
  analysis: {
    includeSocialLinks: true,
    includeExtended: true,
    includeTechnical: true,
    includeKeywords: true
  } as AnalysisOptions
};

// 4. Contact Database Enrichment
export const contactEnrichmentConfig = {
  search: {
    queryCount: 8,
    detailed: false,
    priority: 'professional' as const,
    useAdvancedClustering: false
  } as SearchOptions,
  analysis: {
    includeSocialLinks: false,
    includeExtended: false,
    includeTechnical: false,
    includeKeywords: false
  } as AnalysisOptions
};

// 5. High-Performance (Fast) Search
export const fastSearchConfig = {
  search: {
    queryCount: 5,
    detailed: false,
    priority: 'social-first' as const,
    useAdvancedClustering: false
  } as SearchOptions,
  analysis: {
    includeSocialLinks: true,
    includeExtended: false,
    includeTechnical: false,
    includeKeywords: false
  } as AnalysisOptions
};

// 6. Maximum Accuracy (Slow but thorough)
export const maxAccuracyConfig = {
  search: {
    detailed: true,
    priority: 'comprehensive' as const,
    useAdvancedClustering: true
  } as SearchOptions,
  analysis: {
    includeSocialLinks: true,
    includeExtended: true,
    includeTechnical: true,
    includeKeywords: true
  } as AnalysisOptions
};

// Usage examples with configurations
export const configurationExamples = {
  leadGeneration: leadGenerationConfig,
  socialMedia: socialMediaConfig,
  osint: osintConfig,
  contactEnrichment: contactEnrichmentConfig,
  fastSearch: fastSearchConfig,
  maxAccuracy: maxAccuracyConfig
};

// Helper function to get config by use case
export function getConfigForUseCase(useCase: keyof typeof configurationExamples) {
  return configurationExamples[useCase];
}

// Performance vs Accuracy trade-off guide
export const performanceGuide = {
  fastest: {
    description: "Quickest results, basic information only",
    estimatedTime: "5-10 seconds",
    config: fastSearchConfig
  },
  balanced: {
    description: "Good balance of speed and accuracy",
    estimatedTime: "15-25 seconds", 
    config: leadGenerationConfig
  },
  comprehensive: {
    description: "Maximum information extraction",
    estimatedTime: "30-60 seconds",
    config: maxAccuracyConfig
  }
};

export default configurationExamples;
