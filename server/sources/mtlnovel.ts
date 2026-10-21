import { NovelSource, SourceMetadata, NovelItem, SourceNovel, ChapterItem } from '../types';
import { fetchText } from '../fetcher';
import * as cheerio from 'cheerio';

export class MTLNovelSource implements NovelSource {
  metadata: SourceMetadata = {
    id: 'mtlnovel',
    name: 'MTLNovel',
    site: 'https://www.mtlnovels.com',
    version: '1.1.3',
    type: 'mtl',
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
    description: 'Massive library of machine translated Chinese, Korean, and Japanese web fiction.',
  };

  async popularNovels(pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.metadata.site}/alltime-rank/page/${pageNo}/`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.box.list-item, .list-item').each((_, el) => {
      const a = $(el).find('a.list-title').first();
      const href = a.attr('href') || '';
      const name = a.text().trim();
      const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';

      if (href && name) {
        novels.push({
          name,
          path: href.replace(this.metadata.site, '').replace(/^\//, ''),
          cover: img.startsWith('http') ? img : `${this.metadata.site}/${img.replace(/^\//, '')}`,
          sourceId: this.metadata.id,
          sourceName: this.metadata.name,
        });
      }
    });

    return novels;
  }

  async searchNovels(searchTerm: string, pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.metadata.site}/page/${pageNo}/?s=${encodeURIComponent(searchTerm)}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.box.list-item, .list-item').each((_, el) => {
      const a = $(el).find('a.list-title').first();
      const href = a.attr('href') || '';
      const name = a.text().trim();
      const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';

      if (href && name) {
        novels.push({
          name,
          path: href.replace(this.metadata.site, '').replace(/^\//, ''),
          cover: img.startsWith('http') ? img : `${this.metadata.site}/${img.replace(/^\//, '')}`,
          sourceId: this.metadata.id,
          sourceName: this.metadata.name,
        });
      }
    });

    return novels;
  }

  async parseNovel(novelPath: string): Promise<SourceNovel> {
    const cleanPath = novelPath.startsWith('/') ? novelPath.slice(1) : novelPath;
    const url = `${this.metadata.site}/${cleanPath}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);

    const name = $('h1.entry-title').first().text().trim() || 'Novel Details';
    const cover = $('.nov-head img').first().attr('src') || '';
    const summary = $('.desc').first().text().trim();
    const author = $('#author a').first().text().trim();
    const status = $('#status a').first().text().trim() || 'Ongoing';

    const chapters: ChapterItem[] = [];
    // MTLNovel chapter list page
    const listUrl = `${url.replace(/\/$/, '')}/chapter-list/`;
    try {
      const listHtml = await fetchText(listUrl);
      const $ch = cheerio.load(listHtml);
      $ch('.ch-list a').each((idx, el) => {
        const href = $ch(el).attr('href') || '';
        const title = $ch(el).text().trim();
        if (href && title) {
          chapters.push({
            name: title,
            path: href.replace(this.metadata.site, '').replace(/^\//, ''),
            chapterNumber: idx + 1,
          });
        }
      });
    } catch {
      // Fallback to inline links
      $('.ch-list a').each((idx, el) => {
        const href = $(el).attr('href') || '';
        const title = $(el).text().trim();
        if (href && title) {
          chapters.push({
            name: title,
            path: href.replace(this.metadata.site, '').replace(/^\//, ''),
            chapterNumber: idx + 1,
          });
        }
      });
    }

    return {
      name,
      path: cleanPath,
      cover: cover.startsWith('http') ? cover : `${this.metadata.site}/${cover.replace(/^\//, '')}`,
      summary,
      author,
      status,
      chapters,
      sourceId: this.metadata.id,
      sourceName: this.metadata.name,
    };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const cleanPath = chapterPath.startsWith('/') ? chapterPath.slice(1) : chapterPath;
    const url = `${this.metadata.site}/${cleanPath}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);

    $('.par-ads, script, style').remove();
    return $('.par').html() || '';
  }
}
