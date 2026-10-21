import { NovelSource, SourceMetadata, NovelItem, SourceNovel, ChapterItem } from '../types';
import { fetchJson, fetchText } from '../fetcher';
import * as cheerio from 'cheerio';

export class DivineDaoLibrarySource implements NovelSource {
  metadata: SourceMetadata = {
    id: 'divinedaolibrary',
    name: 'Divine Dao Library',
    site: 'https://divinedaolibrary.com',
    version: '1.0.0',
    type: 'translation-group',
    languages: ['en'],
    features: {
      popular: true,
      search: true,
      novelDetails: true,
      chapters: true,
      reader: true,
      filters: false,
    },
    cloudProtected: false,
    description: 'Premier translation group for Martial Peak and prominent Chinese cultivation novels.',
  };

  private cachedNovels: NovelItem[] | null = null;

  private async getNovels(): Promise<NovelItem[]> {
    if (this.cachedNovels && this.cachedNovels.length > 0) {
      return this.cachedNovels;
    }

    const html = await fetchText(`${this.metadata.site}/novels/`);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.entry-content ul li a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const name = $(el).text().trim();
      if (href && name && href.startsWith(this.metadata.site)) {
        const slug = href.replace(this.metadata.site, '').replace(/^\/+|\/+$/g, '');
        if (slug && !novels.some(n => n.path === slug)) {
          novels.push({
            name,
            path: slug,
            cover: 'https://divinedaolibrary.com/wp-content/uploads/2020/05/cropped-DDL-Icon-192x192.png',
            sourceId: this.metadata.id,
            sourceName: this.metadata.name,
          });
        }
      }
    });

    this.cachedNovels = novels;
    return novels;
  }

  async popularNovels(pageNo: number = 1): Promise<NovelItem[]> {
    const all = await this.getNovels();
    const pageSize = 20;
    const start = (pageNo - 1) * pageSize;
    return all.slice(start, start + pageSize);
  }

  async searchNovels(searchTerm: string, pageNo: number = 1): Promise<NovelItem[]> {
    const all = await this.getNovels();
    const lower = searchTerm.toLowerCase();
    const filtered = all.filter(n => n.name.toLowerCase().includes(lower));
    const pageSize = 20;
    const start = (pageNo - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }

  async parseNovel(novelPath: string): Promise<SourceNovel> {
    const slug = novelPath.replace(/^\/+|\/+$/g, '');
    const apiUrl = `${this.metadata.site}/wp-json/wp/v2/pages?slug=${slug}`;
    const pageData = await fetchJson<any[]>(apiUrl);

    if (!pageData || pageData.length === 0) {
      // Fallback to direct page fetch
      const html = await fetchText(`${this.metadata.site}/${slug}/`);
      const $ = cheerio.load(html);
      const name = $('h1.entry-title').text().trim() || slug;
      const cover = $('.entry-content img').first().attr('src') || '';
      const summary = $('.entry-content p').first().text().trim();
      const chapters: ChapterItem[] = [];

      $('.entry-content a').each((idx, el) => {
        const href = $(el).attr('href') || '';
        const title = $(el).text().trim();
        if (href && title && href.startsWith(this.metadata.site) && !href.endsWith('/novels/')) {
          const chSlug = href.replace(this.metadata.site, '').replace(/^\/+|\/+$/g, '');
          chapters.push({
            name: title,
            path: chSlug,
            chapterNumber: idx + 1,
          });
        }
      });

      return {
        name,
        path: slug,
        cover,
        summary,
        chapters,
        sourceId: this.metadata.id,
        sourceName: this.metadata.name,
      };
    }

    const page = pageData[0];
    const name = page.title?.rendered || slug;
    const content = page.content?.rendered || '';
    const $ = cheerio.load(content);
    const cover = $('img').first().attr('src') || '';
    const summary = $('p').first().text().trim();

    const chapters: ChapterItem[] = [];
    $('li a, p a').each((idx, el) => {
      const href = $(el).attr('href') || '';
      const title = $(el).text().trim();
      if (href && title && href.startsWith(this.metadata.site)) {
        const chSlug = href.replace(this.metadata.site, '').replace(/^\/+|\/+$/g, '');
        chapters.push({
          name: title,
          path: chSlug,
          chapterNumber: idx + 1,
        });
      }
    });

    return {
      name,
      path: slug,
      cover,
      summary,
      chapters,
      sourceId: this.metadata.id,
      sourceName: this.metadata.name,
    };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const slug = chapterPath.replace(/^\/+|\/+$/g, '');
    const apiUrl = `${this.metadata.site}/wp-json/wp/v2/posts?slug=${slug}`;
    const posts = await fetchJson<any[]>(apiUrl).catch(() => []);

    if (posts && posts.length > 0) {
      const post = posts[0];
      return `<h1>${post.title?.rendered}</h1>\n${post.content?.rendered}`;
    }

    const html = await fetchText(`${this.metadata.site}/${slug}/`);
    const $ = cheerio.load(html);
    $('.sharedaddy, .adsbygoogle, .code-block').remove();
    return $('.entry-content').html() || '';
  }
}
