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
    /**
     * Basic citation matching function similar to CitationModal's implementation
     */
    private basicCitationMatch(content: string): Array<{type: string, number: string, index: number}> {
        const matches: Array<{type: string, number: string, index: number}> = [];
        
        // Find footnote references [^1]
        const footnoteRegex = /\[\^(\d+)\]/g;
        let footnoteMatch: RegExpExecArray | null;
        while ((footnoteMatch = footnoteRegex.exec(content)) !== null) {
            const number = footnoteMatch[1];
            if (number) {
                matches.push({
                    type: 'footnote',
                    number,
                    index: footnoteMatch.index
                });
            }
        }
        
        // Find citations [1] (but not links [text](url))
        const citationRegex = /\[(\d+)\]/g;
        let citationMatch: RegExpExecArray | null;
        while ((citationMatch = citationRegex.exec(content)) !== null) {
            const number = citationMatch[1];
            if (number && !/\]\([^)]*$/.test(content.substring(0, citationMatch.index))) {
                matches.push({
                    type: 'citation',
                    number,
                    index: citationMatch.index
                });
            }
        }
        
        // Sort by position in document
        matches.sort((a, b) => a.index - b.index);
        return matches;
    }
    
    /**
     * Basic citation replacement function
     */
    private basicMatchAndReplace(content: string, targetNumber: string, hexId: string, isFootnote: boolean): string {
        const pattern = isFootnote ? `\\[\\^${targetNumber}\\]` : `\\[${targetNumber}\\]`;
        const regex = new RegExp(pattern, 'g');
        return content.replace(regex, `[^${hexId}]`);
    }

    public convertCitations(content: string, targetCitation?: string): CitationConversionResult {
        if (!content) {
            console.error('Content is empty or undefined');
            return { updatedContent: content || '', changed: false, stats: { citationsConverted: 0 } };
        }

        // Use the basic matcher implementation
        const basicMatches = this.basicCitationMatch(content);
        if (basicMatches.length === 0) {
            return { updatedContent: content, changed: false, stats: { citationsConverted: 0 } };
        }

        console.log(`Found ${basicMatches.length} basic citation matches`);
        let updatedContent = content;
        const processedNumbers = new Set<string>();
        let citationsConverted = 0;

        // Process each match in reverse order to avoid position shifting issues
        for (let i = basicMatches.length - 1; i >= 0; i--) {
            const match = basicMatches[i];
            if (!match) continue;
            
            if (targetCitation && match.number !== targetCitation) {
                continue;
            }

            // Skip if we've already processed this number
            if (processedNumbers.has(match.number)) {
                continue;
            }
            processedNumbers.add(match.number);

            try {
                // Generate a hex ID for this citation
                const hexId = crypto.randomBytes(4).toString('hex');
                
                // Replace all occurrences of this citation
                updatedContent = this.basicMatchAndReplace(
                    updatedContent, 
                    match.number, 
                    hexId, 
                    match.type === 'footnote'
                );
                
                citationsConverted++;
            } catch (error) {
                console.error(`Error processing citation ${match.number}:`, error);
            }
        }
        
        try {
            // Map to store URL to hex ID mappings
            const urlToHexMap = new Map<string, string>();
            const hexToUrlMap = new Map<string, string>();
            
            // First pass: Find all [number](url) patterns and replace with [^hex]
            // This handles citations that are adjacent to text or punctuation
            updatedContent = updatedContent.replace(/([^\s\[]|^)\[(\d+)\]\(([^)]+)\)/g, (_match, prefix, _number, url) => {
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
                // Add a space before the citation if it's not at the start of the line
                const space = prefix === '' ? '' : ' ';
                return `${prefix}${space}[^${hexId}]`;
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
