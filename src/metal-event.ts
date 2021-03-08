import { EventEmitter } from './event';
import { QueryFilter } from './filter';
import {
  ClientConfig,
  ClientMessage,
  ClientRequest,
  ClientSubscription,
  QueryParams,
  RequestConfig,
  RequestOptions,
  RequestQueue,
  Requests,
  ServerEvent,
  ServerMessage,
  ServerResponse,
  Subscriber,
  SubscriptionHandler,
} from './interface';
import { Logger } from './logger';
import uuid from './uuid';

export class MetalEvent {
  private client?: WebSocket;
  private requests: Requests = {};
  private subscriptions: {
    [id: string]: Subscriber<any>[]
  } = {};
  private queues: RequestQueue[] = [];
  private retries = 0;

  public status: 'init' | 'ready' = 'init';
  public connected = new EventEmitter();
  public disconnected = new EventEmitter();
  public message = new EventEmitter();

  private get baseURL(): string {
    return this.config.baseURL.replace(/^http/, 'ws');
  }

  public get readyState(): number {
    if (this.client) {
      return this.client.readyState;
    }

    return 0;
  }

  constructor(protected config: ClientConfig) {
    if (config.logLevel) {
      Logger.config.level = config.logLevel;
    }

    if (config.autoConnect) {
      this.connect();
    }
  }

  public connect(reconnect?: boolean): void {
    let url = `${this.baseURL}?clientId=${this.config.clientId || uuid()}`;

    if (reconnect) {
      url = `${url}&reconnect=true`;
    }

    this.client = new WebSocket(url);
    this.client.onopen = (e) => {
      this.status = 'ready';
      this.retries = 0;
      this.connected.emit(e);

      if (this.queues.length) {
        for (const queue of this.queues) {
          queue.resolve();
          this.queues.splice(this.queues.indexOf(queue), 1);
        }
      }
    };

    this.client.onclose = (e) => {
      this.disconnected.emit(e);

      if (this.retries >= 20) {
        const error = new Error('WebSocket connection retries reach the limit. Connection failed!');
        Logger.error(error.message, error);

        if (this.queues.length) {
          for (const queue of this.queues) {
            queue.reject();
            this.queues.splice(this.queues.indexOf(queue), 1);
          }
        }
      }

      if (this.status === 'init') {
        this.retries += 1;
        this.connect();
      } else {
        if (this.config.keepAlive) {
          if (this.config.keepAlive) { this.connect(true); }
        }
      }
    };

    this.client.onmessage = (msg) => {
      this.message.emit(msg);
      const message: ServerMessage<any> = JSON.parse(msg.data);
      if (message.type === 'response') {
        const data = message.data as ServerResponse<any>;
        if (this.requests[message.uuid]) {
          this.requests[message.uuid](data);
        }
      } else if (message.type === 'event') {
        const data = message.data as ServerEvent<any>;
        if (this.subscriptions[message.uuid]) {
          this.subscriptions[message.uuid].forEach(sub => sub.handler(data));
        }
      }
    };
  }

  public async get<D>(url: string, options?: RequestOptions): Promise<ServerResponse<D>> {
    return this.request({
      url,
      method: 'get', ...options,
    });
  }

  public async post<R, D>(url: string, data: R, options?: RequestOptions): Promise<ServerResponse<D>> {
    return this.request({
      url,
      method: 'post',
      data, ...options,
    });
  }

  public async put<R, D>(url: string, data: R, options?: RequestOptions): Promise<ServerResponse<D>> {
    return this.request({
      url,
      method: 'put',
      data, ...options,
    });
  }

  public async delete<D>(url: string, options?: RequestOptions): Promise<ServerResponse<D>> {
    return this.request({
      url,
      method: 'delete', ...options,
    });
  }

  public async options(url: string, options?: RequestOptions): Promise<ServerResponse<void>> {
    return this.request({
      url,
      method: 'options', ...options,
    });
  }

  public async request<R, D>(config: RequestConfig<R>): Promise<ServerResponse<D>> {
    const data: ClientRequest<R> = this.createRequest(config);
    return this.submit({
      type: 'request',
      uuid: uuid(),
      data
    });
  }

