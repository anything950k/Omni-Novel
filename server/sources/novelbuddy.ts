import { NovelSource, SourceMetadata, NovelItem, SourceNovel, ChapterItem } from '../types';
import { fetchText } from '../fetcher';
import * as cheerio from 'cheerio';

export class NovelBuddySource implements NovelSource {
  metadata: SourceMetadata = {
    id: 'novelbuddy',
    name: 'NovelBuddy',
    site: 'https://novelbuddy.me',
    version: '2.1.4',
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
    cloudProtected: false,
    description: 'Fast modern reading portal with extensive web novel archives.',
  };

  async popularNovels(pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.metadata.site}/popular?page=${pageNo}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.book-item, .novel-item').each((_, el) => {
      const a = $(el).find('a.book-thumb, a').first();
      const href = a.attr('href') || '';
      const name = $(el).find('.title, h3, h4').text().trim() || a.attr('title') || '';
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
    const url = `${this.metadata.site}/search?q=${encodeURIComponent(searchTerm)}&page=${pageNo}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.book-item, .novel-item').each((_, el) => {
      const a = $(el).find('a.book-thumb, a').first();
      const href = a.attr('href') || '';
      const name = $(el).find('.title, h3, h4').text().trim() || a.attr('title') || '';
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

    const name = $('h1.title, h1').first().text().trim() || 'Novel Details';
    const cover = $('.book-cover img').first().attr('src') || '';
    const summary = $('.description, .summary').first().text().trim();
    const author = $('.meta-item:contains("Author") a').text().trim() || 'Unknown';
    const status = $('.meta-item:contains("Status")').text().replace('Status:', '').trim() || 'Ongoing';

    const chapters: ChapterItem[] = [];
    $('.chapter-list a, .list-chapter a').each((idx, el) => {
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

    $('#chapter-content script, #chapter-content style, .ads').remove();
    return $('#chapter-content, .content-inner').html() || '';
  }
}
