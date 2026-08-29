import { EventEmitter } from 'node:events';

export interface HubEvent {
  id: string;
  type: 'log' | 'progress' | 'error' | 'success';
  stage: string;
  message: string;
  data?: any;
  timestamp: string;
}

export class EventBus extends EventEmitter {
  private static instance: EventBus;

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public emitLog(stage: string, message: string, data?: any): void {
    const event: HubEvent = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'log',
      stage,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    this.emit('event', event);
  }

  public emitSuccess(stage: string, message: string, data?: any): void {
    const event: HubEvent = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'success',
      stage,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    this.emit('event', event);
  }

  public emitError(stage: string, message: string, error?: any): void {
    const event: HubEvent = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'error',
      stage,
      message,
      data: error ? String(error) : undefined,
      timestamp: new Date().toISOString()
    };
    this.emit('event', event);
  }
}
