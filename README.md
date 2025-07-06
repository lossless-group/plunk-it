# Cite Wide Obsidian Plugin

An Obsidian plugin for rigorous, vault-wide citation management. Converts numeric footnotes into unique hex-codes, logs unique hex codes and their reference information into a base, assures consistent hex codes per reference.

## Unique Hex Code Generation

This plugin will iterate through numeric footnotes in a file or directory and convert them into unique hex-codes. The hex-codes will be logged into a base, and the footnotes will be updated to use the hex-codes. The hex-codes will be generated using a consistent algorithm that ensures the same reference always generates the same hex-code.

# Getting Started

```
pnpm install
pnpm add -D esbuild @types/node builtin-modules
pnpm build
pnpm dev
```

