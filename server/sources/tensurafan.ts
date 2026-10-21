import { NovelSource, SourceMetadata, NovelItem, SourceNovel, ChapterItem } from '../types';
import { fetchText } from '../fetcher';
import * as cheerio from 'cheerio';

export class TensuraFanSource implements NovelSource {
  metadata: SourceMetadata = {
    id: 'tensurafan',
    name: 'TensuraFan',
    site: 'https://tensurafan.home.blog',
    version: '1.0.0',
    type: 'translation-group',
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
    description: 'Premier dedicated translation collective for That Time I Got Reincarnated as a Slime light novels.',
  };

  async popularNovels(_pageNo: number = 1): Promise<NovelItem[]> {
    return [
      {
        name: 'That Time I Got Reincarnated as a Slime (Light Novel)',
        path: 'light-novels',
        cover: 'https://tensurafan.home.blog/wp-content/uploads/2019/05/cropped-rimuru-icon.png',
        sourceId: this.metadata.id,
        sourceName: this.metadata.name,
      },
    ];
  }

  async searchNovels(searchTerm: string, pageNo: number = 1): Promise<NovelItem[]> {
    if ('slime'.includes(searchTerm.toLowerCase()) || 'tensura'.includes(searchTerm.toLowerCase())) {
      return this.popularNovels(pageNo);
    }
    return [];
  }

  async parseNovel(novelPath: string): Promise<SourceNovel> {
    const url = `${this.metadata.site}/${novelPath.replace(/^\//, '')}/`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);

    const name = 'That Time I Got Reincarnated as a Slime';
    const cover = $('.wp-block-image img, .entry-content img').first().attr('src') || '';
    const summary = $('.entry-content p').first().text().trim() || 'Official fan translation of the Slime light novel series.';

    const chapters: ChapterItem[] = [];
    $('.entry-content a').each((idx, el) => {
      const href = $(el).attr('href') || '';
      const title = $(el).text().trim();
      if (href && (title.includes('Volume') || title.includes('Chapter') || title.includes('Prologue'))) {
        chapters.push({
          name: title,
          path: href.replace(this.metadata.site, '').replace(/^\//, ''),
          chapterNumber: idx + 1,
        });
      }
    });

    return {
      name,
      path: novelPath,
      cover,
      summary,
      author: 'Fuse',
      status: 'Ongoing',
      genres: 'Fantasy, Isekai, Adventure, Comedy',
      chapters,
      sourceId: this.metadata.id,
      sourceName: this.metadata.name,
    };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const cleanPath = chapterPath.startsWith('http') ? chapterPath : `${this.metadata.site}/${chapterPath.replace(/^\//, '')}`;
    const html = await fetchText(cleanPath);
    const $ = cheerio.load(html);

    $('.entry-content script, .entry-content style, .sharedaddy').remove();
    return $('.entry-content').html() || '';
  }
}
