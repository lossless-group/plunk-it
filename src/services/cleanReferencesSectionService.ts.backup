/**
 * Service for cleaning up and normalizing references sections in markdown content
 */

/**
 * Adds colon syntax to footnote references that are missing it
 * @param text The text to process
 * @returns The processed text with colons added to footnote references
 */
export function addColonSyntaxWhereNone(text: string): string {
    if (!text) return text;
    
    // Split the text into lines and process each line
    return text.split('\n').map(line => {
        // Match footnote references that don't have a colon after the ID
        // Format: [^hexId] Text...
        const footnoteRegex = /^(\s*\[\^([a-z0-9]+)\])(?::?\s*)(.*)$/i;
        const match = line.match(footnoteRegex);
        
        if (match && match[1] && match[2] && match[3] !== undefined) {
            const leadingSpaceMatch = match[1].match(/^\s*/);
            const leadingSpace = leadingSpaceMatch ? leadingSpaceMatch[0] : '';
            const id = match[2];
            const content = match[3].trimStart();
            // Preserve leading space and ensure exactly one space after the colon
            return `${leadingSpace}[^${id}]: ${content}`;
        }
        
        return line;
    }).join('\n');
}

/**
 * Processes the current selection in the active editor to add colon syntax to footnotes
 * @returns A promise that resolves when the operation is complete
 */
export async function processSelection(): Promise<void> {
    // This function would be called from a command or UI component
    // that has access to the Obsidian editor instance
    const editor = (window as any).activeEditor?.editor;
    
    if (!editor) {
        console.warn('No active editor found');
        return;
    }
    
    const selection = editor.getSelection();
    if (!selection) {
        console.warn('No text selected');
        return;
    }
    
    // Process the selected text
    const processedText = addColonSyntaxWhereNone(selection);
    
    // Replace the selection with the processed text
    editor.replaceSelection(processedText);
}

export const cleanReferencesSectionService = {
    addColonSyntaxWhereNone,
    processSelection
};

export default cleanReferencesSectionService;
