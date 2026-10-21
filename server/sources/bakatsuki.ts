import { NovelSource, SourceMetadata, NovelItem, SourceNovel, ChapterItem } from '../types';
import { fetchJson, fetchText } from '../fetcher';
import * as cheerio from 'cheerio';

export class BakaTsukiSource implements NovelSource {
  metadata: SourceMetadata = {
    id: 'bakatsuki',
    name: 'Baka-Tsuki',
    site: 'https://www.baka-tsuki.org/project',
    version: '1.1.0',
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
    description: 'The historic and premier Japanese Light Novel fan translation wiki and archive.',
  };

  private readonly apiUrl = 'https://www.baka-tsuki.org/project/api.php';

  async popularNovels(pageNo: number = 1): Promise<NovelItem[]> {
    const limit = 30;
    const offset = (pageNo - 1) * limit;
    const url = `${this.apiUrl}?action=query&list=categorymembers&cmtitle=Category:Light_novel_(English)&cmlimit=${limit}&cmoffset=${offset}&format=json`;
    const data = await fetchJson<any>(url);
    const members = data?.query?.categorymembers || [];

    return members.map((m: any) => ({
      name: m.title,
      path: m.title,
      cover: 'https://www.baka-tsuki.org/project/skins/common/images/btlogo.png',
      sourceId: this.metadata.id,
      sourceName: this.metadata.name,
    }));
  }

  async searchNovels(searchTerm: string, pageNo: number = 1): Promise<NovelItem[]> {
    const limit = 25;
    const offset = (pageNo - 1) * limit;
    const url = `${this.apiUrl}?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srnamespace=0&srlimit=${limit}&sroffset=${offset}&format=json`;
    const data = await fetchJson<any>(url);
    const results = data?.query?.search || [];

    return results.map((r: any) => ({
      name: r.title,
      path: r.title,
      cover: 'https://www.baka-tsuki.org/project/skins/common/images/btlogo.png',
      sourceId: this.metadata.id,
      sourceName: this.metadata.name,
    }));
  }

  async parseNovel(novelPath: string): Promise<SourceNovel> {
    const pageTitle = encodeURIComponent(novelPath);
    const url = `${this.apiUrl}?action=parse&page=${pageTitle}&format=json`;
    const data = await fetchJson<any>(url);
    const parse = data?.parse;

    if (!parse) {
      throw new Error(`Novel "${novelPath}" not found on Baka-Tsuki`);
    }

    const html = parse.text?.['*'] || '';
    const $ = cheerio.load(html);

    const name = parse.title || novelPath;
    const firstImg = $('img').first().attr('src');
    const cover = firstImg 
      ? (firstImg.startsWith('http') ? firstImg : `https://www.baka-tsuki.org${firstImg}`) 
      : 'https://www.baka-tsuki.org/project/skins/common/images/btlogo.png';

    const summary = $('#Story_Synopsis, #Synopsis, #Plot')
      .parent()
      .nextUntil('h2, h3', 'p')
      .text()
      .trim() || $('p').first().text().trim();

    const chapters: ChapterItem[] = [];
    let chIdx = 1;

    $('h2, h3').each((_, header) => {
      const headerText = $(header).text().trim();
      $(header).nextUntil('h2', 'ul, ol').find('li a').each((_, link) => {
        const title = $(link).text().trim();
        const href = $(link).attr('href') || '';
        if (title && href && !title.includes('PDF') && !title.includes('EPUB') && !href.startsWith('#')) {
          chapters.push({
            name: `${headerText ? headerText + ': ' : ''}${title}`,
            path: href.replace(/^\/project\/index\.php\?title=/, '').replace(/^\/project\//, ''),
            chapterNumber: chIdx++,
          });
        }
      });
    });

    return {
      name,
      path: novelPath,
      cover,
      summary,
      status: 'Completed / Active',
      chapters,
      sourceId: this.metadata.id,
      sourceName: this.metadata.name,
    };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const pageTitle = encodeURIComponent(chapterPath.replace(/^\//, ''));
    const url = `${this.apiUrl}?action=parse&page=${pageTitle}&format=json`;
    const data = await fetchJson<any>(url);
    const rawHtml = data?.parse?.text?.['*'] || '';
    const $ = cheerio.load(rawHtml);

    // Remove edit sections, table of contents, nav boxes
    $('.mw-editsection, #toc, .navbox, .vertical-navbox').remove();

    return $('#mw-content-text').html() || $.html();
  }
}
