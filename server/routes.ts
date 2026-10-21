import { Router, Request, Response } from 'express';
import { sourceRegistry } from './registry';

export const apiRouter = Router();

// Health check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    totalSources: sourceRegistry.getSourcesCount(),
    timestamp: new Date().toISOString(),
  });
});

// List all supported sources
apiRouter.get('/sources', (_req: Request, res: Response) => {
  const sources = sourceRegistry.getAllSources();
  res.json({
    total: sources.length,
    sources,
  });
});

// Single source metadata
apiRouter.get('/sources/:sourceId', (req: Request, res: Response) => {
  const source = sourceRegistry.getSource(req.params.sourceId);
  if (!source) {
    return res.status(404).json({ error: `Source "${req.params.sourceId}" not found` });
  }
  res.json(source.metadata);
});

// Popular novels from a source
apiRouter.get('/sources/:sourceId/popular', async (req: Request, res: Response) => {
  const source = sourceRegistry.getSource(req.params.sourceId);
  if (!source) {
    return res.status(404).json({ error: `Source "${req.params.sourceId}" not found` });
  }

  const page = parseInt(req.query.page as string, 10) || 1;

  try {
    const novels = await source.popularNovels(page);
    res.json({
      sourceId: source.metadata.id,
      sourceName: source.metadata.name,
      page,
      count: novels.length,
      novels,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to fetch popular novels',
      sourceId: source.metadata.id,
    });
  }
});

// Search within a specific source
apiRouter.get('/sources/:sourceId/search', async (req: Request, res: Response) => {
  const source = sourceRegistry.getSource(req.params.sourceId);
  if (!source) {
    return res.status(404).json({ error: `Source "${req.params.sourceId}" not found` });
  }

  const query = (req.query.q as string) || (req.query.query as string) || '';
  if (!query.trim()) {
    return res.status(400).json({ error: 'Query parameter "q" or "query" is required' });
  }

  const page = parseInt(req.query.page as string, 10) || 1;

  try {
    const novels = await source.searchNovels(query, page);
    res.json({
      sourceId: source.metadata.id,
      sourceName: source.metadata.name,
      query,
      page,
      count: novels.length,
      novels,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to search novels',
      sourceId: source.metadata.id,
    });
  }
});

// Novel metadata and chapter list
apiRouter.get('/sources/:sourceId/novel', async (req: Request, res: Response) => {
  const source = sourceRegistry.getSource(req.params.sourceId);
  if (!source) {
    return res.status(404).json({ error: `Source "${req.params.sourceId}" not found` });
  }

  const novelPath = req.query.path as string;
  if (!novelPath) {
    return res.status(400).json({ error: 'Query parameter "path" is required' });
  }

  try {
    const novel = await source.parseNovel(novelPath);
    res.json({
      sourceId: source.metadata.id,
      sourceName: source.metadata.name,
      novel,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to parse novel details',
      sourceId: source.metadata.id,
      path: novelPath,
    });
  }
});

// Chapter content / reader text
apiRouter.get('/sources/:sourceId/chapter', async (req: Request, res: Response) => {
  const source = sourceRegistry.getSource(req.params.sourceId);
  if (!source) {
    return res.status(404).json({ error: `Source "${req.params.sourceId}" not found` });
  }

  const chapterPath = req.query.path as string;
  if (!chapterPath) {
    return res.status(400).json({ error: 'Query parameter "path" is required' });
  }

  try {
    const content = await source.parseChapter(chapterPath);
    res.json({
      sourceId: source.metadata.id,
      sourceName: source.metadata.name,
      path: chapterPath,
      content,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to parse chapter content',
      sourceId: source.metadata.id,
      path: chapterPath,
    });
  }
});

// Global Cross-Source Search
apiRouter.get('/search', async (req: Request, res: Response) => {
  const query = (req.query.q as string) || (req.query.query as string) || '';
  if (!query.trim()) {
    return res.status(400).json({ error: 'Query parameter "q" or "query" is required' });
  }

  const limit = parseInt(req.query.limit as string, 10) || 5;

  try {
    const results = await sourceRegistry.searchAll(query, limit);
    res.json({
      query,
      count: results.length,
      results,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to perform global search',
    });
  }
});
