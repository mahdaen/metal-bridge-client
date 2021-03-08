import { QueryFilter } from './filter';
import { LogLevel } from './logger';
import { Subscription } from './metal-event';

export type MessageBody = string | number | JSONBody | any[];
export type JSONBody = { [key: string]: any };
export type ClientMessage<T> = {
  type: 'request' | 'subscription';
  data: ClientRequest<T> | ClientSubscription;
  uuid: string;
};
export type ClientRequest<T> = {
  method: RequestMethod;
  url: string;
  headers?: RequestHeaders;
  data?: T;
};
export type ClientSubscription = {
  method: 'subscribe' | 'unsubscribe';
  url: string;
  headers?: RequestHeaders;
  filters?: QueryFilter;
};

export type RequestMethod = 'post' | 'get' | 'put' | 'patch' | 'delete' | 'options' | 'subscribe' | 'unsubscribe';
export type RequestHeaders = {
  [key: string]: string;
};

export type ServerMessage<T> = {
  type: 'response' | 'event';
  data: ServerResponse<T> | ServerEvent<T>;
  uuid: string;
};

export type ServerResponse<T> = {
  status: number;
  statusText: string;
  headers?: RequestHeaders;
  data?: T;
};

export type ServerEventType = RequestMethod | 'touch';
export type ServerEvent<T> = {
  type: ServerEventType;
  path: string;
  filters?: QueryFilter;
  data?: T;
  referer?: ServerEvent<any>;
};

export interface ClientConfig {
  baseURL: string;
  clientId?: string;
  headers?: RequestHeaders;
  timeout?: number;
  logLevel?: LogLevel;
  autoConnect?: boolean;
  keepAlive?: boolean;
}

export type QueryParams = {
  [key: string]: string | boolean | number | Date | string[] | number[] | object;
};

export interface RequestOptions {
  params?: QueryParams;
  filters?: QueryFilter;
  headers?: RequestHeaders;
  timeout?: number;
}

export interface RequestConfig<T> extends RequestOptions {
  url: string;
  method: RequestMethod;
  data?: T;
}

export type Requests = {
  [id: string]: (res: ServerResponse<any>) => void;
};
export type SubscriptionHandler<D> = (event: ServerEvent<D>) => void | Promise<void>;
export type Subscriber<D> = {
  handler: SubscriptionHandler<D>;
  subscription: Subscription<D>;
};
export type RequestQueue = {
  resolve: (value?: any) => void;
  reject: (error?: Error) => void
};
