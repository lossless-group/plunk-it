# Plunk It - Obsidian Email Plugin

Send emails and create campaigns directly from Obsidian using the Plunk API.

## Features

- **Send Individual Emails**: Send one-off emails to contacts in your Plunk account
- **Create Email Campaigns**: Create reusable campaigns with custom styling
- **Update Campaigns**: Modify existing campaigns with new content and settings
- **Send Campaigns**: Send campaigns to your contact list
- **Client Filtering**: Filter contacts by specific clients
- **Subscription Filtering**: Send only to subscribed contacts
- **Markdown Support**: Write emails in Markdown with automatic HTML conversion

## Commands

### Send Email
Send a one-off email to contacts in your Plunk account.

### Create Email Campaign
Create a new email campaign that can be reused and sent multiple times.

### Update Email Campaign
Update an existing campaign with new content and settings.

### Send Email Campaign
Send an existing campaign to your contact list.

## Setup

1. Install the plugin in Obsidian
2. Configure your Plunk API token in the plugin settings
3. Add contacts to your Plunk account
4. Start sending emails and creating campaigns!

## Configuration

### Plunk API Token
Get your API token from the [Plunk Dashboard](https://app.useplunk.com/settings/api-keys).

## Development

```bash
pnpm install
pnpm build
pnpm dev
```

## Dependencies

- **marked**: For Markdown to HTML conversion
- **Obsidian API**: For plugin integration

## License

The Unlicense
