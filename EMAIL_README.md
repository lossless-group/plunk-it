# Email Newsletter Plugin for Obsidian

This plugin adds email newsletter functionality to Obsidian, allowing you to send markdown files as HTML emails using the Plunk API.

## Features

- **Frontmatter Extraction**: Automatically extracts metadata from YAML frontmatter
- **Markdown to HTML Conversion**: Converts markdown content to beautiful HTML emails
- **Plunk API Integration**: Uses Plunk's email service for reliable delivery
- **Email Campaigns**: Create campaigns to send to all contacts or filtered by tags
- **Easy Configuration**: Simple modal interface for email settings
- **Content Preview**: Preview your email content before sending
- **Campaign ID Tracking**: Automatically saves campaign IDs to frontmatter

## Setup

### 1. Get a Plunk API Token

1. Sign up at [useplunk.com](https://useplunk.com)
2. Navigate to your API settings
3. Copy your API token (Bearer token)

### 2. Install the Plugin

1. Install the plugin in Obsidian
2. Enable the plugin in your Obsidian settings

## Usage

### 1. Create a Newsletter

Create a markdown file with frontmatter metadata:

```markdown
---
title: "Your Newsletter Title"
description: "Brief description of your newsletter"
author: "Your Name"
date: "2024-01-15"
email: "recipient@example.com"
tags: ["newsletter", "updates"]
---

# Your Newsletter Content

Your markdown content here...

## Section 1

Content for section 1...

## Section 2

Content for section 2...
```

### 2. Send the Newsletter

1. Open your markdown file in Obsidian
2. Use the command palette (`Ctrl/Cmd + Shift + P`)
3. Search for "Send Email Newsletter"
4. Click the command to open the email modal

### 3. Create an Email Campaign

1. Open your markdown file in Obsidian
2. Use the command palette (`Ctrl/Cmd + Shift + P`)
3. Search for "Create Email Campaign"
4. Click the command to open the campaign modal
5. Configure campaign settings:
   - **Campaign Name**: Name for your campaign
   - **Subject**: Email subject line
6. Click "Create Campaign" to create the campaign
7. The campaign ID will be automatically saved to your file's frontmatter

### 4. Send an Email Campaign

1. Open your markdown file with a campaign ID in the frontmatter
2. Use the command palette (`Ctrl/Cmd + Shift + P`)
3. Search for "Send Email Campaign"
4. Click the command to send the campaign
5. The campaign will be sent to all contacts in your Plunk account

### 5. Configure Email Settings

In the email modal, you'll need to provide:

- **Plunk API Token**: Your Plunk API token
- **To**: Recipient email address (auto-filled from frontmatter if available)
- **Subject**: Email subject (auto-filled from title if available)
- **From**: Your sender email address
- **Reply To**: Reply-to email address (optional)
- **Sender Name**: Your name (optional)

### 6. Send the Email

Click "Send Email" to send your newsletter. You'll receive a notification indicating success or failure.

## Frontmatter Support

The plugin supports the following frontmatter fields:

- `title`: Used as the default email subject
- `description`: Newsletter description
- `author`: Author name (used as sender name)
- `date`: Publication date
- `email`: Default recipient email
- `tags`: Newsletter tags
- `campaignId`: Automatically added when creating campaigns
- Any other custom fields

## API Integration

The plugin uses the Plunk API with the following endpoints:

### Send Email
```
POST https://api.useplunk.com/v1/send
```

### Create Campaign
```
POST https://api.useplunk.com/v1/campaigns
```

### Send Campaign
```
POST https://api.useplunk.com/v1/campaigns/send
```

### Get Contacts
```
GET https://api.useplunk.com/v1/contacts
```

### Request Headers:
- `Content-Type: application/json`
- `Authorization: Bearer {your-api-token}`

### Send Email Request Body:
```json
{
  "to": "recipient@example.com",
  "subject": "Newsletter Subject",
  "body": "<html>...</html>",
  "subscribed": true,
  "name": "Sender Name",
  "from": "sender@example.com",
  "reply": "reply@example.com",
  "headers": {},
  "attachments": {}
}
```

### Create Campaign Request Body:
```json
{
  "subject": "Campaign Subject",
  "body": "<html>...</html>",
  "recipients": ["email1@example.com", "email2@example.com"],
  "style": "PLUNK"
}
```

**Note:** The campaign will be sent to all contacts in your Plunk account. The plugin automatically fetches all contacts before creating the campaign.

### Send Campaign Request Body:
```json
{
  "id": "campaign_id",
  "live": true,
  "delay": 0
}
```

**Note:** This sends an existing campaign immediately to all recipients.

## Error Handling

The plugin provides detailed error messages for common issues:

- Missing API token
- Invalid email addresses
- Network connectivity issues
- API rate limiting
- Invalid request format

## Styling

The plugin includes custom CSS for the email modal interface, ensuring it integrates seamlessly with Obsidian's design system.

## Troubleshooting

### Common Issues

1. **"API token is required"**: Make sure you've entered your Plunk API token
2. **"Failed to send email"**: Check your internet connection and API token validity
3. **"No content to send"**: Ensure your markdown file has content
4. **"Invalid email format"**: Verify the email addresses are properly formatted

### Getting Help

If you encounter issues:

1. Check the Obsidian console for detailed error messages
2. Verify your Plunk API token is correct
3. Ensure your markdown file has valid frontmatter syntax
4. Test with a simple markdown file first

## Example Newsletter

See `example-newsletter.md` for a complete example of a newsletter with frontmatter and content.

## Example Campaign

See `example-campaign.md` for a complete example of a campaign-ready newsletter with medical content and appropriate tags.

## Security Notes

- Your Plunk API token is stored only in memory during the email sending process
- No credentials are saved to disk
- All API requests use HTTPS for secure transmission
- Consider using environment variables for API tokens in production environments
