// Test script to verify update campaign backlink conversion
const { marked } = require('marked');

// Configure marked options for better HTML output
marked.setOptions({
    gfm: true,
    breaks: true,
    headerIds: true,
    mangle: false,
    sanitize: false,
    smartLists: true,
    smartypants: true,
    xhtml: false
});

// Mock the extractFrontmatter function
function extractFrontmatter(content) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (!match) {
        return { frontmatter: null, body: content };
    }

    const frontmatterText = match[1];
    const body = match[2] || '';

    try {
        const frontmatter = {};
        const lines = frontmatterText?.split('\n') || [];
        
        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();
                
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                
                if (value.startsWith('[') && value.endsWith(']')) {
                    value = JSON.parse(value);
                }
                
                frontmatter[key] = value;
            }
        }
        
        return { frontmatter, body };
    } catch (error) {
        console.error('Error parsing frontmatter:', error);
        return { frontmatter: null, body: content };
    }
}

// Mock the convertBacklinksToUrls function
function convertBacklinksToUrls(content, backlinkUrlBase) {
    if (!backlinkUrlBase) {
        return content;
    }

    const backlinkRegex = /\[\[([^\]]+)\]\]/g;
    
    return content.replace(backlinkRegex, (match, linkContent) => {
        const [link, display] = linkContent.split('|');
        const displayText = display || link;
        const encodedLink = encodeURIComponent(match);
        const url = `${backlinkUrlBase}/backlink?query=${encodedLink}`;
        return `[${displayText}](${url})`;
    });
}

// Mock the markdownToHtml function
function markdownToHtml(markdown, backlinkUrlBase) {
    try {
        const processedMarkdown = convertBacklinksToUrls(markdown, backlinkUrlBase);
        return marked(processedMarkdown);
    } catch (error) {
        console.error('Error converting markdown to HTML:', error);
        return markdown;
    }
}

// Mock the updateCampaign function
function updateCampaign(content, config) {
    try {
        // Extract frontmatter and body
        const { body } = extractFrontmatter(content);
        
        // Convert markdown body to HTML
        const htmlBody = markdownToHtml(body, config.backlinkUrlBase);
        
        return {
            success: true,
            htmlBody: htmlBody,
            body: body
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Test content with frontmatter
const testContent = `---
title: Test Newsletter
author: Test Author
campaignId: test-123
---

# Test Newsletter with Backlinks

This is a test newsletter that contains various Obsidian backlinks.

## Regular Backlinks

Here are some regular backlinks:
- [[Agentic AI]] - This should become a clickable link
- [[Machine Learning]] - Another backlink
- [[Obsidian Plugin Development]] - Yet another backlink

## Backlinks with Display Text

Here are some backlinks with custom display text:
- [[Agentic AI|AI Agents]] - This should show "AI Agents" as the link text
- [[Machine Learning|ML]] - This should show "ML" as the link text

## Mixed Content

This paragraph contains a backlink [[Agentic AI]] in the middle of the text, and another one [[Machine Learning]] at the end.

## Links

Regular markdown links should work normally: [Google](https://google.com)
`;

console.log('Original content:');
console.log('================');
console.log(testContent);
console.log('\n');

console.log('Update Campaign Test (with backlinkUrlBase = "https://myurl.com"):');
console.log('==================================================================');
const result = updateCampaign(testContent, {
    id: 'test-123',
    subject: 'Test Subject',
    body: '',
    apiToken: 'test-token',
    recipients: ['test@example.com'],
    style: 'SANS',
    selectedClient: 'all',
    backlinkUrlBase: 'https://myurl.com'
});

if (result.success) {
    console.log('Extracted body:');
    console.log('==============');
    console.log(result.body);
    console.log('\n');
    
    console.log('Converted HTML:');
    console.log('===============');
    console.log(result.htmlBody);
} else {
    console.log('Error:', result.error);
}

console.log('\n');

console.log('Update Campaign Test (with backlinkUrlBase = ""):');
console.log('=================================================');
const result2 = updateCampaign(testContent, {
    id: 'test-123',
    subject: 'Test Subject',
    body: '',
    apiToken: 'test-token',
    recipients: ['test@example.com'],
    style: 'SANS',
    selectedClient: 'all',
    backlinkUrlBase: ''
});

if (result2.success) {
    console.log('Extracted body:');
    console.log('==============');
    console.log(result2.body);
    console.log('\n');
    
    console.log('Converted HTML:');
    console.log('===============');
    console.log(result2.htmlBody);
} else {
    console.log('Error:', result2.error);
}
