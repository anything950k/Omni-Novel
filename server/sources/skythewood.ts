import { NovelSource, SourceMetadata, NovelItem, SourceNovel, ChapterItem } from '../types';
import { fetchText } from '../fetcher';
import * as cheerio from 'cheerio';

export class SkyTheWoodSource implements NovelSource {
  metadata: SourceMetadata = {
    id: 'skythewood',
    name: 'Skythewood Translations',
    site: 'https://skythewood.blogspot.com',
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
    description: 'Renowned Japanese light novel translation group behind Overlord, Youjo Senki, and Gifting.',
  };

  private cachedNovels: NovelItem[] | null = null;

  private async getNovelsList(): Promise<NovelItem[]> {
    if (this.cachedNovels && this.cachedNovels.length > 0) {
      return this.cachedNovels;
    }

    const html = await fetchText('https://skythewood.blogspot.com/p/done.html');
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.post-body a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const title = $(el).text().trim();
      if (
        title &&
        href &&
        (href.includes('skythewood.blogspot.com/p/') || href.includes('skythewood.blogspot.sg/p/'))
      ) {
        if (!novels.some(n => n.name === title || n.path === href)) {
          novels.push({
            name: title,
            path: href,
            cover: 'https://1.bp.blogspot.com/-i8zU_iXqZg0/Vb-G6K-0fAI/AAAAAAAAE_w/1X3M4M4_7tE/s1600/logo.png',
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
    const all = await this.getNovelsList();
    const pageSize = 20;
    const start = (pageNo - 1) * pageSize;
    return all.slice(start, start + pageSize);
  }

  async searchNovels(searchTerm: string, pageNo: number = 1): Promise<NovelItem[]> {
    const all = await this.getNovelsList();
    const lower = searchTerm.toLowerCase();
    const filtered = all.filter(n => n.name.toLowerCase().includes(lower));
    const pageSize = 20;
    const start = (pageNo - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }

  async parseNovel(novelPath: string): Promise<SourceNovel> {
    const html = await fetchText(novelPath);
    const $ = cheerio.load(html);

    const name = $('.post-title').text().trim() || 'Novel Details';
    const cover = $('.post-body img').first().attr('src') || '';
    const summary = $('.post-body p').slice(0, 3).text().trim();

    const chapters: ChapterItem[] = [];
    let chIdx = 1;

    $('.post-body a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const title = $(el).text().trim();
      if (href && title && href.includes('skythewood.blogspot')) {
        chapters.push({
          name: title,
          path: href,
          chapterNumber: chIdx++,
        });
      }
    });

    return {
      name,
      path: novelPath,
      cover,
      summary,
      status: 'Completed',
      chapters,
      sourceId: this.metadata.id,
      sourceName: this.metadata.name,
    };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const html = await fetchText(chapterPath);
    const $ = cheerio.load(html);
    return $('.post-body').html() || '';
  }
}
