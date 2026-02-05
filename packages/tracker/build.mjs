import * as esbuild from 'esbuild';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const isWatch = process.argv.includes('--watch');

const sharedConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  sourcemap: true,
  target: ['es2020'],
  define: {
    __VERSION__: JSON.stringify(pkg.version),
  },
};

// IIFE build - the script tag version (smallest possible)
const iifeConfig = {
  ...sharedConfig,
  outfile: 'dist/tracker.js',
  format: 'iife',
  globalName: 'OpenObservability',
  minify: true,
  // Drop console in production for minimal size
  drop: [],
};

// ESM build - for npm/bundler usage
const esmConfig = {
  ...sharedConfig,
  outfile: 'dist/tracker.esm.js',
  format: 'esm',
  minify: false,
};

async function build() {
  if (isWatch) {
    const iifeCtx = await esbuild.context(iifeConfig);
    const esmCtx = await esbuild.context(esmConfig);
    await Promise.all([iifeCtx.watch(), esmCtx.watch()]);
    console.log('Watching for changes...');
  } else {
    const [iifeResult, esmResult] = await Promise.all([
      esbuild.build({ ...iifeConfig, metafile: true }),
      esbuild.build({ ...esmConfig, metafile: true }),
    ]);

    const iifeSize = Object.values(iifeResult.metafile.outputs).reduce(
      (acc, o) => acc + o.bytes,
      0,
    );
    const esmSize = Object.values(esmResult.metafile.outputs).reduce(
      (acc, o) => acc + o.bytes,
      0,
    );

    console.log(`IIFE bundle: ${(iifeSize / 1024).toFixed(2)} KB`);
    console.log(`ESM bundle:  ${(esmSize / 1024).toFixed(2)} KB`);
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
