![Plunk It Logo](https://i.imgur.com/ZdgeY9S.png)
# Plunk It - Obsidian Email Plugin

Send emails and create campaigns directly from Obsidian using the Plunk API, with seamless frontmatter integration for email content management.

## Features

### 📧 Email Management
- **Send Individual Emails**: Send one-off emails to contacts in your Plunk account
- **Create Email Campaigns**: Create reusable campaigns with custom styling and frontmatter persistence
- **Update Campaigns**: Modify existing campaigns with new content, subject, and settings
- **Send Campaigns**: Send campaigns to your contact list with automatic recipient filtering

### 🎯 Advanced Filtering
- **Client Filtering**: Filter contacts by specific clients or send to all contacts
  - Clients are defined by Plunk contact metadata in the `data` field
  - Example contact data structure:
    ```json
    {
      "id": "5abe1f8f-108c-40c9-85c3-30b60340ae8f",
      "email": "hypernova@tanuj.xyz",
      "subscribed": true,
      "data": "{\"client\":\"hypernova\"}",
      "createdAt": "2025-08-17T02:16:34.809Z",
      "updatedAt": "2025-08-17T02:16:34.813Z"
    }
    ```
  - The `data` field contains JSON with client information (e.g., `{"client":"hypernova"}`)
  - You can filter campaigns to send only to contacts from specific clients
- **Subscription Filtering**: Send only to subscribed contacts or include unsubscribed users
- **Dynamic Recipient Updates**: Refresh recipient lists before sending campaigns

### 📝 Content Management
- **Markdown Support**: Write emails in Markdown with automatic HTML conversion
- **Frontmatter Integration**: All campaign settings are automatically saved to file frontmatter
- **Backlink Conversion**: Automatic conversion of Obsidian backlinks to URLs
  - Converts `[[Internal Note]]` to clickable web URLs
  - Uses your configured base URL (e.g., `https://lossless.group/notes/`)
  - Example: `[[Project Update]]` becomes `https://lossless.group/notes/backlink?query=[[Project%20Update]]`
  - Perfect for linking to published notes, documentation, or blog posts
- **Campaign Persistence**: Campaign IDs, settings, and configurations are saved in frontmatter

### 🎨 Styling Options
- **Multiple Email Styles**: Choose from different email templates (SANS, SERIF, HTML)
- **Custom Subjects**: Set campaign subjects that persist across sessions
- **Consistent Branding**: Maintain consistent styling across all campaigns

## Commands

### Send Individual Email
Send a one-off email to any recipient with custom styling and content options.

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
subject: "Your Email Subject"
selectedClients: ["all"]  # or specific client names
subscribedOnly: true      # or false
style: "SANS"            # email template style
---
```

### Frontmatter Properties

- **`campaignId`**: Unique identifier for the campaign (auto-generated)
- **`subject`**: Email subject line (used as campaign name)
- **`selectedClients`**: Array of client names to filter recipients (e.g., `["hypernova", "acme"]` or `["all"]`)
- **`subscribedOnly`**: Boolean to filter only subscribed contacts
- **`style`**: Email template style preference

## Setup

1. Install the plugin in Obsidian
2. Configure your Plunk API token in the plugin settings
3. Add contacts to your Plunk account
4. Start creating and sending emails!

## Configuration

### Required Settings
- **Plunk API Token**: Get your API token from the [Plunk Dashboard](https://app.useplunk.com/settings/api-keys)

### Optional Settings
- **Backlink URL Base**: Base URL for converting Obsidian backlinks to web URLs
  - **Setup**: Go to Obsidian Settings → Community Plugins → Plunk It → Settings
  - **Format**: Enter your base URL (e.g., `https://lossless.group/notes/`)
  - **How it works**: When you use `[[Note Title]]` in your email content, it gets converted to `https://lossless.group/notes/Note%20Title`
  - **Use cases**: Link to published notes, documentation, blog posts, or any web-accessible content
  - **Example**: If your note is published at `https://lossless.group/notes/project-update-2024`, set the base URL to `https://lossless.group/notes/`

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

## Use Cases

This plugin is perfect for:
- **Business Communications**: Send updates, announcements, and reports
- **Content Marketing**: Distribute blog posts, articles, and newsletters
- **Client Updates**: Send project updates, invoices, and status reports
- **Personal Emails**: Send formatted personal emails with rich content
- **Educational Content**: Distribute course materials, tutorials, and guides
- **Event Management**: Send invitations, reminders, and follow-ups

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
