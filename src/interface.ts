import { QueryFilter } from './filter';

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
}

export type ServerResponse<T> = {
  status: number;
  statusText: string;
  headers?: RequestHeaders;
  data?: T;
}

export type ServerEventType = RequestMethod | 'touch';
export type ServerEvent<T> = {
  type: ServerEventType;
  path: string;
  filters?: QueryFilter;
  data?: T;
  referer?: ServerEvent<any>;
}
