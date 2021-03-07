import _ from 'lodash';

export function match(data: object = {}, filter: QueryFilter = {}) {
  if (Array.isArray(filter)) {
    return matchAny(data, filter);
  } else {
    return matchAll(data, filter);
  }
}

export function matchAny(data: object = {}, filter: WhereFilter[] = []) {
  let match = false;

  for (const ft of filter) {
    if (matchAll(data, ft)) {
      match = true;
    }
  }

  return match;
}

export function matchAll(data: object = {}, filter: WhereFilter = {}) {
  let match = true;

  for (const [key, type] of Object.entries(filter)) {
    const target = _.get(data, key);

    if (typeof target === 'undefined') {
      return false;
    }

    if (typeof type === 'object') {
      for (const [op, value] of Object.entries(type)) {
        switch (op) {
          case 'eq':
            if (target !== value) match = false;
            break;
          case 'neq':
            if (target === value) match = false;
            break;
          case 'gt':
            if (typeof target !== 'number' || !(target > value)) match = false;
            break;
          case 'gte':
            if (typeof target !== 'number' || !(target >= value)) match = false;
            break;
          case 'lt':
            if (typeof target !== 'number' || !(target < value)) match = false;
            break;
          case 'lte':
            if (typeof target !== 'number' || !(target <= value)) match = false;
            break;
          case 'inq':
            if (!value.includes(target)) match = false;
            break;
          case 'nin':
            if (value.includes(target)) match = false;
            break;
          case 'like':
            if (typeof target !== 'string' || !target.includes(value)) match = false;
            break;
          case 'between':
            if (typeof target !== 'number' || target < value[0] || value > value[1]) match = false;
            break;
          default:
            break;
        }
      }
    } else {
      if (target !== type) match = false;
    }
  }

  return match;
}

export type QueryFilter = WhereFilter | WhereFilter[];

export type WhereFilter = {
  [key: string]: ValueType | WhereCondition
}

export type WhereCondition = {
  eq?: any;
  neq?: any;
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
  inq?: Array<ValueType>;
  nin?: Array<ValueType>;
  like?: string;
  between?: [number, number];
}

export type ValueType = string | number | null | Date;
