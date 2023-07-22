import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.js'],
  bundle: true,
  platform: 'node',
  target: ['node18'],
  packages: 'external',
  outfile: 'dist/bundle.js',
});
