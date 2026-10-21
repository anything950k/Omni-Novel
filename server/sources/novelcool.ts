import { NovelSource, SourceMetadata, NovelItem, SourceNovel, ChapterItem } from '../types';
import { fetchText } from '../fetcher';
import * as cheerio from 'cheerio';

export class NovelCoolSource implements NovelSource {
  metadata: SourceMetadata = {
    id: 'novelcool',
    name: 'NovelCool',
    site: 'https://www.novelcool.com',
    version: '1.0.0',
    type: 'mega-aggregator',
    languages: ['en'],
    features: {
      popular: true,
      search: true,
      novelDetails: true,
      chapters: true,
      reader: true,
      filters: false,
    },
    cloudProtected: true,
    description: 'Extensive web novel platform with chapter bookmarks and wide coverage.',
  };

  async popularNovels(pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.metadata.site}/category/all_${pageNo}.html`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.book-item, .category-book-item').each((_, el) => {
      const a = $(el).find('a.book-name, a.title').first();
      const href = a.attr('href') || '';
      const name = a.attr('title') || a.text().trim();
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
    const url = `${this.metadata.site}/search/?name=${encodeURIComponent(searchTerm)}&page=${pageNo}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.book-item, .category-book-item, .search-result-item').each((_, el) => {
      const a = $(el).find('a.book-name, a.title').first();
      const href = a.attr('href') || '';
      const name = a.attr('title') || a.text().trim();
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

    const name = $('h1.book-name, h1').first().text().trim() || 'Novel Details';
    const cover = $('.book-cover img').first().attr('src') || '';
    const summary = $('.book-info-description, .description').first().text().trim();
    const author = $('.book-info-author a').first().text().trim();
    const status = $('.book-info-status').first().text().trim() || 'Ongoing';

    const chapters: ChapterItem[] = [];
    $('.chapter-list a, .chapter-item a').each((idx, el) => {
      const href = $(el).attr('href') || '';
      const title = $(el).attr('title') || $(el).text().trim();
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

    $('.chapter-reading-section script, .chapter-reading-section style, .ads').remove();
    return $('.chapter-reading-section, #chapter-content').html() || '';
  }
}
