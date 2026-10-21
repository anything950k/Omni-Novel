import { NovelSource, SourceMetadata, NovelItem, SourceNovel, ChapterItem } from '../types';
import { fetchText, smartFetch } from '../fetcher';
import * as cheerio from 'cheerio';

export interface MadaraConfig {
  id: string;
  name: string;
  site: string;
  description?: string;
}

export class MadaraEngine implements NovelSource {
  metadata: SourceMetadata;
  private config: MadaraConfig;

  constructor(config: MadaraConfig) {
    this.config = config;
    this.metadata = {
      id: config.id,
      name: config.name,
      site: config.site,
      version: '1.5.0',
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
      description: config.description || 'WordPress Madara-based novel archive.',
      notes: 'May require cookie or proxy depending on Cloudflare protection level.',
    };
  }

  async popularNovels(pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.config.site.replace(/\/$/, '')}/page/${pageNo}/?m_orderby=views`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.c-tabs-item__content, .page-item-detail, .badge-pos-1').each((_, el) => {
      const titleLink = $(el).find('.post-title a, h3 a').first();
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
    const url = `${this.config.site.replace(/\/$/, '')}/page/${pageNo}/?s=${encodeURIComponent(searchTerm)}&post_type=wp-manga`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.c-tabs-item__content, .c-tabs-item, .row.c-tabs-item__content').each((_, el) => {
      const titleLink = $(el).find('.post-title a, h3 a').first();
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

    const name = $('.post-title h1, .post-title h3').first().text().trim() || 'Novel Details';
    const imgEl = $('.summary_image img').first();
    const cover = imgEl.attr('src') || imgEl.attr('data-src') || '';
    const summary = $('.description-summary .summary__content, .manga-excerpt').first().text().trim();
    const author = $('.author-content a').first().text().trim();
    const status = $('.post-status .summary-content').first().text().trim() || 'Ongoing';
    const genres = $('.genres-content a').map((_, el) => $(el).text().trim()).get().join(', ');

    // Chapters might be in page or need ajax call
    const chapters: ChapterItem[] = [];
    $('.wp-manga-chapter a').each((idx, el) => {
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

    // If no chapters in HTML, attempt ajax call
    if (chapters.length === 0) {
      try {
        const ajaxUrl = `${url.replace(/\/$/, '')}/ajax/chapters/`;
        const ajaxRes = await smartFetch(ajaxUrl, { method: 'POST' });
        if (ajaxRes.ok) {
          const ajaxHtml = await ajaxRes.text();
          const $ch = cheerio.load(ajaxHtml);
          $ch('.wp-manga-chapter a').each((idx, el) => {
            const href = $ch(el).attr('href') || '';
            const title = $ch(el).text().trim();
            if (href && title) {
              chapters.push({
                name: title,
                path: href.replace(this.config.site, '').replace(/^\//, ''),
                chapterNumber: idx + 1,
              });
            }
          });
        }
      } catch {
        // Ignored
      }
    }

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

    $('.reading-content .ads, script, style').remove();
    return $('.reading-content, .text-left, .entry-content').first().html() || '';
  }
}
