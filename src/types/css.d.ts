// esbuild handles CSS imports at bundle time; this ambient declaration
// keeps tsc (bundler moduleResolution) happy about the side-effect import.
declare module '*.css';
