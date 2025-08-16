// Test script for Plunk API
// Run with: node test-plunk-api.js

// Load environment variables if dotenv is available
try {
    require('dotenv').config();
} catch (error) {
    console.log('dotenv not available, using process.env directly');
}

const PLUNK_API_URL = 'https://api.useplunk.com/v1/send';

// Test email data
const testEmailData = {
    to: process.env.TEST_EMAIL_RECIPIENT || "test@example.com",
    subject: "Test Email from Plunk API",
    body: "<h1>Hello World</h1><p>This is a test email sent via Plunk API.</p>",
    subscribed: true,
    name: "Test Sender",
};

async function testPlunkAPI() {
    console.log('🧪 Testing Plunk API...');
    
    // Check if PLUNK_SECRET is available
    if (!process.env.PLUNK_SECRET) {
        console.log('❌ PLUNK_SECRET environment variable not found');
        console.log('Please set your PLUNK_SECRET environment variable');
        console.log('You can create a .env file with: PLUNK_SECRET=your_secret_here');
        return;
    }

    // Check if TEST_EMAIL_RECIPIENT is available
    if (!process.env.TEST_EMAIL_RECIPIENT) {
        console.log('⚠️  TEST_EMAIL_RECIPIENT environment variable not found');
        console.log('Using default test email: test@example.com');
        console.log('You can set TEST_EMAIL_RECIPIENT in your .env file');
    } else {
        console.log('✅ TEST_EMAIL_RECIPIENT found:', process.env.TEST_EMAIL_RECIPIENT);
    }

    console.log('✅ PLUNK_SECRET found');
    console.log('📡 Making request to Plunk API...');
    console.log('API URL:', PLUNK_API_URL);
    console.log('Request data:', JSON.stringify(testEmailData, null, 2));

    try {
        const response = await fetch(PLUNK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.PLUNK_SECRET}`
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
    console.log('\n🧪 Testing Alternative Format ---');
    
    if (!process.env.PLUNK_SECRET) {
        console.log('❌ PLUNK_SECRET not available, skipping alternative test');
        return;
    }
    
    // Try with different data structure
    const alternativeData = {
        to: [process.env.TEST_EMAIL_RECIPIENT || "test@example.com"], // Try as array
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
                'Authorization': `Bearer ${process.env.PLUNK_SECRET}`
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
    console.log('\n🧪 Testing Minimal Format ---');
    
    if (!process.env.PLUNK_SECRET) {
        console.log('❌ PLUNK_SECRET not available, skipping minimal test');
        return;
    }
    
    const minimalData = {
        to: process.env.TEST_EMAIL_RECIPIENT || "test@example.com",
        subject: "Test",
        body: "Test email"
    };

    console.log('Minimal request data:', JSON.stringify(minimalData, null, 2));

    try {
        const response = await fetch(PLUNK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.PLUNK_SECRET}`
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
    console.log('🚀 Starting Plunk API Tests\n');
    
    await testPlunkAPI();
    await testPlunkAPIAlternative();
    await testPlunkAPIMinimal();
    
    console.log('\n✨ Tests completed!');
}

// Run the tests
main().catch(console.error);
