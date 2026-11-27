export interface BookmarkItem {
  id: string;
  title: string;
  bookmarked: boolean;
  bookmarkedAt?: number;
}

export class OptimisticBookmarkRollbackService {
  private bookmarks = new Map<string, BookmarkItem>();

  public initialize(items: BookmarkItem[] = []): void {
    this.bookmarks.clear();
    for (const item of items) {
      this.bookmarks.set(item.id, { ...item });
    }
  }

  public toggleBookmarkOptimistic(id: string): { previousState: BookmarkItem | null; optimisticState: BookmarkItem } {
    const existing = this.bookmarks.get(id);
    const previousState = existing ? { ...existing } : null;

    const updated: BookmarkItem = existing
      ? { ...existing, bookmarked: !existing.bookmarked, bookmarkedAt: !existing.bookmarked ? Date.now() : undefined }
      : { id, title: 'Item ' + id, bookmarked: true, bookmarkedAt: Date.now() };

    this.bookmarks.set(id, updated);
    return { previousState, optimisticState: updated };
  }

  public rollback(id: string, previousState: BookmarkItem | null): void {
    if (previousState) {
      this.bookmarks.set(id, { ...previousState });
    } else {
      this.bookmarks.delete(id);
    }
  }

  public getBookmark(id: string): BookmarkItem | undefined {
    return this.bookmarks.get(id);
  }

  public getAll(): BookmarkItem[] {
    return Array.from(this.bookmarks.values());
  }
}
