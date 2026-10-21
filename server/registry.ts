import { NovelSource, SourceMetadata, NovelItem, SourceNovel } from './types';
import { WuxiaWorldSource } from './sources/wuxiaworld';
import { BakaTsukiSource } from './sources/bakatsuki';
import { SkyTheWoodSource } from './sources/skythewood';
import { DivineDaoLibrarySource } from './sources/divinedaolibrary';
import { NovelHiSource } from './sources/novelhi';
import { InkittSource } from './sources/inkitt';
import { CoteReaderSource } from './sources/cotereader';
import { RoyalRoadSource } from './sources/royalroad';
import { ScribbleHubSource } from './sources/scribblehub';
import { NovelUpdatesSource } from './sources/novelupdates';
import { ReadNovelFullEngine } from './sources/readnovelfull-engine';
import { MadaraEngine } from './sources/madara-engine';
import { ReadWnEngine } from './sources/readwn-engine';
import { NovelFireEngine } from './sources/novelfire-engine';
import { RanobesSource } from './sources/ranobes';
import { MTLNovelSource } from './sources/mtlnovel';
import { NovelCoolSource } from './sources/novelcool';

class SourceRegistry {
  private sources: Map<string, NovelSource> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    // 1. Core High-Availability Official & Fan Translation Sources (Fast REST / MediaWiki APIs)
    this.register(new CoteReaderSource());
    this.register(new WuxiaWorldSource());
    this.register(new BakaTsukiSource());
    this.register(new DivineDaoLibrarySource());
    this.register(new SkyTheWoodSource());
    this.register(new NovelHiSource());
    this.register(new InkittSource());

    // 2. Premier Western & Community Web Fiction Platforms
    this.register(new RoyalRoadSource());
    this.register(new ScribbleHubSource());
    this.register(new NovelUpdatesSource());

    // 3. ReadNovelFull Engine Instances (Major Aggregators)
    this.register(
      new ReadNovelFullEngine({
        id: 'novelfull',
        name: 'NovelFull',
        site: 'https://novelfull.com',
        latestPage: 'latest-release-novel',
        searchPage: 'search',
        description: 'World-famous light novel and web fiction archive.',
      })
    );
    this.register(
      new ReadNovelFullEngine({
        id: 'novelbin',
        name: 'NovelBin',
        site: 'https://novelbin.com',
        latestPage: 'sort/latest',
        searchPage: 'search',
        description: 'Top-tier Asian light novel and web serial library.',
      })
    );
    this.register(
      new ReadNovelFullEngine({
        id: 'readnovelfull',
        name: 'ReadNovelFull',
        site: 'https://readnovelfull.com',
        latestPage: 'novel-list/latest-release-novel',
        searchPage: 'novel-list/search',
        description: 'Comprehensive translated light novel aggregator.',
      })
    );
    this.register(
      new ReadNovelFullEngine({
        id: 'allnovel',
        name: 'AllNovel',
        site: 'https://allnovel.org',
        latestPage: 'sort/latest-novels',
        searchPage: 'search',
        description: 'Complete novel catalogue with continuous updates.',
      })
    );
    this.register(
      new ReadNovelFullEngine({
        id: 'libread',
        name: 'LibRead',
        site: 'https://libread.com',
        latestPage: 'sort/latest-novels',
        searchPage: 'search',
        description: 'Massive light novel reading library.',
      })
    );
    this.register(
      new ReadNovelFullEngine({
        id: 'novelping',
        name: 'NovelPing',
        site: 'https://novelping.com',
        latestPage: 'sort/updates',
        searchPage: 'search',
        description: 'High-speed light novel updates and chapters.',
      })
    );
    this.register(
      new ReadNovelFullEngine({
        id: 'freewebnovel',
        name: 'FreeWebNovel',
        site: 'https://freewebnovel.com',
        latestPage: 'sort/latest-release',
        searchPage: 'search',
        description: 'Free high-quality web novels with clean layout.',
      })
    );
    this.register(
      new ReadNovelFullEngine({
        id: 'lightnovelplus',
        name: 'LightNovelPlus',
        site: 'https://lightnovelplus.com',
        latestPage: 'last_release',
        searchPage: 'book/search.html',
        description: 'Popular Korean and Japanese light novel reader.',
      })
    );
    this.register(
      new ReadNovelFullEngine({
        id: 'lightnovelworld',
        name: 'LightNovelWorld',
        site: 'https://lightnovelworld.co',
        latestPage: 'browse/latest',
        searchPage: 'search',
        description: 'Extensive Light Novel World archive.',
      })
    );

