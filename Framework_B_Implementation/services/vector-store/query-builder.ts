/**
 * Framework B - Query Builder
 * Build Pinecone queries with filters
 */

export interface FilterCondition {
  field: string;
  operator: '$eq' | '$ne' | '$gt' | '$gte' | '$lt' | '$lte' | '$in' | '$nin';
  value: any;
}

export class QueryBuilder {
  private filters: Record<string, any> = {};

  /**
   * Add equality filter
   */
  equals(field: string, value: any): this {
    this.filters[field] = { $eq: value };
    return this;
  }

  /**
   * Add not equals filter
   */
  notEquals(field: string, value: any): this {
    this.filters[field] = { $ne: value };
    return this;
  }

  /**
   * Add greater than filter
   */
  greaterThan(field: string, value: number | string): this {
    this.filters[field] = { $gt: value };
    return this;
  }

  /**
   * Add greater than or equal filter
   */
  greaterThanOrEqual(field: string, value: number | string): this {
    this.filters[field] = { $gte: value };
    return this;
  }

  /**
   * Add less than filter
   */
  lessThan(field: string, value: number | string): this {
    this.filters[field] = { $lt: value };
    return this;
  }

  /**
   * Add less than or equal filter
   */
  lessThanOrEqual(field: string, value: number | string): this {
    this.filters[field] = { $lte: value };
    return this;
  }

  /**
   * Add in array filter
   */
  in(field: string, values: any[]): this {
    this.filters[field] = { $in: values };
    return this;
  }

  /**
   * Add not in array filter
   */
  notIn(field: string, values: any[]): this {
    this.filters[field] = { $nin: values };
    return this;
  }

  /**
   * Add date range filter
   */
  dateRange(field: string, from?: string, to?: string): this {
    const filter: any = {};

    if (from) {
      filter.$gte = from;
    }

    if (to) {
      filter.$lte = to;
    }

    if (Object.keys(filter).length > 0) {
      this.filters[field] = filter;
    }

    return this;
  }

  /**
   * Add project ID filter
   */
  forProject(projectId: string): this {
    return this.equals('projectId', projectId);
  }

  /**
   * Add supplier ID filter
   */
  forSupplier(supplierId: string): this {
    return this.equals('supplierId', supplierId);
  }

  /**
   * Add deal ID filter
   */
  forDeal(dealId: string): this {
    return this.equals('dealId', dealId);
  }

  /**
   * Add document type filter
   */
  forDocumentType(type: string): this {
    return this.equals('documentType', type);
  }

  /**
   * Add tags filter
   */
  withTags(tags: string[]): this {
    return this.in('tags', tags);
  }

  /**
   * Add category filter
   */
  inCategory(category: string): this {
    return this.equals('category', category);
  }

  /**
   * Combine with AND logic
   */
  and(...builders: QueryBuilder[]): this {
    builders.forEach(builder => {
      Object.assign(this.filters, builder.build());
    });
    return this;
  }

  /**
   * Build the filter object
   */
  build(): Record<string, any> {
    return Object.keys(this.filters).length > 0 ? this.filters : undefined;
  }

  /**
   * Clear all filters
   */
  clear(): this {
    this.filters = {};
    return this;
  }

  /**
   * Create a new QueryBuilder from object
   */
  static from(filters: Record<string, any>): QueryBuilder {
    const builder = new QueryBuilder();
    builder.filters = filters;
    return builder;
  }
}
