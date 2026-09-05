import { Injectable, NotFoundException } from "@nestjs/common";
import type { SavedItemType } from "./dto/create-saved-item.dto";

export interface SavedItem {
  id: string;
  userId: string;
  type: SavedItemType;
  title: string;
  payload: unknown;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class UserDataService {
  private readonly itemsByUser = new Map<string, SavedItem[]>();

  list(userId: string, type?: SavedItem["type"]) {
    const items = this.itemsByUser.get(userId) ?? [];
    return type ? items.filter((item) => item.type === type) : items;
  }

  create(userId: string, type: SavedItem["type"], title: string, payload: unknown) {
    const now = new Date().toISOString();
    const item: SavedItem = {
      id: `item_${crypto.randomUUID()}`,
      userId,
      type,
      title,
      payload,
      createdAt: now,
      updatedAt: now
    };
    this.itemsByUser.set(userId, [item, ...this.list(userId)]);
    return item;
  }

  update(userId: string, id: string, updates: { title?: string; payload?: unknown }) {
    const items = this.list(userId);
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) throw new NotFoundException("Item not found");

    const updated: SavedItem = {
      ...items[index],
      title: updates.title ?? items[index].title,
      payload: updates.payload ?? items[index].payload,
      updatedAt: new Date().toISOString()
    };
    items[index] = updated;
    return updated;
  }

  remove(userId: string, id: string) {
    const items = this.list(userId);
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) throw new NotFoundException("Item not found");
    const [removed] = items.splice(index, 1);
    return removed;
  }
}
