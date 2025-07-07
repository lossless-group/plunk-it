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
    /**
     * Find all citations in the content
     */
    public findCitations(content: string): CitationGroup[] {
        const matches: CitationMatch[] = [];
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
                    url: undefined, // URL will be set in the group
                    index: currentPosition + line.indexOf(perplexityMatch[0]),
                    lineContent: line,
                    lineNumber: 0 // Will be set in the group
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
                        url: undefined,
                        index: currentPosition + (footnoteMatch.index || 0),
                        lineContent: line,
                        lineNumber: 0 // Will be set in the group
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
                        url: undefined,
                        index: currentPosition + (citationMatch.index || 0),
                        lineContent: line,
                        lineNumber: 0 // Will be set in the group
                    });
                }
            }
            
            // Update position for the next line
            currentPosition += line.length + 1; // +1 for the newline character
        }

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
     * Preprocess content to clean up URL links after citations
     * This handles cases like [1][text](url) or [1](url) and removes the URL part
     */
    private preprocessCitations(content: string): string {
        // First pass: Handle [number][text](url) pattern
        let result = content.replace(
            /\[(\d+)\]\s*\[[^\]]+\]\([^)]+\)/g,
            '[$1]'  // Keep just the [number] part
        );

        // Second pass: Handle [number](url) pattern
        result = result.replace(
            /\[(\d+)\]\([^)]+\)/g,
            '[$1]'  // Keep just the [number] part
        );

        return result;
    }

    /**
     * Convert a specific citation to hex format
     */
    public convertCitation(
        content: string, 
        citationNumber: string, 
        hexId?: string,
        matchIndex: number = -1
    ): ConversionResult {
        // First preprocess the content to clean up any URL links
        const preprocessedContent = this.preprocessCitations(content);
        const groups = this.findCitations(preprocessedContent);
        const group = groups.find(g => g.number === citationNumber);
        
        if (!group) {
            return { content: preprocessedContent, changed: false, stats: { citationsConverted: 0 } };
        }

        // Generate or use provided hex ID
        const targetHexId = hexId || this.generateHexId();
        let updatedContent = preprocessedContent;
        let citationsConverted = 0;
        const url = group.matches[0]?.url;

        // If a specific match index is provided, only convert that one
        const matchesToProcess = matchIndex >= 0 && matchIndex < group.matches.length 
            ? [group.matches[matchIndex]] 
            : [...group.matches].sort((a, b) => b.index - a.index);
        
        // Process matches in reverse order to avoid position shifting
        for (const match of matchesToProcess) {
            if (!match) continue;
            
            const before = updatedContent.substring(0, match.index);
            const after = updatedContent.substring(match.index + match.original.length);
            
            // Replace with hex reference
            updatedContent = `${before}[^${targetHexId}]${after}`;
            citationsConverted++;
            
            // If this was a Perplexity-style citation, clean up the URL part
            if (match.type === 'perplexity' && match.url) {
                // Match the URL pattern that might follow the citation
                const urlPattern = new RegExp(
                    `\\[${citationNumber}\\]\\s*\\[([^\]]+)\\]\([^)]+\)`
                );
                const urlMatch = updatedContent.match(urlPattern);
                
                if (urlMatch) {
                    const urlStart = updatedContent.indexOf(urlMatch[0]);
                    const urlEnd = urlStart + urlMatch[0].length;
                    updatedContent = updatedContent.substring(0, urlStart) + 
                                   updatedContent.substring(urlEnd);
                }
            }
        }
        
        // Add footnote definition if we have a URL and converted citations
        if (citationsConverted > 0 && url) {
            const footnoteDef = `[^${targetHexId}]: ${url}`;
            const footnoteSection = this.ensureFootnoteSection(updatedContent);
            
            if (!footnoteSection.content.includes(`[^${targetHexId}]:`)) {
                updatedContent = updatedContent.replace(
                    footnoteSection.marker,
                    `${footnoteSection.marker}\n${footnoteDef}`
                );
            }
        }

        // No need for post-processing since we handle URLs in preprocess step

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