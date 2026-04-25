import { promises as fs } from 'node:fs';
import path from 'node:path';

const dbPath = path.join(process.cwd(), 'server', 'data', 'db.json');

const articleImage = (index) => `https://picsum.photos/id/${1015 + (index % 30)}/1200/675`;
const magazineCover = (index) => `https://picsum.photos/id/${1025 + (index % 30)}/800/1200`;
const magazinePage = (index, page) => `https://picsum.photos/id/${1050 + ((index * 5 + page) % 30)}/1200/1800`;

async function main() {
  const raw = await fs.readFile(dbPath, 'utf8');
  const db = JSON.parse(raw);

  const articles = Array.isArray(db.articles) ? db.articles : [];
  const magazines = Array.isArray(db.magazines) ? db.magazines : [];

  articles.forEach((article, i) => {
    article.image = articleImage(i);
  });

  magazines.forEach((magazine, i) => {
    magazine.coverImage = magazineCover(i);
    const existingPages = Array.isArray(magazine.pages) ? magazine.pages : [];
    const pageCount = Math.max(existingPages.length || 0, 2);
    magazine.pages = Array.from({ length: pageCount }, (_, pageIndex) => magazinePage(i, pageIndex));
  });

  await fs.writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`, 'utf8');
  console.log(`Updated ${articles.length} articles and ${magazines.length} magazines.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
