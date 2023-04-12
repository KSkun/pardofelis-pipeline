export enum EventType {
  SceneListSelectedChange,
  SceneChanged,
}

export type EventHandler = (param: any) => void;

export class EventManager {
  private handlers: Partial<Record<keyof typeof EventType, EventHandler[]>> = {};

  addListener(type: EventType, handler: EventHandler) {
    if (this.handlers[type] == undefined) this.handlers[type] = [];
    this.handlers[type].push(handler);
  }

  removeListener(type: EventType, handler: EventHandler) {
    if (this.handlers[type] == undefined) this.handlers[type] = [];
    this.handlers[type] = this.handlers[type].filter(e => e != handler);
  }

  fire(type: EventType, param?: any) {
    if (this.handlers[type] == undefined) this.handlers[type] = [];
    this.handlers[type].forEach(h => h(param));
  }
}