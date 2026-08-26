import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dist = resolve('dist');
const portable = resolve('portable');
const standalone = resolve('standalone');
await rm(portable, { recursive: true, force: true });
await mkdir(portable);
await cp(dist, portable, { recursive: true });

const page = await readFile(resolve(portable, 'index.html'), 'utf8');
const cssFile = page.match(/href="\.\/(assets\/index-[^"]+\.css)"/)?.[1];
const jsFile = page.match(/src="\.\/(assets\/index-[^"]+\.js)"/)?.[1];
if (!cssFile || !jsFile) throw new Error('Не найдены production CSS или JS. Сначала выполните npm run build.');

const [css, js] = await Promise.all([
  readFile(resolve(portable, cssFile), 'utf8'),
  readFile(resolve(portable, jsFile), 'utf8')
]);

await writeFile(
  resolve(portable, 'index.html'),
  page
    .replace(/\s*<script type="module" crossorigin src="\.\/assets\/index-[^"]+\.js"><\/script>/, () => `\n  <script type="module">${js}</script>`)
    .replace(/\s*<link rel="stylesheet" crossorigin href="\.\/assets\/index-[^"]+\.css">/, () => `\n  <style>${css.replaceAll('../assets/', './assets/')}</style>`)
);

const mime = {
  '.avif': 'image/avif', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.html': 'text/html'
};
const assetUrl = async (path) => {
  const file = resolve(portable, 'assets', path);
  const type = mime[/(\.[^.]+)$/.exec(path)?.[1]] || 'application/octet-stream';
  return `data:${type};base64,${(await readFile(file)).toString('base64')}`;
};
const replaceAssets = async (html) => {
  const paths = [...new Set([...html.matchAll(/\.\/assets\/([\w./-]+)/g)].map(([, path]) => path))]
    .filter(path => !path.endsWith('/'));
  for (const path of paths) html = html.replaceAll(`./assets/${path}`, await assetUrl(path));
  return html;
};

let app = await readFile(resolve(portable, 'assets/embedded/plan-app.html'), 'utf8');
const [appCss, appJs] = await Promise.all([
  readFile(resolve(portable, 'assets/embedded/plan-app.css'), 'utf8'),
  readFile(resolve(portable, 'assets/embedded/plan-app.js'), 'utf8')
]);
app = app
  .replace('<link rel="stylesheet" href="./plan-app.css">', `<style>${appCss}</style>`)
  .replace('<script src="./plan-app.js"></script>', `<script>${appJs.replaceAll('</script', '<\\/script')}</script>`);
for (const path of [...new Set([...app.matchAll(/\.\/media\/([\w.-]+)/g)].map(([, file]) => file))]) {
  app = app.replaceAll(`./media/${path}`, await assetUrl(`embedded/media/${path}`));
}
const appUrl = `data:text/html;base64,${Buffer.from(app).toString('base64')}`;

let standalonePage = await readFile(resolve(portable, 'index.html'), 'utf8');
standalonePage = standalonePage
  .replaceAll('./assets/embedded/plan-app.html', appUrl);
const splitFiles = ['a.svg', 'b.svg', 'v.svg', 'g.svg', 'd.svg', 'e.svg', 'zh.svg', 'z.svg', 'i.svg', 'k.svg', 'l.svg', 'l-1.svg', 'm.svg', 'n.svg', 'o.svg', 'p.svg', 'r.svg', 's.svg', 't.svg'];
const splitSource = '["a.svg","b.svg","v.svg","g.svg","d.svg","e.svg","zh.svg","z.svg","i.svg","k.svg","l.svg","l-1.svg","m.svg","n.svg","o.svg","p.svg","r.svg","s.svg","t.svg"].map(C=>`./assets/split-letters/${C}`)';
if (!standalonePage.includes(splitSource)) throw new Error('Не найдены буквы интерактивной сцены.');
standalonePage = standalonePage.replace(splitSource, JSON.stringify(await Promise.all(splitFiles.map(file => assetUrl(`split-letters/${file}`)))));
standalonePage = await replaceAssets(standalonePage);

await rm(standalone, { recursive: true, force: true });
await mkdir(standalone);
await writeFile(resolve(standalone, 'index.html'), standalonePage);
