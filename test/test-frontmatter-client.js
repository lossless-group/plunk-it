// Test script to verify frontmatter client saving and loading
const fs = require('fs');

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
                    try {
                        // Try to parse as JSON first
                        value = JSON.parse(value);
                    } catch (error) {
                        // If JSON parsing fails, try to parse as YAML-style array
                        const arrayContent = value.slice(1, -1); // Remove [ and ]
                        if (arrayContent.trim()) {
                            value = arrayContent.split(',').map(item => item.trim());
                        } else {
                            value = [];
                        }
                    }
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

// Mock the updateFrontmatterWithSelectedClient function
function updateFrontmatterWithSelectedClient(content, selectedClient) {
    const { frontmatter, body } = extractFrontmatter(content);
    
    const updatedFrontmatter = {
        ...(frontmatter || {}),
        selectedClient: selectedClient
    };
    
    const frontmatterLines = Object.entries(updatedFrontmatter).map(([key, value]) => {
        if (Array.isArray(value)) {
            return `${key}: ${JSON.stringify(value)}`;
        }
        return `${key}: ${value}`;
    });
    
    const frontmatterString = frontmatterLines.join('\n');
    
    return `---\n${frontmatterString}\n---\n\n${body}`;
}

// Test content with existing frontmatter
const testContent = `---
title: Test Newsletter
author: Test Author
campaignId: test-123
tags: [newsletter, test]
---

# Test Newsletter

This is a test newsletter content.

## Content

Some content here.
`;

console.log('Original content:');
console.log('================');
console.log(testContent);
console.log('\n');

// Test 1: Extract frontmatter and check for selectedClient
console.log('Test 1: Extract frontmatter (no selectedClient):');
console.log('===============================================');
const { frontmatter, body } = extractFrontmatter(testContent);
console.log('Frontmatter:', frontmatter);
console.log('Selected Client:', frontmatter?.selectedClient || 'none');
console.log('\n');

// Test 2: Add selectedClient to frontmatter
console.log('Test 2: Add selectedClient "Client A":');
console.log('=====================================');
const updatedContent1 = updateFrontmatterWithSelectedClient(testContent, 'Client A');
console.log('Updated content:');
console.log(updatedContent1);
console.log('\n');

// Test 3: Extract frontmatter from updated content
console.log('Test 3: Extract frontmatter (with selectedClient):');
console.log('==================================================');
const { frontmatter: updatedFrontmatter } = extractFrontmatter(updatedContent1);
console.log('Frontmatter:', updatedFrontmatter);
console.log('Selected Client:', updatedFrontmatter?.selectedClient);
console.log('\n');

// Test 4: Change selectedClient
console.log('Test 4: Change selectedClient to "Client B":');
console.log('===========================================');
const updatedContent2 = updateFrontmatterWithSelectedClient(updatedContent1, 'Client B');
console.log('Updated content:');
console.log(updatedContent2);
console.log('\n');

// Test 5: Extract frontmatter from final content
console.log('Test 5: Extract frontmatter (changed selectedClient):');
console.log('=====================================================');
const { frontmatter: finalFrontmatter } = extractFrontmatter(updatedContent2);
console.log('Frontmatter:', finalFrontmatter);
console.log('Selected Client:', finalFrontmatter?.selectedClient);
console.log('\n');

// Test 6: Test with "all" client
console.log('Test 6: Set selectedClient to "all":');
console.log('===================================');
const updatedContent3 = updateFrontmatterWithSelectedClient(updatedContent2, 'all');
console.log('Updated content:');
console.log(updatedContent3);
console.log('\n');

const { frontmatter: allFrontmatter } = extractFrontmatter(updatedContent3);
console.log('Selected Client:', allFrontmatter?.selectedClient);
