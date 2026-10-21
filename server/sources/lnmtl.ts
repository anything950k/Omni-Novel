import { NovelSource, SourceMetadata, NovelItem, SourceNovel, ChapterItem } from '../types';
import { fetchText } from '../fetcher';
import * as cheerio from 'cheerio';

export class LNMTLSource implements NovelSource {
  metadata: SourceMetadata = {
    id: 'lnmtl',
    name: 'LNMTL',
    site: 'https://lnmtl.com',
    version: '1.0.0',
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
    description: 'Pioneering machine translation hub for ongoing raw Asian web fiction.',
  };

  async popularNovels(pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.metadata.site}/novel?page=${pageNo}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.media, .novel-item').each((_, el) => {
      const a = $(el).find('h4.media-heading a, a.media-heading').first();
      const href = a.attr('href') || '';
      const name = a.text().trim();
      const img = $(el).find('img.media-object, img').first().attr('src') || '';

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
    const url = `${this.metadata.site}/novel?name=${encodeURIComponent(searchTerm)}&page=${pageNo}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.media, .novel-item').each((_, el) => {
      const a = $(el).find('h4.media-heading a, a.media-heading').first();
      const href = a.attr('href') || '';
      const name = a.text().trim();
      const img = $(el).find('img.media-object, img').first().attr('src') || '';

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

    const name = $('h1.novel-name, h1').first().text().trim() || 'Novel Details';
    const cover = $('.novel-cover img, .media-object').first().attr('src') || '';
    const summary = $('.description, .novel-synopsis').first().text().trim();
    const author = $('.author, dt:contains("Author") + dd').first().text().trim();

    const chapters: ChapterItem[] = [];
    $('.chapter-list a, .list-chapters a, .table-chapters a').each((idx, el) => {
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

    return {
      name,
      path: cleanPath,
      cover: cover.startsWith('http') ? cover : `${this.metadata.site}/${cover.replace(/^\//, '')}`,
      summary,
      author,
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

    $('.chapter-body script, .chapter-body style').remove();
    return $('.chapter-body, .sentence').html() || '';
  }
}
