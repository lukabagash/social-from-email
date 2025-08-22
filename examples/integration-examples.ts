/**
 * Integration examples showing how to use social-from-email in real applications
 */

import { 
  quickSearch, 
  searchAndAnalyzePerson,
  extractSocialLinks,
  validateEmail
} from '../src/api';

// Example 1: Lead Generation Tool
class LeadGenerator {
  private leads: Array<{
    name: string;
    email: string;
    enrichedData?: any;
    socialProfiles?: any[];
    confidence?: number;
  }> = [];

  async enrichLead(firstName: string, lastName: string, email: string) {
    console.log(`🔍 Enriching lead: ${firstName} ${lastName} (${email})`);
    
    try {
      const result = await quickSearch(firstName, lastName, email, 12); // 12 queries for lead generation
      
      const enrichedLead = {
        name: `${firstName} ${lastName}`,
        email,
        enrichedData: {
          title: result.analysis.identifiedPersons[0]?.personEvidence.title,
          company: result.analysis.identifiedPersons[0]?.personEvidence.company,
          location: result.analysis.identifiedPersons[0]?.personEvidence.location,
          skills: result.analysis.identifiedPersons[0]?.personEvidence.skills,
        },
        socialProfiles: result.analysis.identifiedPersons[0]?.personEvidence.socialProfiles || [],
        confidence: result.analysis.identifiedPersons[0]?.confidence || 0
      };
      
      this.leads.push(enrichedLead);
      console.log(`✅ Lead enriched with confidence: ${enrichedLead.confidence}%`);
      
      return enrichedLead;
      
    } catch (error) {
      console.error(`❌ Failed to enrich lead: ${error}`);
      return null;
    }
  }

  async enrichLeadList(leadList: Array<{firstName: string, lastName: string, email: string}>) {
    console.log(`📊 Enriching ${leadList.length} leads...`);
    
    const results: any[] = [];
    for (const lead of leadList) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting
      const enriched = await this.enrichLead(lead.firstName, lead.lastName, lead.email);
      if (enriched) results.push(enriched);
    }
    
    console.log(`✅ Enriched ${results.length}/${leadList.length} leads successfully`);
    return results;
  }

  getHighConfidenceLeads() {
    return this.leads.filter(lead => (lead.confidence || 0) > 70);
  }

  getLeadsWithLinkedIn() {
    return this.leads.filter(lead => 
      lead.socialProfiles?.some(profile => 
        profile.platform.toLowerCase().includes('linkedin')
      )
    );
  }
}

// Example 2: Contact Database Enrichment
class ContactEnricher {
  async enrichContactDatabase(contacts: Array<{id: string, email: string, firstName?: string, lastName?: string}>) {
    console.log(`📇 Enriching contact database with ${contacts.length} contacts`);
    
    const enrichedContacts: any[] = [];
    
    for (const contact of contacts) {
      if (!contact.firstName || !contact.lastName) {
        console.log(`⚠️ Skipping contact ${contact.id}: Missing name information`);
        continue;
      }
      
      if (!validateEmail(contact.email)) {
        console.log(`⚠️ Skipping contact ${contact.id}: Invalid email`);
        continue;
      }
      
      try {
        console.log(`🔍 Processing contact: ${contact.firstName} ${contact.lastName}`);
        
        const result = await searchAndAnalyzePerson(
          {
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email
          },
          {
            queryCount: 10,                // 10 queries for contact enrichment
            detailed: false,
            priority: 'professional'
          },
          {
            includeSocialLinks: true
          }
        );
        
        const mainPerson = result.analysis.identifiedPersons[0];
        
        enrichedContacts.push({
          ...contact,
          enrichment: {
            confidence: mainPerson?.confidence || 0,
            title: mainPerson?.personEvidence.title,
            company: mainPerson?.personEvidence.company,
            location: mainPerson?.personEvidence.location,
            phone: mainPerson?.personEvidence.phone,
            socialLinks: result.socialLinks?.consolidatedLinks || [],
            lastEnriched: new Date().toISOString()
          }
        });
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error(`❌ Failed to enrich contact ${contact.id}:`, error);
        enrichedContacts.push({
          ...contact,
          enrichment: {
            error: error instanceof Error ? error.message : 'Unknown error',
            lastAttempted: new Date().toISOString()
          }
        });
      }
    }
    
    return enrichedContacts;
  }
}

