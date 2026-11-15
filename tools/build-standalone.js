// Builds star-heist-standalone.html: the whole game in ONE file, for sharing or opening as a file on a phone
// (a copy opened from Files, Drive or a chat app can't load the separate game files, so it gets stuck).
// Not for YouTube: the Playables upload is still star-heist-playables.zip from tools/build.js.
// Run: node tools/build.js && node tools/build-standalone.js   (needs esbuild: npm i -D esbuild)
const fs = require('fs'), path = require('path');
let esbuild; try { esbuild = require('esbuild'); } catch (e) { console.error('esbuild is missing: run  npm i -D esbuild'); process.exit(1); }
const root = path.resolve(__dirname, '..'), dist = path.join(root, 'dist');
if (!fs.existsSync(path.join(dist, 'game.js'))) { console.error('run node tools/build.js first'); process.exit(1); }
const js = esbuild.buildSync({ entryPoints: [path.join(dist, 'game.js')], bundle: true, format: 'esm', minify: true, write: false, legalComments: 'none' }).outputFiles[0].text;
let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const sdk = /<!-- YouTube Playables SDK[^\n]*\n<script src="https:\/\/www\.youtube\.com\/game_api\/v1"><\/script>\n/;
if (!sdk.test(html)) throw new Error('SDK tag not found in dist/index.html');
html = html.replace(sdk, ''); // no YouTube SDK outside YouTube: the game falls back to saving in the browser
const tag = /<script type="module" src="game\.js"[^>]*><\/script>/;
if (!tag.test(html)) throw new Error('game.js script tag not found');
html = html.replace(tag, () => '<script type="module">\n' + js.replace(/<\/script/gi, '<\\/script') + '\n</script>');
if (/window\.__sh\s*=/.test(html)) throw new Error('debug hook found in standalone build');
const out = path.join(root, 'star-heist-standalone.html');
fs.writeFileSync(out, html);
console.log(`wrote ${path.basename(out)} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
