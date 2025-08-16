# Plunk Contact Deletion Test Scripts

⚠️ **WARNING: These scripts will permanently delete ALL contacts from your Plunk account!**

Use these scripts **ONLY** in test environments or when you are absolutely certain you want to delete all contacts.

## Files

- `delete-all-contacts.js` - Basic deletion script (proceeds without confirmation)
- `delete-all-contacts-safe.js` - Safe deletion script (requires multiple confirmations)

## Prerequisites

1. **Node.js** installed on your system
2. **Plunk API Token** - Get this from your Plunk dashboard
3. **Test Environment** - Only use these scripts in test environments
4. **dotenv** (optional) - For loading environment variables from .env file

## Setup

1. **Set Environment Variables**: Create a `.env` file in the test directory with your Plunk API token:

```bash
PLUNK_SECRET=your_actual_api_token_here
```

Or set the environment variable directly:

```bash
export PLUNK_SECRET=your_actual_api_token_here
```

2. **Verify the API Token**: Make sure you're using the correct API token for the environment you want to clean up.

## Usage

### Safe Version (Recommended)

```bash
node delete-all-contacts-safe.js
```

This version requires two confirmations:
1. First confirmation: Type `yes` when prompted
2. Second confirmation: Type `DELETE ALL` when prompted

### Basic Version (Use with extreme caution)

```bash
node delete-all-contacts.js
```

This version proceeds immediately without confirmation.

## What the Scripts Do

1. **Fetch All Contacts**: Gets a list of all contacts from your Plunk account
2. **Display Contacts**: Shows details of contacts that will be deleted
3. **Request Confirmation**: (Safe version only) Asks for confirmation
4. **Delete Contacts**: Deletes each contact one by one with progress tracking
5. **Verify Deletion**: Checks that all contacts were successfully deleted
6. **Show Summary**: Displays results of the deletion process

## Safety Features

### Safe Version (`delete-all-contacts-safe.js`)
- ✅ Multiple confirmation prompts
- ✅ Shows all contacts before deletion
- ✅ Requires typing "DELETE ALL" as final confirmation
- ✅ Progress tracking during deletion
- ✅ Verification after deletion
- ✅ Detailed error reporting

### Basic Version (`delete-all-contacts.js`)
- ⚠️ No confirmation prompts
- ✅ Shows all contacts before deletion
- ✅ Progress tracking during deletion
- ✅ Verification after deletion
- ✅ Detailed error reporting

## Output Example

```
=== PLUNK CONTACT DELETION TOOL (SAFE VERSION) ===
This tool will delete ALL contacts from your Plunk account.
Multiple confirmations are required before deletion proceeds.

Fetching all contacts...
Found 5 contacts

Contacts to be deleted:
1. ID: abc123, Email: test1@example.com, Name: Test User 1
2. ID: def456, Email: test2@example.com, Name: Test User 2
3. ID: ghi789, Email: test3@example.com, Name: Test User 3
4. ID: jkl012, Email: test4@example.com, Name: Test User 4
5. ID: mno345, Email: test5@example.com, Name: Test User 5

⚠️  WARNING: This will permanently delete 5 contacts!
⚠️  This action cannot be undone!

Are you absolutely sure you want to proceed? (yes/no): yes

⚠️  FINAL WARNING: This is your last chance to cancel!
Type "DELETE ALL" to confirm deletion: DELETE ALL

Starting deletion process...
✓ Deleted contact: abc123
Progress: 20.0% (1/5)
✓ Deleted contact: def456
Progress: 40.0% (2/5)
✓ Deleted contact: ghi789
Progress: 60.0% (3/5)
✓ Deleted contact: jkl012
Progress: 80.0% (4/5)
✓ Deleted contact: mno345
Progress: 100.0% (5/5)

=== DELETION SUMMARY ===
Total contacts: 5
Successfully deleted: 5
Failed to delete: 0

✅ All contacts deleted successfully!

Verifying deletion...
✅ Verification successful: No contacts remaining
```

## Error Handling

The scripts handle various error scenarios:

- **API Token Issues**: Validates API token before proceeding
- **Network Errors**: Handles connection issues gracefully
- **Rate Limiting**: Includes delays between API calls
- **Partial Failures**: Continues deletion even if some contacts fail
- **Verification**: Checks that deletion was successful

## Troubleshooting

### Common Issues

1. **"PLUNK_SECRET environment variable not found"**: Check your .env file or environment variable setup
2. **"Failed to fetch contacts"**: Check your API token and internet connection
3. **"Failed to delete contact"**: Contact might already be deleted or API rate limit reached
4. **"Some contacts failed to delete"**: Run the script again to retry failed deletions

### Rate Limiting

The scripts include a 100ms delay between deletion requests to avoid overwhelming the API. If you encounter rate limiting errors, you can increase this delay by modifying the `setTimeout` value in the script.

## Best Practices

1. **Always use the safe version** unless you have a specific reason not to
2. **Test in a development environment** first
3. **Backup important data** before running deletion scripts
4. **Verify the API token** is for the correct environment
5. **Run verification** after deletion to ensure success

## API Endpoints Used

- `GET /v1/contacts` - Fetch all contacts
- `DELETE /v1/contacts` - Delete a contact by ID

## Support

If you encounter issues with these scripts:

1. Check the Plunk API documentation
2. Verify your API token is valid
3. Ensure you have proper permissions
4. Check for any rate limiting or API changes

---

**Remember: These scripts permanently delete data. Use with extreme caution!**