  public async subscribe<D>(
    path: string,
    handler: SubscriptionHandler<D>,
    options: RequestOptions = {},
  ): Promise<Subscription<D>> {
    if (!path) {
      throw new Error('Subscription path is required.');
    }

    if (!handler) {
      throw new Error('Subscription handler is required.');
    }

    const {
      params = {},
      headers = {}
    } = options;
    const filters = options.filters || (params.filters || {} as any).where as QueryFilter || {};
    const req = this.createRequest({
      url: path,
      method: 'subscribe',
      params,
      headers
    }) as ClientSubscription;
    const request: ClientSubscription = {
      ...req,
      filters
    };

    const response = await this.submit<any, any>({
      type: 'subscription',
      uuid: uuid(),
      data: request
    });
    const subscription = new Subscription<D>(request, response, handler);
    const info: Subscriber<D> = {
      handler,
      subscription,
    };
    if (!this.subscriptions[subscription.id]) {
      this.subscriptions[subscription.id] = [];
    }
    this.subscriptions[subscription.id].push(info);
    subscription.unsubscribe = async () => {
      await this.unsubscribe(path, options);
      this.subscriptions[subscription.id]
        .splice(this.subscriptions[subscription.id].indexOf(info), 1);
    };

    return subscription;
  }

  protected async unsubscribe(path: string, options: RequestOptions = {}): Promise<void> {
    const {
      params = {},
      headers = {}
    } = options;
    const filters = options.filters || (params.filter || {} as any).where as QueryFilter || {};
    const req = this.createRequest({
      url: path,
      method: 'unsubscribe',
      params,
      headers
    }) as ClientSubscription;
    const request: ClientSubscription = {
      ...req,
      filters
    };

    await this.submit({
      type: 'subscription',
      uuid: uuid(),
      data: request
    });
  }

  protected createRequest<R>(config: RequestConfig<R>): ClientRequest<R> {
    const {
      url,
      method,
      params = {},
      headers = {},
      data
    } = config;
    return {
      method,
      data,
      headers: { ...this.config.headers || {}, ...headers },
      url: this.createURL(url, params),
    };
  }

  protected createURL(url: string, params: QueryParams = {}): string {
    if (!url.startsWith('/')) {
      url = `/${url}`;
    }

    return params && Object.keys(params).length ? `${url}?${stringify(params)}` : url;
  }

  protected async submit<R, D>(
    message: ClientMessage<R>,
    options: RequestOptions = {}
  ): Promise<ServerResponse<D>> {
    const start = new Date().getTime();

    if (this.status !== 'ready') {
      await new Promise((resolve, reject) => {
        this.queues.push({
          resolve,
          reject
        });
      });
    }

    return new Promise<ServerResponse<D>>((resolve, reject) => {
      this.requests[message.uuid] = (res: ServerResponse<D>) => {
        if (res.status >= 200 && res.status < 300) {
          resolve(res);
        } else {
          reject(new RequestError(message.data, res));
        }

        delete this.requests[message.uuid];
        Logger.info(`Request ${message.uuid} finished in: ${new Date().getTime() - start}ms.`);
      };

      if (options.timeout || this.config.timeout) {
        setTimeout(() => {
          reject(new RequestTimeout(message.data));
        }, options.timeout || this.config.timeout);
      }

      if (this.client) {
        this.client.send(JSON.stringify(message));
      }
    });
  }
}

export class Subscription<D> {
  public id: string;
  public unsubscribe?: () => void;

  constructor(
    public request: ClientSubscription,
    public response: ServerResponse<any>,
    private handler: SubscriptionHandler<D>,
  ) {
    if (response.data && response.data.id) {
      this.id = response.data.id;
    } else {
      throw new Error('Missing subscription id.');
    }
  }

  public emit(event: ServerEvent<D>): void {
    this.handler(event);
  }
}

export class RequestTimeout extends Error {
  public code = 408;

  constructor(public request: ClientRequest<any>, message = 'Request timed out.') {
    super(message);
  }
}

export class RequestError extends Error {
  public code: number;

  constructor(public request: ClientRequest<any>, public response: ServerResponse<any>) {
    super(response.statusText);
    this.code = response.status;
  }
}

export function stringify(params: QueryParams): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      if (Array.isArray(value)) {
        for (const val of value) {
          query.append(key, val as string);
        }
      } else if (toString.call(value) === '[object Object]') {
        query.set(key, JSON.stringify(value));
      } else if (toString.call(value) === '[object Date]') {
        query.set(key, (value as Date).toISOString());
      } else {
        query.set(key, value as string);
      }
    }
  }

  return query.toString();
}
