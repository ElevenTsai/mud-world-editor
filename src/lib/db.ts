import type { WorldData } from '../types/map';
import { parseSqlFiles, extractPreservedSections } from './sqlParser';
import { worldDataToSqlFiles } from './sqlWriter';

// Store preserved sections (quests, comments) per file for round-trip fidelity
let preservedSectionsCache: Record<string, string> = {};

// ---- Read ----

export async function loadWorld(): Promise<WorldData> {
  // Fetch file list
  const listRes = await fetch('/api/sql-files');
  if (!listRes.ok) throw new Error('Failed to list SQL files');
  const { files } = (await listRes.json()) as { files: string[] };

  // Fetch all SQL file contents in parallel
  const sqlContents: string[] = [];
  preservedSectionsCache = {};

  await Promise.all(
    files.map(async (fileName) => {
      const res = await fetch(`/api/sql-files/${encodeURIComponent(fileName)}`);
      if (!res.ok) throw new Error(`Failed to read ${fileName}`);
      const content = await res.text();
      sqlContents.push(content);
      // Preserve non-managed sections (quests, etc.)
      const preserved = extractPreservedSections(content);
      if (preserved) {
        preservedSectionsCache[fileName] = preserved;
      }
    }),
  );

  return parseSqlFiles(sqlContents);
}

// ---- Bulk save ----

export async function saveWorld(worldData: WorldData): Promise<void> {
  const files = worldDataToSqlFiles(worldData, preservedSectionsCache);

  const res = await fetch('/api/sql-files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error((err as { error: string }).error);
  }
}
