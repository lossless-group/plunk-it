// Test script to verify markdown to HTML conversion
const { marked } = require('marked');

// Configure marked options for better HTML output
marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: true, // Convert line breaks to <br>
    headerIds: true, // Add IDs to headers
    mangle: false, // Don't mangle email addresses
    sanitize: false, // Allow HTML tags
    smartLists: true, // Use smarter list behavior
    smartypants: true, // Use smart typographic punctuation
    xhtml: false // Don't use XHTML output
});

// Mock the convertBacklinksToUrls function
function convertBacklinksToUrls(content, backlinkUrlBase) {
    if (!backlinkUrlBase) {
        return content;
    }

    // Regular expression to match Obsidian backlinks: [[text]] or [[text|display]]
    const backlinkRegex = /\[\[([^\]]+)\]\]/g;
    
    return content.replace(backlinkRegex, (match, linkContent) => {
        // Split by | to handle display text
        const [link, display] = linkContent.split('|');
        const displayText = display || link;
        
        // Encode the backlink for URL
        const encodedLink = encodeURIComponent(match);
        
        // Construct the URL
        const url = `${backlinkUrlBase}/backlink?query=${encodedLink}`;
        
        // Return as markdown link
        return `[${displayText}](${url})`;
    });
}

// Mock the markdownToHtml function
function markdownToHtml(markdown, backlinkUrlBase) {
    try {
        // First convert backlinks to URLs
        const processedMarkdown = convertBacklinksToUrls(markdown, backlinkUrlBase);
        
        // Then convert to HTML
        return marked(processedMarkdown);
    } catch (error) {
        console.error('Error converting markdown to HTML:', error);
        return markdown;
    }
}

// Test content
const testContent = `# Test Newsletter

This is a **bold** text and *italic* text.

## Features

- Feature 1
- Feature 2
- Feature 3

## Links

Check out [[Agentic AI]] and [[Machine Learning|ML]].

Regular link: [Google](https://google.com)

## Code

\`\`\`javascript
console.log("Hello World");
\`\`\`

Inline \`code\` example.
`;

console.log('Original markdown:');
console.log('==================');
console.log(testContent);
console.log('\n');

console.log('HTML output (without backlink conversion):');
console.log('==========================================');
console.log(markdownToHtml(testContent, ''));
console.log('\n');

console.log('HTML output (with backlink conversion):');
console.log('=======================================');
console.log(markdownToHtml(testContent, 'https://myurl.com'));
