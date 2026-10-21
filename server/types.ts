export interface ChapterItem {
  name: string;
  path: string;
  releaseTime?: string | null;
  chapterNumber?: number;
  page?: string;
  scanlator?: string | string[];
}

export interface NovelItem {
  id?: string;
  name: string;
  path: string;
  cover?: string;
  sourceId?: string;
  sourceName?: string;
}

export interface SourceNovel extends NovelItem {
  genres?: string;
  summary?: string;
  author?: string;
  artist?: string;
  status?: string;
  rating?: number;
  chapters?: ChapterItem[];
  totalPages?: number;
}

export interface SourceMetadata {
  id: string;
  name: string;
  site: string;
  version: string;
  icon?: string;
  description?: string;
  type: 'mega-aggregator' | 'original-platform' | 'official-tl' | 'translation-group' | 'mtl';
  languages: string[];
  features: {
    popular: boolean;
    search: boolean;
    novelDetails: boolean;
    chapters: boolean;
    reader: boolean;
    filters?: boolean;
  };
  cloudProtected: boolean;
  notes?: string;
}

export interface NovelSource {
  metadata: SourceMetadata;
  popularNovels(pageNo: number, filters?: Record<string, any>): Promise<NovelItem[]>;
  parseNovel(novelPath: string): Promise<SourceNovel>;
  parseChapter(chapterPath: string): Promise<string>;
  searchNovels(searchTerm: string, pageNo: number): Promise<NovelItem[]>;
  resolveUrl?(path: string, isNovel?: boolean): string;
}
