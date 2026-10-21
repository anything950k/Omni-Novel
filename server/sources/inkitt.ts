import { NovelSource, SourceMetadata, NovelItem, SourceNovel, ChapterItem } from '../types';
import { fetchJson, fetchText } from '../fetcher';
import * as cheerio from 'cheerio';

export class InkittSource implements NovelSource {
  metadata: SourceMetadata = {
    id: 'inkitt',
    name: 'Inkitt',
    site: 'https://www.inkitt.com',
    version: '1.0.1',
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
    description: 'Direct author publishing platform for fantasy, sci-fi, romance, and thriller novels.',
  };

  async popularNovels(pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.metadata.site}/trending_stories?page=${pageNo}&period=alltime`;
    const data = await fetchJson<any>(url);
    const stories = data?.stories || [];

    return stories.map((novel: any) => ({
      name: novel.title,
      path: `${novel.category_one || novel.genres?.[0] || 'novel'}/${novel.id}`,
      cover: novel.vertical_cover?.url || novel.cover?.url || '',
      sourceId: this.metadata.id,
      sourceName: this.metadata.name,
    }));
  }

  async searchNovels(searchTerm: string, pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.metadata.site}/api/2/search/title?q=${encodeURIComponent(searchTerm)}&page=${pageNo}`;
    const data = await fetchJson<any>(url);
    const stories = data?.stories || [];

    return stories.map((novel: any) => ({
      name: novel.title,
      path: `${novel.category_one || novel.genres?.[0] || 'novel'}/${novel.id}`,
      cover: novel.vertical_cover?.url || novel.cover?.url || '',
      sourceId: this.metadata.id,
      sourceName: this.metadata.name,
    }));
  }

  async parseNovel(novelPath: string): Promise<SourceNovel> {
    const storyId = novelPath.split('/')[1] || novelPath;
    const pageUrl = `${this.metadata.site}/stories/${novelPath}`;
    const html = await fetchText(pageUrl);
    const $ = cheerio.load(html);

    const name = $('h1.story-title').text().trim() || 'Novel Details';
    const author = $('dl > dd > a.author-link').text().trim();
    const genres = $('dd.genres > a').map((_, el) => $(el).text().trim()).get().join(', ');
    const summary = $('p.story-summary').text().trim();

    // Fetch chapters via Inkitt API
    const apiUrl = `${this.metadata.site}/api/stories/${storyId}`;
    const apiData = await fetchJson<any>(apiUrl).catch(() => ({}));
    const cover = apiData?.vertical_cover?.url || $('meta[property="og:image"]').attr('content') || '';

    const chapters: ChapterItem[] = (apiData?.chapters || []).map((c: any) => ({
      name: c.name || `Chapter ${c.chapter_number}`,
      path: `${novelPath}/chapters/${c.chapter_number}`,
      chapterNumber: c.chapter_number,
    }));

    return {
      name,
      path: novelPath,
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
    const url = `${this.metadata.site}/stories/${chapterPath}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);

    return $('#chapterText').html() || '';
  }
}
