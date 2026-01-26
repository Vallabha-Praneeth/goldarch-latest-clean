import { getCachedJson, setCachedJson } from './drive-cache';
import { getFileMetadata } from './drive-client';

const PARENT_CACHE_TTL_SECONDS = 300;

export async function isFileInAllowedFolders(
  fileId: string,
  allowedFolderIds: string[],
): Promise<boolean> {
  const normalizedAllowed = new Set(allowedFolderIds);
  const cacheKey = `drive:parents:${fileId}`;

  const cachedParents = await getCachedJson<string[]>(cacheKey);
  if (cachedParents) {
    return cachedParents.some((parentId) => normalizedAllowed.has(parentId));
  }

  const parents = await resolveParentChain(fileId);
  await setCachedJson(cacheKey, parents, PARENT_CACHE_TTL_SECONDS);
  return parents.some((parentId) => normalizedAllowed.has(parentId));
}

async function resolveParentChain(fileId: string): Promise<string[]> {
  const visited = new Set<string>();
  const toVisit = [fileId];
  const parents: string[] = [];

  while (toVisit.length > 0) {
    const current = toVisit.pop();
    if (!current || visited.has(current)) {
      continue;
    }
    visited.add(current);

    const metadata = await getFileMetadata(current);
    const currentParents = metadata.parents || [];

    for (const parentId of currentParents) {
      if (!visited.has(parentId)) {
        parents.push(parentId);
        toVisit.push(parentId);
      }
    }
  }

  return parents;
}
