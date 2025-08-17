// Simple test script to verify backlink conversion
const fs = require('fs');

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

// Read the test file
const testContent = fs.readFileSync('test-backlink-conversion.md', 'utf8');

console.log('Original content:');
console.log('================');
console.log(testContent);
console.log('\n');

console.log('Converted content (with backlinkUrlBase = "https://myurl.com"):');
console.log('=============================================================');
const converted = convertBacklinksToUrls(testContent, 'https://myurl.com');
console.log(converted);
console.log('\n');

console.log('Converted content (with backlinkUrlBase = ""):');
console.log('=============================================');
const notConverted = convertBacklinksToUrls(testContent, '');
console.log(notConverted);
