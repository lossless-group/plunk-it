# Obsidian Plugin Starter

This is barebones starter code to build an Obsidian plugin.  It is a clone of the official Obsidian plugin starter code, but with updated libraries.

## Getting Started

```
pnpm install
pnpm add -D esbuild @types/node builtin-modules
pnpm build
pnpm dev
```

## Using Symbolic Links to Test Your Plugin

If you're like us, you have a directory housing all your code projects. To use your plugin as you develop it, just create a symbolic link. Here is my example, but you will need to use your own path structure:

```bash
ln -s /Users/mpstaton/code/lossless-monorepo/obsidian-plugin-starter /Users/mpstaton/content-md/lossless/.obsidian/plugins/
```
