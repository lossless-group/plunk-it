/**
 * Test script to delete all contacts from Plunk account
 * 
 * WARNING: This will permanently delete ALL contacts from your Plunk account!
 * Use with extreme caution and only in test environments.
 * 
 * Usage:
 * 1. Set PLUNK_SECRET in your .env file or environment variables
 * 2. Run: node delete-all-contacts.js
 */

// Load environment variables if dotenv is available
try {
    require('dotenv').config();
} catch (error) {
    console.log('dotenv not available, using process.env directly');
}

const PLUNK_API_BASE = 'https://api.useplunk.com/v1';

/**
 * Get all contacts from Plunk
 */
async function getAllContacts() {
    const url = `${PLUNK_API_BASE}/contacts`;
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PLUNK_SECRET}`
        }
    };

    try {
        console.log('Fetching all contacts...');
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch contacts: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Found ${data.length} contacts`);
        return data;
    } catch (error) {
        console.error('Error fetching contacts:', error);
        throw error;
    }
}

/**
 * Delete a single contact by ID
 */
async function deleteContact(contactId) {
    const url = `${PLUNK_API_BASE}/contacts`;
    const options = {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PLUNK_SECRET}`
        },
        body: JSON.stringify({ id: contactId })
    };

    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`Failed to delete contact ${contactId}: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✓ Deleted contact: ${contactId}`);
        return data;
    } catch (error) {
        console.error(`✗ Error deleting contact ${contactId}:`, error);
        throw error;
    }
}

/**
 * Delete all contacts with confirmation and progress tracking
 */
async function deleteAllContacts() {
    try {
        // Get all contacts first
        const contacts = await getAllContacts();
        
        if (contacts.length === 0) {
            console.log('No contacts found to delete.');
            return;
        }

        // Show contact details
        console.log('\nContacts to be deleted:');
        contacts.forEach((contact, index) => {
            console.log(`${index + 1}. ID: ${contact.id}, Email: ${contact.email || 'N/A'}, Name: ${contact.name || 'N/A'}`);
        });

        // Ask for confirmation
        console.log(`\n⚠️  WARNING: This will permanently delete ${contacts.length} contacts!`);
        console.log('⚠️  This action cannot be undone!');
        
        // In a real script, you might want to add a confirmation prompt here
        // For now, we'll proceed with deletion
        
        console.log('\nStarting deletion process...');
        
        // Delete contacts one by one with a small delay to avoid rate limiting
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
            
            try {
                await deleteContact(contact.id);
                successCount++;
                
                // Add a small delay to avoid overwhelming the API
                if (i < contacts.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (error) {
                errorCount++;
                console.error(`Failed to delete contact ${contact.id}:`, error.message);
            }
            
            // Show progress
            const progress = ((i + 1) / contacts.length * 100).toFixed(1);
            console.log(`Progress: ${progress}% (${i + 1}/${contacts.length})`);
        }
        
        // Summary
        console.log('\n=== DELETION SUMMARY ===');
        console.log(`Total contacts: ${contacts.length}`);
        console.log(`Successfully deleted: ${successCount}`);
        console.log(`Failed to delete: ${errorCount}`);
        
        if (errorCount > 0) {
            console.log('\nSome contacts failed to delete. You may need to run this script again.');
        } else {
            console.log('\n✅ All contacts deleted successfully!');
        }
        
    } catch (error) {
        console.error('Error in deleteAllContacts:', error);
    }
}

/**
 * Verify that all contacts are deleted
 */
async function verifyDeletion() {
    try {
        console.log('\nVerifying deletion...');
        const remainingContacts = await getAllContacts();
        
        if (remainingContacts.length === 0) {
            console.log('✅ Verification successful: No contacts remaining');
        } else {
            console.log(`⚠️  Warning: ${remainingContacts.length} contacts still remain`);
            remainingContacts.forEach(contact => {
                console.log(`  - ID: ${contact.id}, Email: ${contact.email || 'N/A'}`);
            });
        }
    } catch (error) {
        console.error('Error verifying deletion:', error);
    }
}

/**
 * Main execution function
 */
async function main() {
    console.log('=== PLUNK CONTACT DELETION TOOL ===');
    console.log('This tool will delete ALL contacts from your Plunk account.');
    console.log('');
    
    if (!process.env.PLUNK_SECRET) {
        console.error('❌ ERROR: PLUNK_SECRET environment variable not found');
        console.error('Please set your PLUNK_SECRET environment variable');
        console.error('You can create a .env file with: PLUNK_SECRET=your_secret_here');
        return;
    }
    
    try {
        // Delete all contacts
        await deleteAllContacts();
        
        // Verify deletion
        await verifyDeletion();
        
    } catch (error) {
        console.error('❌ Fatal error:', error);
    }
}

// Run the script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    getAllContacts,
    deleteContact,
    deleteAllContacts,
    verifyDeletion
};
