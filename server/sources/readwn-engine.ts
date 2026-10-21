import { NovelSource, SourceMetadata, NovelItem, SourceNovel, ChapterItem } from '../types';
import { fetchText } from '../fetcher';
import * as cheerio from 'cheerio';

export interface ReadWnConfig {
  id: string;
  name: string;
  site: string;
  description?: string;
}

export class ReadWnEngine implements NovelSource {
  metadata: SourceMetadata;
  private config: ReadWnConfig;

  constructor(config: ReadWnConfig) {
    this.config = config;
    this.metadata = {
      id: config.id,
      name: config.name,
      site: config.site,
      version: '1.0.3',
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
      description: config.description || 'Fast web novel and machine translation reader engine.',
    };
  }

  async popularNovels(pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.config.site.replace(/\/$/, '')}/list/all/all-newstime-${pageNo - 1}.html`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('li.novel-item, .list-novel .row, .novel-item').each((_, el) => {
      const a = $(el).find('a').first();
      const href = a.attr('href') || '';
      const name = $(el).find('.novel-title, h4, .title').text().trim() || a.attr('title') || '';
      const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';

      if (href && name) {
        novels.push({
          name,
          path: href.replace(this.config.site, '').replace(/^\//, ''),
          cover: img.startsWith('http') ? img : `${this.config.site.replace(/\/$/, '')}/${img.replace(/^\//, '')}`,
          sourceId: this.metadata.id,
          sourceName: this.metadata.name,
        });
      }
    });

    return novels;
  }

  async searchNovels(searchTerm: string, pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.config.site.replace(/\/$/, '')}/search.html?keyword=${encodeURIComponent(searchTerm)}&page=${pageNo}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('li.novel-item, .list-novel .row, .novel-item').each((_, el) => {
      const a = $(el).find('a').first();
      const href = a.attr('href') || '';
      const name = $(el).find('.novel-title, h4, .title').text().trim() || a.attr('title') || '';
      const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';

      if (href && name) {
        novels.push({
          name,
          path: href.replace(this.config.site, '').replace(/^\//, ''),
          cover: img.startsWith('http') ? img : `${this.config.site.replace(/\/$/, '')}/${img.replace(/^\//, '')}`,
          sourceId: this.metadata.id,
          sourceName: this.metadata.name,
        });
      }
    });

    return novels;
  }

  async parseNovel(novelPath: string): Promise<SourceNovel> {
    const cleanPath = novelPath.startsWith('/') ? novelPath.slice(1) : novelPath;
    const url = `${this.config.site.replace(/\/$/, '')}/${cleanPath}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);

    const name = $('.novel-title, h1').first().text().trim() || 'Novel Details';
    const cover = $('.novel-cover img').first().attr('src') || '';
    const summary = $('.summary, .description, .novel-desc').first().text().trim();
    const author = $('.author a, span:contains("Author")').first().text().replace('Author:', '').trim();
    const status = $('.status, span:contains("Status")').first().text().replace('Status:', '').trim() || 'Ongoing';

    const chapters: ChapterItem[] = [];
    $('.chapter-list a, .list-chapter a, #chapter-list a').each((idx, el) => {
      const href = $(el).attr('href') || '';
      const title = $(el).text().trim();
      if (href && title) {
        chapters.push({
          name: title,
          path: href.replace(this.config.site, '').replace(/^\//, ''),
          chapterNumber: idx + 1,
        });
      }
    });

    return {
      name,
      path: cleanPath,
      cover: cover.startsWith('http') ? cover : `${this.config.site.replace(/\/$/, '')}/${cover.replace(/^\//, '')}`,
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
    const url = `${this.config.site.replace(/\/$/, '')}/${cleanPath}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);

    $('.chapter-content script, .chapter-content style, .ads').remove();
    return $('.chapter-content, #chapter-content').html() || '';
  }
}
