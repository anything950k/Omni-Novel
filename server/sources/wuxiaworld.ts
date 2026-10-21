import { NovelSource, SourceMetadata, NovelItem, SourceNovel, ChapterItem } from '../types';
import { fetchJson, fetchText } from '../fetcher';
import * as cheerio from 'cheerio';

export class WuxiaWorldSource implements NovelSource {
  metadata: SourceMetadata = {
    id: 'wuxiaworld',
    name: 'Wuxiaworld',
    site: 'https://www.wuxiaworld.com',
    version: '1.0.0',
    type: 'official-tl',
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
    description: 'Premier official English platform for Chinese & Korean fantasy, xianxia, and wuxia novels.',
  };

  async popularNovels(pageNo: number = 1): Promise<NovelItem[]> {
    const data = await fetchJson<any>(`${this.metadata.site}/api/novels`);
    const items = data?.items || [];
    const pageSize = 20;
    const start = (pageNo - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);

    return paged.map((novel: any) => ({
      name: novel.name,
      path: novel.slug,
      cover: novel.coverUrl,
      sourceId: this.metadata.id,
      sourceName: this.metadata.name,
    }));
  }

  async searchNovels(searchTerm: string, pageNo: number = 1): Promise<NovelItem[]> {
    const data = await fetchJson<any>(`${this.metadata.site}/api/novels`);
    const items = data?.items || [];
    const lower = searchTerm.toLowerCase();

    const filtered = items.filter((n: any) => 
      n.name?.toLowerCase().includes(lower) || 
      n.abbreviation?.toLowerCase().includes(lower) ||
      n.slug?.toLowerCase().includes(lower)
    );

    const pageSize = 20;
    const start = (pageNo - 1) * pageSize;
    return filtered.slice(start, start + pageSize).map((novel: any) => ({
      name: novel.name,
      path: novel.slug,
      cover: novel.coverUrl,
      sourceId: this.metadata.id,
      sourceName: this.metadata.name,
    }));
  }

  async parseNovel(novelPath: string): Promise<SourceNovel> {
    const cleanSlug = novelPath.replace(/^novel\//, '').replace(/\/$/, '');
    const url = `${this.metadata.site}/novel/${cleanSlug}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);

    const name = $('h1').first().text().trim() || cleanSlug;
    const cover = $('.novel-cover img, .cover img, img[alt*="cover"]').first().attr('src') || '';
    const summary = $('.summary, .synopsis, .description').first().text().trim();
    const author = $('dt:contains("Author")').next('dd').text().trim() || 
                   $('span:contains("Author:")').parent().text().replace('Author:', '').trim();
    const status = $('dt:contains("Status")').next('dd').text().trim() || 'Ongoing';
    const genres = $('.genres a, .tags a').map((_, el) => $(el).text().trim()).get().join(', ');

    // Extract chapters
    const chapters: ChapterItem[] = [];
    $('.chapter-item a, .chapter-list a, .list-chapters a').each((idx, el) => {
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
      path: cleanSlug,
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
    const url = `${this.metadata.site}/${cleanPath}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);

    const content = $('.chapter-content, .p-15, #chapter-content').first().html() || 
                    $('article').first().html() || 
                    $('.content').first().html() || '';

    return content;
  }
}
