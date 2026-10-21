import { NovelSource, SourceMetadata, NovelItem, SourceNovel, ChapterItem } from '../types';
import { fetchText } from '../fetcher';
import * as cheerio from 'cheerio';

export class NovelHiSource implements NovelSource {
  metadata: SourceMetadata = {
    id: 'novelhi',
    name: 'NovelHi',
    site: 'https://novelhi.com',
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
    cloudProtected: false,
    description: 'Extensive web novel & light novel aggregator with high chapter availability.',
  };

  async popularNovels(pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.metadata.site}/category/all/all/1/${pageNo}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.item, .novel-item, .box-item').each((_, el) => {
      const a = $(el).find('a').first();
      const href = a.attr('href') || '';
      const name = a.attr('title') || $(el).find('.title, h3').text().trim();
      const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src');

      if (href && name) {
        novels.push({
          name,
          path: href.replace(this.metadata.site, '').replace(/^\//, ''),
          cover: img ? (img.startsWith('http') ? img : `${this.metadata.site}${img}`) : '',
          sourceId: this.metadata.id,
          sourceName: this.metadata.name,
        });
      }
    });

    return novels;
  }

  async searchNovels(searchTerm: string, pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.metadata.site}/search?keyword=${encodeURIComponent(searchTerm)}&page=${pageNo}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.item, .novel-item, .search-item, .list-item').each((_, el) => {
      const a = $(el).find('a').first();
      const href = a.attr('href') || '';
      const name = a.attr('title') || $(el).find('.title, h3').text().trim();
      const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src');

      if (href && name) {
        novels.push({
          name,
          path: href.replace(this.metadata.site, '').replace(/^\//, ''),
          cover: img ? (img.startsWith('http') ? img : `${this.metadata.site}${img}`) : '',
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
    const coverImg = $('.detail-thumb img, .cover img, .novel-cover img').first().attr('src');
    const cover = coverImg ? (coverImg.startsWith('http') ? coverImg : `${this.metadata.site}${coverImg}`) : '';
    const summary = $('.detail-desc, .summary, .description').text().trim();
    const author = $('.author a, span:contains("Author")').first().text().replace('Author:', '').trim();
    const genres = $('.detail-tags a, .genres a').map((_, el) => $(el).text().trim()).get().join(', ');

    const chapters: ChapterItem[] = [];
    $('.chapter-list a, #chapters a, .dir-list a').each((idx, el) => {
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

    $('#chapter-content .ads, script, style').remove();
    return $('#chapter-content, .chapter-text, .read-content').html() || '';
  }
}
