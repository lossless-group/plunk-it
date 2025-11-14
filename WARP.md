# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository Overview

**Plunk It** is an Obsidian plugin for sending emails and creating campaigns directly from Obsidian using the Plunk API. It features seamless frontmatter integration, advanced contact filtering, and automatic backlink conversion for email content management.

## Common Commands

### Development
```bash
# Install dependencies
pnpm install

# Development mode with watch (auto-rebuilds JS and CSS on changes)
pnpm dev

# Production build
pnpm build

# Type check without emitting
tsc -noEmit -skipLibCheck

# Initial plugin setup (creates symlink to Obsidian vault)
pnpm setup
```

### Obsidian Development Setup
```bash
# Create symbolic link to Obsidian plugins folder (macOS/Linux)
ln -s $(pwd) /path/to/obsidian/vault/.obsidian/plugins/plunk-it

# Windows (PowerShell)
New-Item -ItemType SymbolicLink -Path "C:\path\to\vault\.obsidian\plugins\plunk-it" -Target "C:\path\to\plunk-it"

# Or use the setup script
pnpm setup
```

### Version Management
```bash
# Bump version (updates manifest.json and versions.json)
pnpm version
```

## Architecture

### File Structure

**Core Files**:
- `main.ts` - Plugin entry point with command registration (6.6KB)
- `manifest.json` - Plugin metadata for Obsidian
- `main.css` - Generated CSS output
- `styles.css` - Generated CSS from source

**Source Organization** (`src/`):
- `modals/` - Modal UI components (email, campaign creation/update/send)
- `services/` - API integration with Plunk
- `settings/` - Plugin settings tab
- `types/` - TypeScript type definitions
- `styles/` - CSS source files

**Configuration Files**:
- `esbuild.config.mjs` - Dual build system (JS + CSS with separate contexts)
- `tsconfig.json` - TypeScript compiler (strict mode)
- `plugin-config.yaml` - Plugin configuration
- `setup-plugin.mjs` - Setup script for creating Obsidian symlinks

### Key Features

**1. Frontmatter Integration**
All campaign settings automatically persist in note frontmatter:
- `campaignId` - Unique campaign identifier
- `subject` - Email subject line
- `selectedClients` - Contact filter values (e.g., `["all"]`, `["hypernova", "acme"]`)
- `subscribedOnly` - Boolean for subscription filtering
- `style` - Email template style (SANS, SERIF, HTML)

**2. Contact Filtering**
Advanced filtering using Plunk contact metadata:
- Filter by any metadata key (configurable, defaults to "client")
- Filter by subscription status
- Dynamic recipient list updates

**3. Backlink Conversion**
Automatic conversion of Obsidian `[[backlinks]]` to web URLs:
- Configurable base URL (e.g., `https://lossless.group/notes/`)
- Converts `[[Note Title]]` to `https://lossless.group/notes/[[Note%20Title]]`

**4. Markdown Support**
Uses `marked` library to convert Markdown content to HTML for emails

### Build System

**Dual esbuild contexts**:
- **JS Context**: Bundles `main.ts` → `main.js`
  - Target: ES2022
  - Format: CommonJS (required by Obsidian)
  - External: Obsidian API, Electron, CodeMirror
  - Dev: Watch mode with inline sourcemaps
  - Production: Minified, no sourcemaps

- **CSS Context**: Bundles `src/styles/modals.css` → `styles.css`
  - Separate build process
  - Dev: Watch mode with inline sourcemaps
  - Production: Minified, no sourcemaps

Both contexts run in parallel during development for live reloading.

### TypeScript Configuration

Extremely strict TypeScript settings:
- `strict: true` with all sub-flags
- `noUnusedLocals`, `noUnusedParameters`
- `exactOptionalPropertyTypes`
- `noImplicitReturns`
- `noUncheckedIndexedAccess`

## Commands Available in Plugin

### Email Commands
- **Send Individual Email** - Send one-off email to any recipient
- **Create Email Campaign** - Create reusable campaign with frontmatter persistence
- **Update Email Campaign** - Modify existing campaign (content, subject, settings)
- **Send Email Campaign** - Send campaign to filtered contact list

## Plugin Configuration

### Required Settings
- **Plunk API Token** - Get from [Plunk Dashboard](https://app.useplunk.com/settings/api-keys)

### Optional Settings
- **Contact Filter Key** - Metadata key for filtering contacts (default: "client")
- **Backlink URL Base** - Base URL for converting Obsidian backlinks to web URLs

## Development Workflow

1. **Make changes** to `main.ts` or files in `src/`
2. **Build** (dev watch mode auto-rebuilds): `pnpm dev`
3. **Test in Obsidian**: Reload plugin (`Cmd/Ctrl + R` in dev mode)
4. **Check console**: `Cmd/Ctrl + Shift + I` for errors
5. **Iterate**: Edit → auto-rebuild → test

## API Integration

### Plunk API Endpoints
- `POST /v1/emails` - Send individual email
- `POST /v1/campaigns` - Create campaign
- `PUT /v1/campaigns/:id` - Update campaign
- `POST /v1/campaigns/:id` - Send campaign
- `GET /v1/contacts` - Fetch contacts for filtering

### Contact Metadata Structure
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "subscribed": true,
  "data": "{\"client\":\"hypernova\", \"company\":\"acme\"}",
  "createdAt": "2025-08-17T02:16:34.809Z",
  "updatedAt": "2025-08-17T02:16:34.813Z"
}
```

The `data` field contains JSON with custom metadata for filtering.

## Important Notes

- **Desktop only**: Plugin marked as `isDesktopOnly: true` in manifest
- **Frontmatter persistence**: All campaign settings automatically saved to file frontmatter
- **Dual build system**: Separate esbuild contexts for JS and CSS with parallel watch
- **Strict TypeScript**: Code must satisfy very strict type checking
- **No automated tests**: Manual testing in Obsidian required
- **Markdown conversion**: Uses `marked` library for Markdown → HTML
- **Obsidian API**: External dependency, not bundled
