import { NovelSource, SourceMetadata, NovelItem, SourceNovel, ChapterItem } from '../types';
import { fetchText } from '../fetcher';
import * as cheerio from 'cheerio';

export class AO3Source implements NovelSource {
  metadata: SourceMetadata = {
    id: 'ao3',
    name: 'Archive of Our Own (AO3)',
    site: 'https://archiveofourown.org',
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
    cloudProtected: false,
    description: 'Immense fan fiction and original web fiction archive with open access.',
  };

  async popularNovels(pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.metadata.site}/tags/Original%20Work/works?page=${pageNo}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('li.work, li.blurb').each((_, el) => {
      const a = $(el).find('h4.heading a[href*="/works/"]').first();
      const href = a.attr('href') || '';
      const name = a.text().trim();

      if (href && name) {
        novels.push({
          name,
          path: href.replace(this.metadata.site, '').replace(/^\//, ''),
          cover: 'https://archiveofourown.org/images/ao3_logos/logo_42.png',
          sourceId: this.metadata.id,
          sourceName: this.metadata.name,
        });
      }
    });

    return novels;
  }

  async searchNovels(searchTerm: string, pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.metadata.site}/works/search?work_search[query]=${encodeURIComponent(searchTerm)}&page=${pageNo}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const novels: NovelItem[] = [];

    $('li.work, li.blurb').each((_, el) => {
      const a = $(el).find('h4.heading a[href*="/works/"]').first();
      const href = a.attr('href') || '';
      const name = a.text().trim();

      if (href && name) {
        novels.push({
          name,
          path: href.replace(this.metadata.site, '').replace(/^\//, ''),
          cover: 'https://archiveofourown.org/images/ao3_logos/logo_42.png',
          sourceId: this.metadata.id,
          sourceName: this.metadata.name,
        });
      }
    });

    return novels;
  }

  async parseNovel(novelPath: string): Promise<SourceNovel> {
    const cleanPath = novelPath.startsWith('/') ? novelPath.slice(1) : novelPath;
    const url = `${this.metadata.site}/${cleanPath}?view_adult=true`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);

    const name = $('h2.title').first().text().trim() || 'Novel Details';
    const author = $('h3.byline a').first().text().trim();
    const summary = $('.summary blockquote').first().text().trim();
    const genres = $('dd.freeform a').map((_, el) => $(el).text().trim()).get().join(', ');

    const chapters: ChapterItem[] = [];
    const chapterSelect = $('#selected_id option');

    if (chapterSelect.length > 0) {
      chapterSelect.each((idx, el) => {
        const val = $(el).attr('value');
        const text = $(el).text().trim();
        if (val) {
          chapters.push({
            name: text,
            path: `works/${cleanPath.split('/')[1]}/chapters/${val}`,
            chapterNumber: idx + 1,
          });
        }
      });
    } else {
      chapters.push({
        name: 'Entire Work / Chapter 1',
        path: cleanPath,
        chapterNumber: 1,
      });
    }

    return {
      name,
      path: cleanPath,
      cover: 'https://archiveofourown.org/images/ao3_logos/logo_42.png',
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
    const url = `${this.metadata.site}/${cleanPath}?view_adult=true`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);

    $('.userstuff script, .userstuff style').remove();
    return $('.userstuff').html() || $('#chapters').html() || '';
  }
}
