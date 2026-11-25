/**
 * Architecture Service: REST API Response Field Filtering
 * Subsystem: API Performance & Bandwidth Optimization
 */

export class ApiResponseFieldFilterService {
  public filterFields<T extends Record<string, unknown>>(data: T, fieldsQuery?: string): Partial<T> {
    if (!fieldsQuery || !fieldsQuery.trim()) {
      return data;
    }

    const requestedFields = fieldsQuery.split(',').map(f => f.trim()).filter(Boolean);
    if (requestedFields.length === 0) {
      return data;
    }

    const projected: Record<string, unknown> = {};
    for (const field of requestedFields) {
      if (field in data) {
        projected[field] = data[field];
      }
    }
    return projected as Partial<T>;
  }

  public filterCollection<T extends Record<string, unknown>>(items: T[], fieldsQuery?: string): Partial<T>[] {
    return items.map(item => this.filterFields(item, fieldsQuery));
  }
}
