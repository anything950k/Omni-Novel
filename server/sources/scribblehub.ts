import { NovelSource, SourceMetadata, NovelItem, SourceNovel, ChapterItem } from '../types';
import { fetchText } from '../fetcher';
import * as cheerio from 'cheerio';

export class ScribbleHubSource implements NovelSource {
  metadata: SourceMetadata = {
    id: 'scribblehub',
    name: 'Scribble Hub',
    site: 'https://www.scribblehub.com',
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
    description: 'Community-driven creative web fiction platform with thousands of original light novels.',
    notes: 'May require cookie or proxy depending on Cloudflare protection level.',
  };

  async popularNovels(pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.metadata.site}/series-finder/?sf=1&sort=pageviews&order=desc&pg=${pageNo}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.search_main_box').each((_, el) => {
      const titleLink = $(el).find('.search_title a').first();
      const href = titleLink.attr('href') || '';
      const name = titleLink.text().trim();
      const img = $(el).find('.search_img img').first().attr('src') || '';

      if (href && name) {
        novels.push({
          name,
          path: href.replace(this.metadata.site, '').replace(/^\//, ''),
          cover: img,
          sourceId: this.metadata.id,
          sourceName: this.metadata.name,
        });
      }
    });

    return novels;
  }

  async searchNovels(searchTerm: string, pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.metadata.site}/?s=${encodeURIComponent(searchTerm)}&post_type=fictionposts&paged=${pageNo}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('.search_main_box').each((_, el) => {
      const titleLink = $(el).find('.search_title a').first();
      const href = titleLink.attr('href') || '';
      const name = titleLink.text().trim();
      const img = $(el).find('.search_img img').first().attr('src') || '';

      if (href && name) {
        novels.push({
          name,
          path: href.replace(this.metadata.site, '').replace(/^\//, ''),
          cover: img,
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

    const name = $('.fic_title').text().trim() || 'Novel Details';
    const cover = $('.fic_image img').attr('src') || '';
    const summary = $('.wi_fic_desc').text().trim();
    const author = $('.auth_name_fic').text().trim();
    const genres = $('.fic_genre').map((_, el) => $(el).text().trim()).get().join(', ');

    const chapters: ChapterItem[] = [];
    $('.toc_w li a').each((idx, el) => {
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

    $('#chp_raw script, #chp_raw style').remove();
    return $('#chp_raw, .chp_raw').html() || '';
  }
}
