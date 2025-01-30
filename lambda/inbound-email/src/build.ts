import * as esbuild from 'esbuild';

async function build() {
    try {
        await esbuild.build({
            entryPoints: ['src/index.ts'],
            bundle: true,
            platform: 'node',
            target: 'node18',
            outfile: 'dist/index.js',
            external: [], // Add any external dependencies here if needed
            minify: true,
            sourcemap: true,
        });
        console.log('Build complete');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build(); 