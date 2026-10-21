import { NovelSource, SourceMetadata, NovelItem, SourceNovel, ChapterItem } from '../types';
import { fetchText } from '../fetcher';
import * as cheerio from 'cheerio';

export class WebnovelSource implements NovelSource {
  metadata: SourceMetadata = {
    id: 'webnovel',
    name: 'Webnovel',
    site: 'https://www.webnovel.com',
    version: '1.0.0',
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
    description: 'Global portal for Chinese web fiction, original novels, and official serializations.',
  };

  async popularNovels(pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.metadata.site}/category/0_novel_page${pageNo}?gender=1`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.book-item, li.g_col_6, .j_bookList li').each((_, el) => {
      const a = $(el).find('a[href*="/book/"]').first();
      const href = a.attr('href') || '';
      const name = $(el).find('h3, .book-name').text().trim() || a.attr('title') || '';
      const img = $(el).find('img').first().attr('src') || '';

      if (href && name) {
        novels.push({
          name,
          path: href.replace(this.metadata.site, '').replace(/^\//, ''),
          cover: img.startsWith('//') ? `https:${img}` : img,
          sourceId: this.metadata.id,
          sourceName: this.metadata.name,
        });
      }
    });

    return novels;
  }

  async searchNovels(searchTerm: string, pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.metadata.site}/search?keywords=${encodeURIComponent(searchTerm)}&pageIndex=${pageNo}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.search-result-container li, .book-item, li.g_col_6').each((_, el) => {
      const a = $(el).find('a[href*="/book/"]').first();
      const href = a.attr('href') || '';
      const name = $(el).find('h3, .book-name').text().trim() || a.attr('title') || '';
      const img = $(el).find('img').first().attr('src') || '';

      if (href && name) {
        novels.push({
          name,
          path: href.replace(this.metadata.site, '').replace(/^\//, ''),
          cover: img.startsWith('//') ? `https:${img}` : img,
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

    const name = $('h1.pt4, h1').first().text().trim() || 'Novel Details';
    const coverRaw = $('.det-hd-detail img, .g_thumb img').first().attr('src') || '';
    const cover = coverRaw.startsWith('//') ? `https:${coverRaw}` : coverRaw;
    const summary = $('.j_synopsis, .detail-desc').first().text().trim();
    const author = $('.det-hd-detail address a, .author-name').first().text().trim();
    const status = $('.det-hd-detail .c_strong:contains("Status")').text().trim() || 'Ongoing';

    const chapters: ChapterItem[] = [];
    $('.volume-item a, .j_chapter_item a').each((idx, el) => {
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
      cover,
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

    $('.cha-content script, .cha-content style, .ads').remove();
    return $('.cha-content, .chapter-content').html() || '';
  }
}
