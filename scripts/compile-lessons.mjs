import { readFile, writeFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const directory = resolve(root, 'content/learn');
const manifest = JSON.parse(await readFile(resolve(directory, 'manifest.json'), 'utf8'));
const paths = new Map();
for (const chapter of manifest.chapters) {
  for (const locale of ['ko', 'en']) {
    paths.set(resolve(directory, chapter[locale].file), `${locale === 'en' ? '/en' : ''}/learn/${chapter.slug}`);
  }
}
for (const locale of ['ko', 'en']) {
  paths.set(resolve(directory, `00-series-list.${locale}.md`), `${locale === 'en' ? '/en' : ''}/learn`);
}
const articles = {};
for (const chapter of manifest.chapters) {
  articles[chapter.slug] = {};
  for (const locale of ['ko', 'en']) {
    const file = resolve(directory, chapter[locale].file);
    const raw = await readFile(file, 'utf8');
    // The page supplies the title, series metadata, and previous/next navigation.
    const sections = raw.trim().split(/\n\s*\n/);
    if (!sections[0].startsWith('# ') || !sections[1].includes(' · ')) throw new Error(`Unexpected manuscript header: ${file}`);
    let content = sections.slice(2).join('\n\n').replace(/\n---\n\n\[(?:이전|다음|시리즈|Previous|Next|Series)[\s\S]*$/, '');
    content = content.replace(/\]\(([^)]+)\)/g, (match, href) => {
      if (/^(?:https?:|#)/.test(href)) return match;
      if (href.startsWith('../assets/') && href.endsWith('.png')) return `](/learn-assets/${href.slice('../assets/'.length)})`;
      const url = paths.get(resolve(dirname(file), href));
      if (!url) throw new Error(`Unresolved manuscript link: ${file}: ${href}`);
      return `](${url})`;
    });
    for (const image of content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
      await access(resolve(root, 'public', image[1].slice(1)));
    }
    articles[chapter.slug][locale] = content.trim() + '\n';
  }
}
await writeFile(resolve(directory, 'articles.generated.json'), JSON.stringify(articles, null, 2) + '\n');
console.log(`Compiled ${manifest.chapters.length * 2} lessons with resolved publication links.`);
