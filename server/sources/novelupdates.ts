import { NovelSource, SourceMetadata, NovelItem, SourceNovel, ChapterItem } from '../types';
import { fetchText } from '../fetcher';
import * as cheerio from 'cheerio';

export class NovelUpdatesSource implements NovelSource {
  metadata: SourceMetadata = {
    id: 'novelupdates',
    name: 'Novel Updates',
    site: 'https://www.novelupdates.com',
    version: '1.0.0',
    type: 'mega-aggregator',
    languages: ['en'],
    features: {
      popular: true,
      search: true,
      novelDetails: true,
      chapters: true,
      reader: false, // NU is a directory linking to translators
      filters: false,
    },
    cloudProtected: true,
    description: 'The master directory of Asian light novels, web novels, and official/fan translation groups.',
    notes: 'Directory source providing complete metadata, chapters, and translation group links.',
  };

  async popularNovels(pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.metadata.site}/series-ranking/?rank=popular&pg=${pageNo}`;
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
    const url = `${this.metadata.site}/?s=${encodeURIComponent(searchTerm)}&post_type=seriesposts&paged=${pageNo}`;
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

    const name = $('.seriestitlenu').first().text().trim() || 'Novel Details';
    const cover = $('.seriesimg img').first().attr('src') || '';
    const summary = $('#editdescription').text().trim();
    const author = $('#showauthors a').map((_, el) => $(el).text().trim()).get().join(', ');
    const status = $('#editstatus').text().trim() || 'Ongoing';
    const genres = $('#seriesgenre a').map((_, el) => $(el).text().trim()).get().join(', ');

    const chapters: ChapterItem[] = [];
    $('.my_popup_ul li a').each((idx, el) => {
      const href = $(el).attr('href') || '';
      const title = $(el).text().trim();
      if (href && title) {
        chapters.push({
          name: title,
          path: href,
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
    return `<div class="p-4 text-center"><p class="text-gray-400">Novel Updates acts as a directory index. This chapter directs to: <a href="${chapterPath}" target="_blank" class="text-sky-400 underline font-semibold">External Translation Link</a></p></div>`;
  }
}
