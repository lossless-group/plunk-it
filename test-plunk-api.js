// Test script for Plunk API
// Run with: node test-plunk-api.js

const PLUNK_API_URL = 'https://api.useplunk.com/v1/send';

// Replace with your actual API token
const API_TOKEN = 'sk_658a9c64884e64d84e7121b545a2e6724ffbeafda67d417f';

// Test email data
const testEmailData = {
    to: "tanujsiripurapu@gmail.com",
    subject: "Test Email from Plunk API",
    body: "<h1>Hello World</h1><p>This is a test email sent via Plunk API.</p>",
    subscribed: true,
    name: "Test Sender",
};

async function testPlunkAPI() {
    console.log('Testing Plunk API...');
    console.log('API URL:', PLUNK_API_URL);
    console.log('Request data:', JSON.stringify(testEmailData, null, 2));

    try {
        const response = await fetch(PLUNK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_TOKEN}`
            },
            body: JSON.stringify(testEmailData)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('Response body:', responseText);

        if (response.ok) {
            const data = JSON.parse(responseText);
            console.log('✅ Success! Response data:', data);
        } else {
            console.log('❌ Error response:', responseText);
        }

    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

// Alternative test with different data structure
async function testPlunkAPIAlternative() {
    console.log('\n--- Testing Alternative Format ---');
    
    // Try with different data structure
    const alternativeData = {
        to: ["tanujsiripurapu@gmail.com"], // Try as array
        subject: "Test Email from Plunk API",
        body: "<h1>Hello World</h1><p>This is a test email sent via Plunk API.</p>",
        subscribed: true,
        name: "Test Sender"
    };

    console.log('Alternative request data:', JSON.stringify(alternativeData, null, 2));

    try {
        const response = await fetch(PLUNK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_TOKEN}`
            },
            body: JSON.stringify(alternativeData)
        });

        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response body:', responseText);

        if (response.ok) {
            const data = JSON.parse(responseText);
            console.log('✅ Success! Response data:', data);
        } else {
            console.log('❌ Error response:', responseText);
        }

    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

// Test with minimal data
async function testPlunkAPIMinimal() {
    console.log('\n--- Testing Minimal Format ---');
    
    const minimalData = {
        to: "tanujsiripurapu@gmail.com",
        subject: "Test",
        body: "Test email"
    };

    console.log('Minimal request data:', JSON.stringify(minimalData, null, 2));

    try {
        const response = await fetch(PLUNK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_TOKEN}`
            },
            body: JSON.stringify(minimalData)
        });

        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response body:', responseText);

        if (response.ok) {
            const data = JSON.parse(responseText);
            console.log('✅ Success! Response data:', data);
        } else {
            console.log('❌ Error response:', responseText);
        }

    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

// Main execution
async function main() {
    if (API_TOKEN === 'YOUR_PLUNK_API_TOKEN_HERE') {
        console.log('❌ Please replace API_TOKEN with your actual Plunk API token');
        console.log('You can get your token from: https://useplunk.com');
        return;
    }

    await testPlunkAPI();
    await testPlunkAPIAlternative();
    await testPlunkAPIMinimal();
}

// Run the tests
main().catch(console.error);
