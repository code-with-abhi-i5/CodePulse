/**
 * Architecture Service: Soft-Delete Cascading Filter Middleware
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-06]
 */

export interface QueryFilter {
  where?: Record<string, any>;
  include?: Record<string, any>;
}

export class SoftDeleteCascadingFilterMiddleware {
  public applyFilter(filter: QueryFilter = {}): QueryFilter {
    const updatedWhere = {
      ...(filter.where || {}),
      isDeleted: false
    };

    let updatedInclude: Record<string, any> | undefined = undefined;
    if (filter.include) {
      updatedInclude = {};
      for (const [rel, val] of Object.entries(filter.include)) {
        if (typeof val === 'object' && val !== null) {
          updatedInclude[rel] = this.applyFilter(val);
        } else if (val === true) {
          updatedInclude[rel] = { where: { isDeleted: false } };
        }
      }
    }

    return {
      where: updatedWhere,
      ...(updatedInclude ? { include: updatedInclude } : {})
    };
  }

  public cascadeSoftDelete(parentId: string, childEntities: Array<{ id: string; parentId: string; isDeleted: boolean }>): string[] {
    const updatedIds: string[] = [];
    for (const child of childEntities) {
      if (child.parentId === parentId && !child.isDeleted) {
        child.isDeleted = true;
        updatedIds.push(child.id);
      }
    }
    return updatedIds;
  }
}