// Example 3: Social Media Research Tool
class SocialMediaResearcher {
  async researchPerson(firstName: string, lastName: string, email: string) {
    console.log(`🔬 Researching social media presence: ${firstName} ${lastName}`);
    
    try {
      // Focus on social-first search
      const result = await searchAndAnalyzePerson(
        { firstName, lastName, email },
        {
          priority: 'social-first',
          detailed: true,
          queryCount: 20
        },
        {
          includeSocialLinks: true,
          includeExtended: true
        }
      );
      
      const socialAnalysis = {
        subject: `${firstName} ${lastName}`,
        email,
        socialPresence: {
          totalPlatforms: result.socialLinks?.uniquePlatforms.length || 0,
          highConfidenceLinks: result.socialLinks?.highConfidenceLinks || [],
          platformBreakdown: result.socialLinks?.platformBreakdown || {}
        },
        professionalInfo: {
          currentTitle: result.analysis.identifiedPersons[0]?.personEvidence.title,
          currentCompany: result.analysis.identifiedPersons[0]?.personEvidence.company,
          skills: result.analysis.identifiedPersons[0]?.personEvidence.skills || [],
          achievements: result.analysis.identifiedPersons[0]?.personEvidence.achievements || []
        },
        digitalFootprint: {
          overallConfidence: result.analysis.analysis.mainPersonConfidence,
          sourcesAnalyzed: result.analysis.summary.totalSources,
          topDomains: result.analysis.summary.topDomains
        },
        recommendations: this.generateRecommendations(result)
      };
      
      return socialAnalysis;
      
    } catch (error) {
      console.error(`❌ Research failed:`, error);
      throw error;
    }
  }
  
  private generateRecommendations(result: any): string[] {
    const recommendations: string[] = [];
    const confidence = result.analysis.analysis.mainPersonConfidence;
    const socialLinks = result.socialLinks;
    
    if (confidence > 80) {
      recommendations.push("High confidence identification - reliable data for outreach");
    } else if (confidence > 50) {
      recommendations.push("Moderate confidence - verify key details before outreach");
    } else {
      recommendations.push("Low confidence - additional research recommended");
    }
    
    if (socialLinks?.highConfidenceLinks.length > 0) {
      recommendations.push("Strong social media presence detected - good for relationship building");
    }
    
    if (result.analysis.identifiedPersons[0]?.personEvidence.title) {
      recommendations.push("Professional title identified - customize messaging accordingly");
    }
    
    return recommendations;
  }
}

