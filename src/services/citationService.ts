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
     * Enhanced citation matching function that handles multiple citation formats
     */
    private basicCitationMatch(content: string): Array<{
        type: 'footnote' | 'reference' | 'perplexity';
        number: string;
        index: number;
        original: string;
        lineContent: string;
    }> {
        const matches: Array<{
            type: 'footnote' | 'reference' | 'perplexity';
            number: string;
            index: number;
            original: string;
            lineContent: string;
        }> = [];
        
        // Split content into lines to handle Perplexity-style footnotes
        const lines = content.split('\n');
        let currentPosition = 0;
        
        for (const line of lines) {
            // 1. Check for Perplexity-style footnotes (e.g., "1. [https://...]")
            const perplexityMatch = line.match(/^(\d+)\.\s+\[(https?:\/\/[^\]]+)\]/);
            if (perplexityMatch && perplexityMatch[1] && perplexityMatch[0]) {
                matches.push({
                    type: 'perplexity',
                    number: perplexityMatch[1],
                    original: perplexityMatch[0],
                    index: currentPosition + line.indexOf(perplexityMatch[0]),
                    lineContent: line
                });
            }
            
            // 2. Find standard footnote references [^1]
            const footnoteRegex = /\[\^(\d+)\]/g;
            let footnoteMatch;
            while ((footnoteMatch = footnoteRegex.exec(line)) !== null) {
                if (footnoteMatch[1] && footnoteMatch[0]) {
                    matches.push({
                        type: 'footnote',
                        number: footnoteMatch[1],
                        original: footnoteMatch[0],
                        index: currentPosition + (footnoteMatch.index || 0),
                        lineContent: line
                    });
                }
            }
            
            // 3. Find standard citations [1] (but not links [text](url))
            const citationRegex = /\[(\d+)\]/g;
            let citationMatch;
            while ((citationMatch = citationRegex.exec(line)) !== null) {
                // Skip if it's part of a markdown link
                if (citationMatch[1] && citationMatch[0] && 
                    !/\]\([^)]*$/.test(line.substring(0, citationMatch.index || 0))) {
                    matches.push({
                        type: 'reference',
                        number: citationMatch[1],
                        original: citationMatch[0],
                        index: currentPosition + (citationMatch.index || 0),
                        lineContent: line
                    });
                }
            }
            
            // Update position for the next line
            currentPosition += line.length + 1; // +1 for the newline character
        }
        
        return matches;
    }
    
    /**
     * Enhanced citation replacement function
     */
    private basicMatchAndReplace(
        content: string, 
        targetNumber: string, 
        hexId: string, 
        matchType: 'footnote' | 'reference' | 'perplexity' = 'reference',
        lineContent: string = ''
    ): string {
        if (matchType === 'perplexity' && lineContent) {
            // For Perplexity-style footnotes, replace the entire line with a footnote reference
            const url = lineContent.match(/^(\d+)\.\s+\[(https?:\/\/[^\]]+)\]/)?.[2] || '';
            const footnoteDef = `[^${hexId}]: ${url}`;
            
            // Replace the line with just the footnote reference
            let updatedContent = content.replace(
                lineContent, 
                `[^${hexId}]`
            );
            
            // Add footnotes section if it doesn't exist
            if (!updatedContent.includes('# Footnotes')) {
                updatedContent += '\n\n# Footnotes\n';
            }
            
            // Add the footnote definition if it doesn't exist
            if (!updatedContent.includes(`[^${hexId}]:`)) {
                updatedContent += `\n${footnoteDef}`;
            }
            
            return updatedContent;
        } else {
            // For standard footnotes and references
            const pattern = matchType === 'footnote' 
                ? `\\[\\^${targetNumber}\\]` 
                : `\\[${targetNumber}\\]`;
            const regex = new RegExp(pattern, 'g');
            return content.replace(regex, `[^${hexId}]`);
        }
    }

    public convertCitations(content: string, targetCitation?: string): CitationConversionResult {
        if (!content) {
            return { updatedContent: content || '', changed: false, stats: { citationsConverted: 0 } };
        }

        const matches = this.basicCitationMatch(content);
        if (matches.length === 0) {
            return { updatedContent: content, changed: false, stats: { citationsConverted: 0 } };
        }

        let updatedContent = content;
        const processedOriginals = new Set<string>();
        let citationsConverted = 0;

        // If we have a target citation, only process that one
        const matchesToProcess = targetCitation 
            ? matches.filter(m => m.original === targetCitation)
            : matches;

        // Process each match in reverse order to avoid position shifting issues
        for (let i = matchesToProcess.length - 1; i >= 0; i--) {
            const match = matchesToProcess[i];
            if (!match || processedOriginals.has(match.original)) {
                continue;
            }

            try {
                // Generate a hex ID for this citation
                const hexId = this.generateHexId();
                
                // Replace the citation
                updatedContent = this.basicMatchAndReplace(
                    updatedContent,
                    match.number,
                    hexId,
                    match.type,
                    match.lineContent
                );
                
                citationsConverted++;
                processedOriginals.add(match.original);
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
