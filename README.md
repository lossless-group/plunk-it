# Plunk It - Obsidian Email Plugin

Send emails and create campaigns directly from Obsidian using the Plunk API, with seamless frontmatter integration for campaign management.

## Features

### 📧 Email Management
- **Send Individual Emails**: Send one-off emails to contacts in your Plunk account
- **Create Email Campaigns**: Create reusable campaigns with custom styling and frontmatter persistence
- **Update Campaigns**: Modify existing campaigns with new content, subject, and settings
- **Send Campaigns**: Send campaigns to your contact list with automatic recipient filtering

### 🎯 Advanced Filtering
- **Client Filtering**: Filter contacts by specific clients or send to all contacts
- **Subscription Filtering**: Send only to subscribed contacts or include unsubscribed users
- **Dynamic Recipient Updates**: Refresh recipient lists before sending campaigns

### 📝 Content Management
- **Markdown Support**: Write emails in Markdown with automatic HTML conversion
- **Frontmatter Integration**: All campaign settings are automatically saved to file frontmatter
- **Backlink Conversion**: Automatic conversion of Obsidian backlinks to URLs
- **Campaign Persistence**: Campaign IDs, settings, and configurations are saved in frontmatter

### 🎨 Styling Options
- **Multiple Email Styles**: Choose from different email templates (SANS, etc.)
- **Custom Subjects**: Set campaign subjects that persist across sessions
- **Consistent Branding**: Maintain consistent styling across all campaigns

## Commands

### Send Email
Send a one-off email to contacts in your Plunk account with custom styling and filtering options.

### Create Email Campaign
Create a new email campaign that can be reused and sent multiple times. Campaign settings are automatically saved to frontmatter:
- Campaign ID
- Subject line
- Client filters
- Subscription filters
- Email style preferences

### Update Email Campaign
Update an existing campaign with new content, subject, and settings. All changes are automatically saved to frontmatter.

### Send Email Campaign
Send an existing campaign to your contact list using the filters and settings stored in frontmatter.

## Frontmatter Integration

The plugin automatically manages frontmatter properties in your markdown files:

```yaml
---
campaignId: "camp_123456789"
subject: "Your Campaign Subject"
selectedClients: ["all"]  # or specific client names
subscribedOnly: true      # or false
style: "SANS"            # email template style
---
```

### Frontmatter Properties

- **`campaignId`**: Unique identifier for the campaign (auto-generated)
- **`subject`**: Campaign subject line (used as campaign name)
- **`selectedClients`**: Array of client names to filter recipients
- **`subscribedOnly`**: Boolean to filter only subscribed contacts
- **`style`**: Email template style preference

## Setup

1. Install the plugin in Obsidian
2. Configure your Plunk API token in the plugin settings
3. Add contacts to your Plunk account
4. Start creating and sending campaigns!

## Configuration

### Required Settings
- **Plunk API Token**: Get your API token from the [Plunk Dashboard](https://app.useplunk.com/settings/api-keys)

### Optional Settings
- **Backlink URL Base**: Base URL for converting Obsidian backlinks to web URLs

## Workflow

### Creating a Campaign
1. Open a markdown file in Obsidian
2. Run "Create Email Campaign" command
3. Set your subject, filters, and styling preferences
4. Click "Create" - campaign settings are saved to frontmatter
5. Campaign ID is automatically added to frontmatter

### Updating a Campaign
1. Open a file with an existing campaign
2. Run "Update Email Campaign" command
3. Modify content, subject, or settings
4. Click "Update" - all changes are saved to frontmatter and Plunk

### Sending a Campaign
1. Open a file with an existing campaign
2. Run "Send Email Campaign" command
3. Optionally refresh recipients using current filters
4. Click "Send" - campaign is sent using frontmatter settings

## Development

```bash
pnpm install
pnpm build
pnpm dev
```

## Dependencies

- **marked**: For Markdown to HTML conversion
- **Obsidian API**: For plugin integration and file management

## License

The Unlicense
