import { NovelSource, SourceMetadata, NovelItem, SourceNovel, ChapterItem } from '../types';
import { fetchText } from '../fetcher';
import * as cheerio from 'cheerio';

export interface ReadNovelFullConfig {
  id: string;
  name: string;
  site: string;
  latestPage?: string;
  searchPage?: string;
  description?: string;
}

export class ReadNovelFullEngine implements NovelSource {
  metadata: SourceMetadata;
  private config: ReadNovelFullConfig;

  constructor(config: ReadNovelFullConfig) {
    this.config = config;
    this.metadata = {
      id: config.id,
      name: config.name,
      site: config.site,
      version: '2.3.0',
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
      description: config.description || 'High-volume web novel and light novel reader aggregator.',
      notes: 'May require cookie or proxy depending on Cloudflare protection level.',
    };
  }

  async popularNovels(pageNo: number = 1): Promise<NovelItem[]> {
    const path = this.config.latestPage || 'novel-list/latest-release-novel';
    const url = `${this.config.site.replace(/\/$/, '')}/${path}?page=${pageNo}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.list-novel .row, .col-novel-main .row, .list-truyen .row, .list-novel .list-item').each((_, el) => {
      const titleLink = $(el).find('h3.novel-title a, .novel-title a, h3 a').first();
      const href = titleLink.attr('href') || '';
      const name = titleLink.text().trim();
      const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src');

      if (href && name) {
        novels.push({
          name,
          path: href.replace(this.config.site, '').replace(/^\//, ''),
          cover: img ? (img.startsWith('http') ? img : `${this.config.site.replace(/\/$/, '')}/${img.replace(/^\//, '')}`) : '',
          sourceId: this.metadata.id,
          sourceName: this.metadata.name,
        });
      }
    });

    return novels;
  }

  async searchNovels(searchTerm: string, pageNo: number = 1): Promise<NovelItem[]> {
    const path = this.config.searchPage || 'search';
    const url = `${this.config.site.replace(/\/$/, '')}/${path}?keyword=${encodeURIComponent(searchTerm)}&page=${pageNo}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.list-novel .row, .col-novel-main .row, .list-truyen .row, .list-novel .list-item').each((_, el) => {
      const titleLink = $(el).find('h3.novel-title a, .novel-title a, h3 a').first();
      const href = titleLink.attr('href') || '';
      const name = titleLink.text().trim();
      const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src');

      if (href && name) {
        novels.push({
          name,
          path: href.replace(this.config.site, '').replace(/^\//, ''),
          cover: img ? (img.startsWith('http') ? img : `${this.config.site.replace(/\/$/, '')}/${img.replace(/^\//, '')}`) : '',
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

    const name = $('h3.title, h1.title, .novel-desc h1, .books h1').first().text().trim() || 'Novel Details';
    const imgEl = $('.book img, .desc img, .novel-cover img').first();
    const cover = imgEl.attr('src') || imgEl.attr('data-src') || '';
    const summary = $('.desc-text, .novel-desc .desc, #tab-description').first().text().trim();
    const author = $('.info a[href*="author"], .author a').first().text().trim();
    const status = $('.info a[href*="status"], .status span').first().text().trim() || 'Ongoing';
    const genres = $('.info a[href*="genre"], .genres a').map((_, el) => $(el).text().trim()).get().join(', ');

    const chapters: ChapterItem[] = [];
    $('.list-chapter li a, #list-chapter a, ul.list-chapter a').each((idx, el) => {
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
      cover,
      summary,
      author,
      status,
      genres,
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

    $('#chr-content .ads, #chapter-content .ads, .watermark, script, style').remove();
    const content = $('#chr-content, #chapter-content, .txt, .chapter-c').first().html() || '';
    return content;
  }
}
