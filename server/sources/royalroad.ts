import { NovelSource, SourceMetadata, NovelItem, SourceNovel, ChapterItem } from '../types';
import { fetchText } from '../fetcher';
import * as cheerio from 'cheerio';

export class RoyalRoadSource implements NovelSource {
  metadata: SourceMetadata = {
    id: 'royalroad',
    name: 'Royal Road',
    site: 'https://www.royalroad.com',
    version: '2.3.1',
    type: 'original-platform',
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
    description: 'The premier open platform for original web fiction, LitRPG, progression fantasy, and isekai novels.',
    notes: 'Protected by Cloudflare bot management. Proxy or browser headers recommended.',
  };

  async popularNovels(pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.metadata.site}/fictions/weekly-popular?page=${pageNo}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.fiction-list-item').each((_, el) => {
      const titleLink = $(el).find('h2.fiction-title a, .fiction-title a').first();
      const href = titleLink.attr('href') || '';
      const name = titleLink.text().trim();
      const img = $(el).find('img').first().attr('src') || '';

      if (href && name) {
        novels.push({
          name,
          path: href.replace(this.metadata.site, '').replace(/^\//, ''),
          cover: img.startsWith('http') ? img : `${this.metadata.site}${img}`,
          sourceId: this.metadata.id,
          sourceName: this.metadata.name,
        });
      }
    });

    return novels;
  }

  async searchNovels(searchTerm: string, pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.metadata.site}/fictions/search?title=${encodeURIComponent(searchTerm)}&page=${pageNo}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.fiction-list-item').each((_, el) => {
      const titleLink = $(el).find('h2.fiction-title a, .fiction-title a').first();
      const href = titleLink.attr('href') || '';
      const name = titleLink.text().trim();
      const img = $(el).find('img').first().attr('src') || '';

      if (href && name) {
        novels.push({
          name,
          path: href.replace(this.metadata.site, '').replace(/^\//, ''),
          cover: img.startsWith('http') ? img : `${this.metadata.site}${img}`,
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

    const name = $('h1').first().text().trim() || 'Novel Details';
    const cover = $('.fiction-cover img').first().attr('src') || '';
    const summary = $('.description, .fiction-description').first().text().trim();
    const author = $('.fic-header h4 a').first().text().trim();
    const status = $('.fiction-info .label-default, .fiction-info span.label').first().text().trim() || 'Ongoing';
    const genres = $('.fiction-info a.label').map((_, el) => $(el).text().trim()).get().join(', ');

    const chapters: ChapterItem[] = [];
    $('#chapters tbody tr[data-url]').each((idx, el) => {
      const dataUrl = $(el).attr('data-url') || '';
      const title = $(el).find('td:first-child a').text().trim();
      const time = $(el).find('time').attr('datetime') || $(el).find('time').text().trim();

      if (dataUrl && title) {
        chapters.push({
          name: title,
          path: dataUrl.replace(/^\//, ''),
          releaseTime: time,
          chapterNumber: idx + 1,
        });
      }
    });

    return {
      name,
      path: cleanPath,
      cover: cover.startsWith('http') ? cover : `${this.metadata.site}${cover}`,
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
    const url = `${this.metadata.site}/${cleanPath}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);

    $('.chapter-inner .portlet, .chapter-inner script').remove();
    return $('.chapter-inner, .chapter-content').html() || '';
  }
}