    // 4. Madara Engine Instances (WordPress Novel Theme Sites)
    this.register(
      new MadaraEngine({
        id: 'boxnovel',
        name: 'BoxNovel',
        site: 'https://boxnovel.com',
        description: 'Huge community favorite with daily chapter releases.',
      })
    );
    this.register(
      new MadaraEngine({
        id: 'daonovel',
        name: 'DaoNovel',
        site: 'https://daonovel.co',
        description: 'Cultivation, wuxia, and fantasy novel platform.',
      })
    );
    this.register(
      new MadaraEngine({
        id: 'firstkissnovel',
        name: 'FirstKissNovel',
        site: 'https://1stkissnovel.org',
        description: 'Romance, fantasy, and Korean villainess web novels.',
      })
    );
    this.register(
      new MadaraEngine({
        id: 'wuxiaworldsite',
        name: 'WuxiaWorld.site',
        site: 'https://wuxiaworld.site',
        description: 'Popular Madara-based cultivation novel aggregator.',
      })
    );

    // 5. ReadWN Engine Instances (Fast MTL & Cultivation Platforms)
    this.register(
      new ReadWnEngine({
        id: 'wuxiacity',
        name: 'WuxiaCity',
        site: 'https://www.wuxiafox.com',
        description: 'High-speed wuxia and xianxia novel archive.',
      })
    );
    this.register(
      new ReadWnEngine({
        id: 'wuxiabox',
        name: 'WuxiaBox',
        site: 'https://www.wuxiabox.com',
        description: 'Eastern fantasy and martial arts fiction hub.',
      })
    );
    this.register(
      new ReadWnEngine({
        id: 'wuxiamtl',
        name: 'WuxiaMTL',
        site: 'https://www.fanmtl.com',
        description: 'Fresh machine translations of trending Chinese web novels.',
      })
    );
    this.register(
      new ReadWnEngine({
        id: 'fannovel',
        name: 'FanNovel',
        site: 'https://www.fanmtl.com',
        description: 'Broad collection of translated light novels.',
      })
    );

    // 6. NovelFire Engine Instances
    this.register(
      new NovelFireEngine({
        id: 'novelfire',
        name: 'Novel Fire',
        site: 'https://novelfire.net',
        description: 'Sleek, ad-minimized light novel portal.',
      })
    );
    this.register(
      new NovelFireEngine({
        id: 'novelphoenix',
        name: 'Novel Phoenix',
        site: 'https://novelphoenix.com',
        description: 'Clean reader for top-rated web novels.',
      })
    );

    // 7. Standalone Aggregator & Community Sources
    this.register(new RanobesSource());
    this.register(new MTLNovelSource());
    this.register(new NovelCoolSource());

    // Additional Mega Archives to complete the 35 Major Sources
    this.register(
      new ReadNovelFullEngine({
        id: 'allnovelfull',
        name: 'AllNovelFull',
        site: 'https://novgo.net',
        latestPage: 'latest-release-novel',
        searchPage: 'search',
        description: 'Large light novel archive mirror with full chapter library.',
      })
    );
    this.register(
      new ReadWnEngine({
        id: 'wuxiaspace',
        name: 'Wuxia Space',
        site: 'https://www.wuxiaspot.com',
        description: 'Trending eastern fantasy and wuxia translated series.',
      })
    );
    this.register(
      new MadaraEngine({
        id: 'worldnovel',
        name: 'WorldNovel',
        site: 'https://worldnovel.online',
        description: 'Extensive web novel database with ongoing daily updates.',
      })
    );
  }

  public register(source: NovelSource): void {
    this.sources.set(source.metadata.id, source);
  }

  public getSource(id: string): NovelSource | undefined {
    return this.sources.get(id);
  }

  public getAllSources(): SourceMetadata[] {
    return Array.from(this.sources.values()).map(s => s.metadata);
  }

  public getSourcesCount(): number {
    return this.sources.size;
  }

  public async searchAll(query: string, maxPerSource: number = 5): Promise<NovelItem[]> {
    const promises: Promise<NovelItem[]>[] = [];

    // Prioritize direct, high-speed sources for cross-search to prevent timeout
    const fastSources = ['cotereader', 'wuxiaworld', 'bakatsuki', 'skythewood', 'divinedaolibrary', 'novelhi', 'inkitt'];
    
    for (const id of fastSources) {
      const src = this.sources.get(id);
      if (src) {
        promises.push(
          src.searchNovels(query, 1)
            .then(res => res.slice(0, maxPerSource))
            .catch(() => [])
        );
      }
    }

    const results = await Promise.all(promises);
    return results.flat();
  }
}

export const sourceRegistry = new SourceRegistry();
