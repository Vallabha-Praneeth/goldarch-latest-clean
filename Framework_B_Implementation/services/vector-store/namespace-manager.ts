/**
 * Framework B - Namespace Manager
 * Manage Pinecone namespaces for organizing vectors
 */

export class NamespaceManager {
  private namespaces: Map<string, string>;

  constructor(defaultNamespaces: Record<string, string> = {}) {
    this.namespaces = new Map(Object.entries(defaultNamespaces));
  }

  /**
   * Get namespace by key
   */
  get(key: string): string {
    return this.namespaces.get(key) || 'default';
  }

  /**
   * Set namespace
   */
  set(key: string, namespace: string): void {
    this.namespaces.set(key, namespace);
  }

  /**
   * Check if namespace exists
   */
  has(key: string): boolean {
    return this.namespaces.has(key);
  }

  /**
   * Get all namespaces
   */
  getAll(): Record<string, string> {
    return Object.fromEntries(this.namespaces);
  }

  /**
   * Build namespace for project
   */
  forProject(projectId: string): string {
    return `project-${projectId}`;
  }

  /**
   * Build namespace for supplier
   */
  forSupplier(supplierId: string): string {
    return `supplier-${supplierId}`;
  }

  /**
   * Build namespace for deal
   */
  forDeal(dealId: string): string {
    return `deal-${dealId}`;
  }

  /**
   * Build namespace for document type
   */
  forDocumentType(type: string): string {
    return `doc-type-${type}`;
  }

  /**
   * Build namespace for user
   */
  forUser(userId: string): string {
    return `user-${userId}`;
  }

  /**
   * Build custom namespace
   */
  custom(category: string, id: string): string {
    return `${category}-${id}`;
  }

  /**
   * Parse namespace to get category and ID
   */
  parse(namespace: string): { category: string; id: string } | null {
    const match = namespace.match(/^(.+?)-(.+)$/);

    if (!match) {
      return null;
    }

    return {
      category: match[1],
      id: match[2],
    };
  }

  /**
   * Validate namespace format
   */
  validate(namespace: string): boolean {
    // Namespaces should be alphanumeric with hyphens and underscores
    return /^[a-zA-Z0-9_-]+$/.test(namespace);
  }
}
