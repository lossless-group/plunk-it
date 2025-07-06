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
     * Convert all citations to random hex format
     * @param content - The markdown content to process
     * @returns Object with updated content and statistics
     */
    public convertCitations(content: string): CitationConversionResult {
        let updatedContent = content;
        let citationsConverted = 0;
        const citationMap = new Map<string, string>(); // Maps original ID to hex ID
        
        // First pass: collect all citations and generate hex IDs
        const collectCitations = (match: string, _prefix: string, id: string) => {
            // Only process if it's a numeric ID and we haven't seen it before
            if (/^\d+$/.test(id) && !citationMap.has(id)) {
                citationMap.set(id, this.generateHexId());
            }
            return match; // Don't modify yet
        };
        
        // Collect numeric citations [^1]
        updatedContent = updatedContent.replace(/\[\^(\d+)\]/g, collectCitations);
        
        // Collect plain numeric citations [1] (only if not part of a link)
        updatedContent = updatedContent.replace(/\[(\d+)\]/g, (match, id, offset) => {
            // Only collect if it's a single digit and not part of a link
            if (/^\d+$/.test(id) && !/\]\([^)]*$/.test(updatedContent.substring(0, offset))) {
                return collectCitations(match, '', id);
            }
            return match;
        });

        // Second pass: replace all collected citations with their hex equivalents
        citationMap.forEach((hexId, originalId) => {
            try {
                // Replace [^1] style citations
                updatedContent = updatedContent.replace(
                    new RegExp(`\\[\\^${originalId}\\]`, 'g'), 
                    `[^${hexId}]`
                );
                
                // Replace [1] style citations (only if not part of a link)
                updatedContent = updatedContent.replace(
                    new RegExp(`(^|[^\\])\\[${originalId}\\]`, 'g'),
                    `$1[^${hexId}]`
                );
                
                citationsConverted++;
            } catch (error) {
                console.error(`Error processing citation ${originalId}:`, error);
            }
        });

        return {
            updatedContent,
            changed: citationsConverted > 0,
            stats: {
                citationsConverted
            }
        };
    }
}

// Export a singleton instance
export const citationService = new CitationService();
