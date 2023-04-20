export enum EventType {
  SceneListSelectedChange,
  SceneChanged,
  SceneReloaded,
  PipelineConfigChanged,
}

export type EventHandler = (param: any) => Promise<void>;

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

  async fire(type: EventType, param?: any) {
    if (this.handlers[type] == undefined) this.handlers[type] = [];
    await this.handlers[type].forEach(async h => await h(param));
  }
}