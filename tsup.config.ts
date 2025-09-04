import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  splitting: true,
  treeshake: true,
  outDir: 'dist',
  target: 'es2020',
  platform: 'neutral',
  bundle: true,
  external: ['axios', 'zod'],
  esbuildOptions: (options) => {
    options.banner = {
      js: '// zdata-client - TypeScript client for zdata backend API',
    };
  },
});