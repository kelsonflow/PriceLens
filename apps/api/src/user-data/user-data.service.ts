import { Injectable, NotFoundException } from "@nestjs/common";

export interface SavedItem {
  id: string;
  type: "favorite" | "alert" | "history" | "store-review";
  title: string;
  payload: unknown;
  createdAt: string;
}

@Injectable()
export class UserDataService {
  private readonly items: SavedItem[] = [];

  list(type?: SavedItem["type"]) {
    return type ? this.items.filter((item) => item.type === type) : this.items;
  }

  create(type: SavedItem["type"], title: string, payload: unknown) {
    const item: SavedItem = {
      id: `item_${crypto.randomUUID()}`,
      type,
      title,
      payload,
      createdAt: new Date().toISOString()
    };
    this.items.unshift(item);
    return item;
  }

  remove(id: string) {
    const index = this.items.findIndex((item) => item.id === id);
    if (index < 0) throw new NotFoundException("Item not found");
    const [removed] = this.items.splice(index, 1);
    return removed;
  }
}

