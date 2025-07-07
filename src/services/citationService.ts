// cite-wide/src/services/citationService.ts
import crypto from 'crypto';

export interface CitationMatch {
    type: 'perplexity' | 'reference' | 'footnote';
    number: string;
    original: string;
    url: string | undefined;  // Explicitly allow undefined
    index: number;
    lineContent: string;
    lineNumber: number;
}

export interface CitationGroup {
    number: string;
    matches: CitationMatch[];
    url: string | undefined;  // Explicitly allow undefined
}

export interface ConversionResult {
    content: string;
    changed: boolean;
    stats: {
        citationsConverted: number;
    };
}

export class CitationService {
    private hexCache: Map<string, string> = new Map(); // Cache URL to hex ID mapping

    /**
     * Find all citations in the content
     */
    public findCitations(content: string): CitationGroup[] {
        const lines = content.split('\n');
        const matches: CitationMatch[] = [];
        const urlMap = new Map<string, string>(); // Map of number to URL

        // First pass: Find all footnote definitions to map numbers to URLs
        lines.forEach((line, _lineIndex) => {
            // Match Perplexity-style footnotes: "1. [url](url)"
            const footnoteMatch = line.match(/^(\d+)\.\s+(\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/\S+))/);
            if (footnoteMatch) {
                const number = footnoteMatch[1];
                const url = footnoteMatch[4] || footnoteMatch[2];
                if (number && url) {
                    urlMap.set(number, url);
                }
            }
        });

        // Second pass: Find all citations in the content
        lines.forEach((line, lineIndex) => {
            // Match Perplexity-style citations: [1](url)
            const citationRegex = /\[(\d+)\]\(([^)]+)\)/g;
            let citationMatch;
            
            while ((citationMatch = citationRegex.exec(line)) !== null) {
                const [fullMatch, number, url] = citationMatch;
                
                // Skip if number is undefined
                if (!number) continue;
                
                const match: CitationMatch = {
                    type: 'perplexity',
                    number,
                    original: fullMatch,
                    index: citationMatch.index,
                    lineContent: line,
                    lineNumber: lineIndex,
                    url: url || undefined
                };
                
                matches.push(match);
            }

            // Match standard markdown links that might be citations
            const linkRegex = /\[(\d+)\]/g;
            let linkMatch;
            
            while ((linkMatch = linkRegex.exec(line)) !== null) {
                const [fullMatch, number] = linkMatch;
                
                // Skip if number is undefined or if it's part of a markdown link
                if (!number || line.substring(0, linkMatch.index).endsWith('](')) {
                    continue;
                }
                
                const url = urlMap.get(number);
                
                // Create the match object with all required properties
                const match: CitationMatch = {
                    type: 'reference',
                    number,
                    original: fullMatch,
                    index: linkMatch.index,
                    lineContent: line,
                    lineNumber: lineIndex,
                    url: url || undefined
                };
                
                matches.push(match);
            }
        });

        // Group matches by number
        const groups = new Map<string, CitationGroup>();
        
        matches.forEach(match => {
            if (!groups.has(match.number)) {
                const newGroup: CitationGroup = {
                    number: match.number,
                    matches: [],
                    url: match.url
                };
                groups.set(match.number, newGroup);
            }
            groups.get(match.number)?.matches.push(match);
        });

        return Array.from(groups.values());
    }

    /**
     * Convert a specific citation to hex format
     */
    public convertCitation(
        content: string, 
        citationNumber: string, 
        hexId?: string
    ): ConversionResult {
        const groups = this.findCitations(content);
        const group = groups.find(g => g.number === citationNumber);
        
        if (!group) {
            return { content, changed: false, stats: { citationsConverted: 0 } };
        }

        // Generate or use provided hex ID
        const targetHexId = hexId || this.generateHexId();
        const url = group.url || group.matches[0]?.url;
        
        if (!url) {
            return { content, changed: false, stats: { citationsConverted: 0 } };
        }

        // Cache the URL to hex ID mapping
        this.hexCache.set(url, targetHexId);

        let updatedContent = content;
        let citationsConverted = 0;

        // Process in reverse to avoid position shifting
        const sortedMatches = [...group.matches].sort((a, b) => b.index - a.index);
        
        for (const match of sortedMatches) {
            const before = updatedContent.substring(0, match.index);
            const after = updatedContent.substring(match.index + match.original.length);
            
            // Ensure proper spacing
            const needsLeadingSpace = !before.endsWith(' ') && !before.endsWith('\n') && before.length > 0;
            const needsTrailingSpace = !after.startsWith(' ') && !after.startsWith('\n') && after.length > 0;
            
            const replacement = `${needsLeadingSpace ? ' ' : ''}[^${targetHexId}]${needsTrailingSpace ? ' ' : ''}`;
            
            updatedContent = before + replacement + after;
            citationsConverted++;
        }

        // Add or update the footnote definition
        const footnoteDef = `[^${targetHexId}]: ${url}`;
        const footnoteSection = this.ensureFootnoteSection(updatedContent);
        
        if (!footnoteSection.content.includes(`[^${targetHexId}]:`)) {
            updatedContent = updatedContent.replace(
                footnoteSection.marker,
                `${footnoteSection.marker}\n${footnoteDef}`
            );
        }

        return {
            content: updatedContent,
            changed: citationsConverted > 0,
            stats: { citationsConverted }
        };
    }

    /**
     * Ensure the document has a footnotes section
     */
    private ensureFootnoteSection(content: string): { content: string; marker: string } {
        const footnoteMarker = '\n\n# Footnotes\n';
        
        if (content.includes(footnoteMarker)) {
            return { content, marker: footnoteMarker };
        }

        const altMarker = '\n## Footnotes\n';
        if (content.includes(altMarker)) {
            return { content, marker: altMarker };
        }

        // Add a new footnotes section at the end
        return { 
            content: content + footnoteMarker, 
            marker: footnoteMarker 
        };
    }

    /**
     * Generate a consistent hex ID for a given URL
     */
    private generateHexId(length: number = 6): string {
        return crypto
            .randomBytes(Math.ceil(length / 2))
            .toString('hex')
            .slice(0, length);
    }

    /**
     * Generate a new hex ID for citations
     * @returns A new unique hex ID
     */
    public getNewHexId(): string {
        return this.generateHexId();
    }
}

// Export a singleton instance
export const citationService = new CitationService();