import * as crypto from 'crypto';

export interface CitationConversionResult {
    updatedContent: string;
    changed: boolean;
    stats: {
        citationsConverted: number;
    };
}

export class CitationService {
    /**
     * Generate a random hex ID of specified length
     * @param length - Length of the hex ID to generate (default: 6)
     * @returns Random hex string
     */
    public generateHexId(length: number = 6): string {
        return crypto.randomBytes(Math.ceil(length / 2))
            .toString('hex')
            .slice(0, length);
    }

    /**
     * Convert citations to random hex format
     * @param content - The markdown content to process
     * @param targetCitation - Optional specific citation to convert (e.g., '[1]' or '[^1]')
     * @returns Object with updated content and statistics
     */
    public convertCitations(content: string, targetCitation?: string): CitationConversionResult {
        if (!content) {
            console.error('Content is empty or undefined');
            return { updatedContent: content || '', changed: false, stats: { citationsConverted: 0 } };
        }

        let updatedContent = content;
        let citationsConverted = 0;
        
        // If we have a target citation, we'll handle it specifically
        if (targetCitation) {
            console.warn('Targeted citation conversion not yet implemented for URL-based citations');
            return { updatedContent, changed: false, stats: { citationsConverted: 0 } };
        }
        
        try {
            // Map to store URL to hex ID mappings
            const urlToHexMap = new Map<string, string>();
            const hexToUrlMap = new Map<string, string>();
            
            // First pass: Find all [number](url) patterns and replace with [^hex]
            updatedContent = updatedContent.replace(/\[(\d+)\]\(([^)]+)\)/g, (match, number, url) => {
                let hexId: string;
                
                // If we've seen this URL before, use the existing hex ID
                if (urlToHexMap.has(url)) {
                    hexId = urlToHexMap.get(url)!;
                } else {
                    // Generate a new hex ID for this URL
                    hexId = this.generateHexId();
                    urlToHexMap.set(url, hexId);
                    hexToUrlMap.set(hexId, url);
                }
                
                citationsConverted++;
                return ` [^${hexId}]`; // Add space before citation for better formatting
            });
            
            // If we found any citations, add the footnotes section
            if (citationsConverted > 0) {
                // Check if footnotes section already exists
                const hasFootnotesSection = /\n#+\s*Footnotes\s*\n/.test(updatedContent);
                
                // If no footnotes section exists, add one
                if (!hasFootnotesSection) {
                    updatedContent += '\n\n# Footnotes\n';
                } else {
                    updatedContent += '\n';
                }
                
                // Add all footnote definitions
                hexToUrlMap.forEach((url, hexId) => {
                    // Check if this footnote is already defined
                    const footnoteRegex = new RegExp(`\\[\\^${hexId}\\]:.*`, 'g');
                    if (!footnoteRegex.test(updatedContent)) {
                        updatedContent += `\n[^${hexId}]: ${url}`;
                    }
                });
            }

            return {
                updatedContent,
                changed: citationsConverted > 0,
                stats: {
                    citationsConverted
                }
            };
        } catch (error) {
            console.error('Error processing citations:', error);
            return { 
                updatedContent: content, // Return original content on error
                changed: false, 
                stats: { citationsConverted: 0 } 
            };
        }
    }
}

// Export a singleton instance
export const citationService = new CitationService();
