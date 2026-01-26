/**
 * Framework B - Pinecone Configuration
 * Configuration for Pinecone vector database
 */

export interface PineconeConfig {
  apiKey: string;
  environment: string;
  indexName: string;
  dimension: number;
  metric: 'cosine' | 'euclidean' | 'dotproduct';
  namespaces: {
    [key: string]: string;
  };
  podType?: string;
  replicas?: number;
  shards?: number;
}

/**
 * Pinecone Configuration
 */
export const pineconeConfig: PineconeConfig = {
  apiKey: process.env.PINECONE_API_KEY || '',
  environment: process.env.PINECONE_ENVIRONMENT || 'us-west1-gcp',
  indexName: process.env.PINECONE_INDEX_NAME || 'goldarch-docs',
  dimension: parseInt(process.env.PINECONE_DIMENSION || '1536'),
  metric: (process.env.PINECONE_METRIC as any) || 'cosine',
  namespaces: {
    // Organize vectors by category
    projects: process.env.PINECONE_NAMESPACE_PROJECTS || 'project-docs',
    suppliers: process.env.PINECONE_NAMESPACE_SUPPLIERS || 'supplier-docs',
    quotes: process.env.PINECONE_NAMESPACE_QUOTES || 'quote-docs',
    activities: process.env.PINECONE_NAMESPACE_ACTIVITIES || 'activity-docs',
    deals: process.env.PINECONE_NAMESPACE_DEALS || 'deal-docs',
    general: process.env.PINECONE_NAMESPACE_GENERAL || 'general-docs',
  },
  podType: process.env.PINECONE_POD_TYPE || 'p1.x1', // Starter pod
  replicas: parseInt(process.env.PINECONE_REPLICAS || '1'),
  shards: parseInt(process.env.PINECONE_SHARDS || '1'),
};

/**
 * Pinecone Query Configuration
 */
export interface PineconeQueryConfig {
  topK: number;
  includeMetadata: boolean;
  includeValues: boolean;
  filter?: Record<string, any>;
}

export const defaultQueryConfig: PineconeQueryConfig = {
  topK: 5,
  includeMetadata: true,
  includeValues: false,
};

/**
 * Pinecone Upsert Configuration
 */
export interface PineconeUpsertConfig {
  namespace?: string;
  batchSize: number;
}

export const defaultUpsertConfig: PineconeUpsertConfig = {
  batchSize: 100, // Pinecone recommends batches of 100
};

/**
 * Validate Pinecone configuration
 */
export function validatePineconeConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!pineconeConfig.apiKey) {
    errors.push('PINECONE_API_KEY is required');
  }

  if (!pineconeConfig.environment) {
    errors.push('PINECONE_ENVIRONMENT is required');
  }

  if (!pineconeConfig.indexName) {
    errors.push('PINECONE_INDEX_NAME is required');
  }

  if (pineconeConfig.dimension < 1 || pineconeConfig.dimension > 20000) {
    errors.push('PINECONE_DIMENSION must be between 1 and 20000');
  }

  if (!['cosine', 'euclidean', 'dotproduct'].includes(pineconeConfig.metric)) {
    errors.push('PINECONE_METRIC must be one of: cosine, euclidean, dotproduct');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get namespace by category
 */
export function getNamespace(category: string): string {
  return pineconeConfig.namespaces[category] || pineconeConfig.namespaces.general;
}

/**
 * Build metadata filter for Pinecone queries
 */
export function buildMetadataFilter(filters: {
  projectId?: string;
  supplierId?: string;
  category?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  [key: string]: any;
}): Record<string, any> {
  const filter: Record<string, any> = {};

  if (filters.projectId) {
    filter.projectId = { $eq: filters.projectId };
  }

  if (filters.supplierId) {
    filter.supplierId = { $eq: filters.supplierId };
  }

  if (filters.category) {
    filter.category = { $eq: filters.category };
  }

  if (filters.tags && filters.tags.length > 0) {
    filter.tags = { $in: filters.tags };
  }

  if (filters.dateFrom || filters.dateTo) {
    filter.uploadedAt = {};
    if (filters.dateFrom) {
      filter.uploadedAt.$gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      filter.uploadedAt.$lte = filters.dateTo;
    }
  }

  // Add any other custom filters
  Object.keys(filters).forEach(key => {
    if (!['projectId', 'supplierId', 'category', 'tags', 'dateFrom', 'dateTo'].includes(key)) {
      filter[key] = filters[key];
    }
  });

  return Object.keys(filter).length > 0 ? filter : undefined;
}

/**
 * Pinecone index initialization configuration
 */
export const indexInitConfig = {
  name: pineconeConfig.indexName,
  dimension: pineconeConfig.dimension,
  metric: pineconeConfig.metric,
  podType: pineconeConfig.podType,
  pods: pineconeConfig.replicas,
  shards: pineconeConfig.shards,
  metadataConfig: {
    indexed: [
      'projectId',
      'supplierId',
      'category',
      'tags',
      'uploadedAt',
      'filename',
      'documentId',
    ],
  },
};