// Example 4: OSINT Investigation Helper
class OSINTInvestigator {
  async investigatePerson(firstName: string, lastName: string, email: string) {
    console.log(`🕵️ OSINT Investigation: ${firstName} ${lastName} (${email})`);
    
    try {
      // Comprehensive search with all features
      const result = await searchAndAnalyzePerson(
        { firstName, lastName, email },
        {
          queryCount: 25,                  // 25 queries for OSINT investigation
          priority: 'comprehensive',
          detailed: true,
          useAdvancedClustering: true
        },
        {
          includeExtended: true,
          includeTechnical: true,
          includeKeywords: true,
          includeSocialLinks: true
        }
      );
      
      const investigation = {
        subject: {
          name: `${firstName} ${lastName}`,
          email,
          investigationDate: new Date().toISOString()
        },
        identityAnalysis: {
          mainConfidence: result.analysis.analysis.mainPersonConfidence,
          likelySamePerson: result.analysis.analysis.likelyIsSamePerson,
          alternativeIdentities: result.analysis.identifiedPersons.length,
          clusteringMethod: result.analysis.analysis.clusteringMethod
        },
        digitalFootprint: {
          totalSources: result.analysis.summary.totalSources,
          domainSpread: result.analysis.summary.topDomains,
          socialPlatforms: result.socialLinks?.uniquePlatforms || [],
          keywordSignals: result.analysis.keywordAnalysis.topKeywords
        },
        personalInformation: this.extractPersonalInfo(result.analysis.identifiedPersons),
        professionalInformation: this.extractProfessionalInfo(result.analysis.identifiedPersons),
        socialIntelligence: {
          platformBreakdown: result.socialLinks?.platformBreakdown || {},
          bestSocialLinks: result.socialLinks?.highConfidenceLinks || []
        },
        investigationQuality: {
          dataReliability: result.analysis.analysis.mainPersonConfidence > 70 ? 'High' : result.analysis.analysis.mainPersonConfidence > 40 ? 'Medium' : 'Low',
          sourceDiversity: result.analysis.summary.topDomains.length,
          executionTime: result.executionTime
        }
      };
      
      return investigation;
      
    } catch (error) {
      console.error(`❌ Investigation failed:`, error);
      throw error;
    }
  }
  
  private extractPersonalInfo(persons: any[]) {
    if (persons.length === 0) return {};
    
    const mainPerson = persons[0].personEvidence;
    return {
      fullName: mainPerson.name,
      location: mainPerson.location,
      phone: mainPerson.phone,
      alternativeEmails: mainPerson.email !== mainPerson.email ? [mainPerson.email] : [],
      languages: mainPerson.languages || []
    };
  }
  
  private extractProfessionalInfo(persons: any[]) {
    if (persons.length === 0) return {};
    
    const mainPerson = persons[0].personEvidence;
    return {
      currentTitle: mainPerson.title,
      currentCompany: mainPerson.company,
      skills: mainPerson.skills || [],
      education: mainPerson.education || [],
      achievements: mainPerson.achievements || [],
      careerProgression: mainPerson.careerProgression || [],
      industryExpertise: mainPerson.industryExpertise || []
    };
  }
}

// Demo function to show all integrations
async function runIntegrationExamples() {
  console.log('🔧 Social From Email - Integration Examples');
  console.log('=' .repeat(60));
  
  // Demo 1: Lead Generation
  console.log('\n📈 Demo 1: Lead Generation Tool');
  const leadGen = new LeadGenerator();
  await leadGen.enrichLead('John', 'Smith', 'john.smith@techstartup.com');
  
  // Demo 2: Contact Enrichment (small sample)
  console.log('\n📇 Demo 2: Contact Database Enrichment');
  const enricher = new ContactEnricher();
  const sampleContacts = [
    { id: '1', firstName: 'Jane', lastName: 'Doe', email: 'jane.doe@company.com' }
  ];
  await enricher.enrichContactDatabase(sampleContacts);
  
  // Demo 3: Social Media Research
  console.log('\n🔬 Demo 3: Social Media Research');
  const researcher = new SocialMediaResearcher();
  await researcher.researchPerson('Mike', 'Johnson', 'mike.j@designstudio.com');
  
  console.log('\n✅ Integration examples completed!');
  console.log('\n💡 Integration Tips:');
  console.log('   • Implement rate limiting to respect websites');
  console.log('   • Cache results to avoid duplicate API calls');
  console.log('   • Validate inputs before processing');
  console.log('   • Handle errors gracefully in batch operations');
  console.log('   • Monitor API costs and execution times');
}

// Only run if this file is executed directly  
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationExamples().catch(console.error);
}export {
  LeadGenerator,
  ContactEnricher,
  SocialMediaResearcher,
  OSINTInvestigator,
  runIntegrationExamples
};
