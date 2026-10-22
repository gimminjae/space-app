import { readFile, writeFile, mkdir, access, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = process.cwd(), directory = resolve(root, 'content/etf');
const manifest = JSON.parse(await readFile(resolve(directory, 'manifest.json'), 'utf8'));
const articles = {};
for (const item of manifest.articles) {
  articles[item.slug] = {};
  for (const locale of ['ko', 'en']) {
    const file = resolve(directory, locale, `${item.slug}.md`);
    const raw = (await readFile(file, 'utf8')).trim();
    if (!raw.startsWith(`# ${item[locale].title}\n`)) throw new Error(`Title mismatch: ${file}`);
    const content = raw.slice(raw.indexOf('\n') + 1).trim();
    for (const image of content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) await access(resolve(root, 'public', image[1].slice(1)));
    const prose = content.replace(/!?\[([^\]]*)\]\([^)]+\)/g, '$1').replace(/[#*|_`]/g, '');
    item[locale].wordCount = prose.trim().split(/\s+/).length;
    item[locale].characterCount = prose.length;
    // A deliberate beginner pace, plus one minute to read a figure and table.
    item[locale].readingMinutes = Math.ceil((locale === 'ko' ? prose.length / 550 : item[locale].wordCount / 180) + 1);
    if (item[locale].readingMinutes < 5 || item[locale].readingMinutes > 15) throw new Error(`Reading length outside 5–15 minutes: ${file}`);
    await access(resolve(root, 'public', item[locale].ogImage.slice(1)));
    articles[item.slug][locale] = content + '\n';
    await mkdir(resolve(root, 'public/etf-files', locale), { recursive: true });
    await copyFile(file, resolve(root, 'public/etf-files', locale, `${item.slug}.md`));
  }
}
await writeFile(resolve(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
await writeFile(resolve(directory, 'articles.generated.json'), JSON.stringify(articles, null, 2) + '\n');
console.log(`Compiled ${manifest.articles.length * 2} ETF articles and Markdown downloads.`);
