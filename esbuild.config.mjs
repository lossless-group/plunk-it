import esbuild from 'esbuild';
import process from 'node:process';
import builtins from 'builtin-modules';

const banner = `/*
 * Plunk It Plugin for Obsidian
 * Generated: ${new Date().toISOString()}
 * Build: ${process.env.NODE_ENV || 'development'}
 */`;

const isProduction = process.argv[2] === 'production' || process.env.NODE_ENV === 'production';

const external = [
  'obsidian',
  'electron',
  '@codemirror/autocomplete',
  '@codemirror/collab',
  '@codemirror/commands',
  '@codemirror/language',
  '@codemirror/lint',
  '@codemirror/search',
  '@codemirror/state',
  '@codemirror/view',
  '@lezer/common',
  '@lezer/highlight',
  '@lezer/lr',
  ...builtins
];

// Create separate build contexts for JS and CSS
const jsContext = await esbuild.context({
  banner: {
    js: banner,
  },
  entryPoints: ['main.ts'],
  bundle: true,
  external: [...external],
  format: 'cjs',
  platform: 'node',
  target: 'es2022',
  treeShaking: true,
  sourcemap: !isProduction ? 'inline' : false,
  minify: isProduction,
  define: {
    'process.env.NODE_ENV': `"${isProduction ? 'production' : 'development'}"`,
  },
  logLevel: 'info',
  outfile: 'main.js',
});

const cssContext = await esbuild.context({
  entryPoints: ['src/styles/modals.css'],
  bundle: true,
  sourcemap: !isProduction ? 'inline' : false,
  minify: isProduction,
  logLevel: 'info',
  outfile: 'styles.css',
  loader: { '.css': 'css' },
});

if (isProduction) {
  // Build both JS and CSS for production
  await Promise.all([
    jsContext.rebuild(),
    cssContext.rebuild()
  ]);
  process.exit(0);
} else {
  // Enable watch mode for both JS and CSS in development
  await Promise.all([
    jsContext.watch(),
    cssContext.watch()
  ]);
  console.log('Watching for changes in JS and CSS...');
}
