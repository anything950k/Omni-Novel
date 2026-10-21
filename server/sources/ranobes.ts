import { NovelSource, SourceMetadata, NovelItem, SourceNovel, ChapterItem } from '../types';
import { fetchText } from '../fetcher';
import * as cheerio from 'cheerio';

export class RanobesSource implements NovelSource {
  metadata: SourceMetadata = {
    id: 'ranobes',
    name: 'Ranobes',
    site: 'https://ranobes.top',
    version: '2.0.2',
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
    description: 'Premier translated light novel and web novel community hub.',
  };

  async popularNovels(pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.metadata.site}/novels/page/${pageNo}/`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.short-story, article.story, .story-item').each((_, el) => {
      const a = $(el).find('h2.title a, .title a').first();
      const href = a.attr('href') || '';
      const name = a.text().trim();
      const img = $(el).find('img').first().attr('src') || '';

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
    const url = `${this.metadata.site}/index.php?do=search&subaction=search&search_start=${pageNo}&story=${encodeURIComponent(searchTerm)}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.short-story, article.story, .story-item').each((_, el) => {
      const a = $(el).find('h2.title a, .title a').first();
      const href = a.attr('href') || '';
      const name = a.text().trim();
      const img = $(el).find('img').first().attr('src') || '';

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
    const cover = $('.r-fullstory-poster img, .poster img').first().attr('src') || '';
    const summary = $('#fs-info, .moreless').first().text().trim();
    const author = $('.tag_list a[href*="author"]').first().text().trim();
    const status = $('.r-fullstory-spec:contains("Status")').text().replace('Status', '').trim() || 'Ongoing';

    const chapters: ChapterItem[] = [];
    $('.chapters-scroll-content a, #chapters-list a').each((idx, el) => {
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

    $('#text_big script, #text_big style').remove();
    return $('#text_big, .text_big, #chapter-text').html() || '';
  }
}
