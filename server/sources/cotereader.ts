import { NovelSource, SourceMetadata, NovelItem, SourceNovel, ChapterItem } from '../types';
import { fetchJson, fetchText } from '../fetcher';

export class CoteReaderSource implements NovelSource {
  metadata: SourceMetadata = {
    id: 'cotereader',
    name: 'Cote Reader',
    site: 'https://cote-reader.me',
    version: '2.0.0',
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
    description: 'High-speed light novel reader covering Classroom of the Elite, Lord of the Mysteries, Re:Zero, Mushoku Tensei, and 1,000+ top light novels.',
  };

  async popularNovels(pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.metadata.site}/api/novels?page=${pageNo}&limit=20`;
    const data = await fetchJson<any>(url);
    const items = data?.items || [];

    return items.map((novel: any) => ({
      name: novel.title,
      path: novel.id || novel.slug,
      cover: novel.cover?.startsWith('http') ? novel.cover : `${this.metadata.site}${novel.cover}`,
      sourceId: this.metadata.id,
      sourceName: this.metadata.name,
    }));
  }

  async searchNovels(searchTerm: string, pageNo: number = 1): Promise<NovelItem[]> {
    const url = `${this.metadata.site}/api/novels?q=${encodeURIComponent(searchTerm)}&page=${pageNo}&limit=20`;
    const data = await fetchJson<any>(url);
    const items = data?.items || [];

    return items.map((novel: any) => ({
      name: novel.title,
      path: novel.id || novel.slug,
      cover: novel.cover?.startsWith('http') ? novel.cover : `${this.metadata.site}${novel.cover}`,
      sourceId: this.metadata.id,
      sourceName: this.metadata.name,
    }));
  }

  async parseNovel(novelPath: string): Promise<SourceNovel> {
    const cleanId = novelPath.replace(/^\//, '').split('/')[0];
    const url = `${this.metadata.site}/api/novels/${cleanId}`;
    const data = await fetchJson<any>(url);

    const name = data.title || cleanId;
    const cover = data.cover?.startsWith('http') ? data.cover : `${this.metadata.site}${data.cover}`;
    const summary = data.description || '';
    const author = data.author || '';
    const genres = (data.tags || data.genres || []).join(', ');

    const chapters: ChapterItem[] = [];
    if (Array.isArray(data.volumes)) {
      for (const vol of data.volumes) {
        chapters.push({
          name: vol.title,
          path: `${cleanId}/${vol.id}`,
          chapterNumber: vol.position || chapters.length + 1,
        });
      }
    }

    return {
      name,
      path: cleanId,
      cover,
      summary,
      author,
      genres,
      status: 'Completed / Active',
      chapters,
      sourceId: this.metadata.id,
      sourceName: this.metadata.name,
    };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const parts = chapterPath.replace(/^\//, '').split('/');
    const novelId = parts[0];
    const volumeOrChId = parts[1];

    // Try volume API first
    const volUrl = `${this.metadata.site}/api/novels/${novelId}/volume/${volumeOrChId}`;
    try {
      const volData = await fetchJson<any>(volUrl);
      if (volData.chapters) {
        let fullHtml = `<h2>${volData.volumeTitle || 'Volume'}</h2>`;
        for (const [key, ch] of Object.entries<any>(volData.chapters)) {
          fullHtml += `<h3>${ch.title}</h3><div>${ch.content}</div><hr/>`;
        }
        return fullHtml;
      }
    } catch {
      // Try direct asset chapter fetch
    }

    const fallbackUrl = `${this.metadata.site}/assets/${novelId}/chapters/${volumeOrChId}.json`;
    const chData = await fetchJson<any>(fallbackUrl);
    return `<h2>${chData.title}</h2><div>${chData.content || ''}</div>`;
  }
}
