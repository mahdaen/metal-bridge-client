export function match(data: object = {}, filter: QueryFilter = {}): boolean {
  if (Array.isArray(filter)) {
    return matchAny(data, filter);
  } else {
    return matchAll(data, filter);
  }
}

export function matchAny(data: object = {}, filter: WhereFilter[] = []): boolean {
  let matching = false;

  for (const ft of filter) {
    if (matchAll(data, ft)) {
      matching = true;
    }
  }

  return matching;
}

export function matchAll(data: object = {}, filter: WhereFilter = {}): boolean {
  let matching = true;

  for (const [key, type] of Object.entries(filter)) {
    const target = data[key];

    if (typeof target === 'undefined') {
      return false;
    }

    if (typeof type === 'object') {
      for (const [op, value] of Object.entries(type as object)) {
        switch (op) {
          case 'eq':
            if (target !== value) { matching = false; }
            break;
          case 'neq':
            if (target === value) { matching = false; }
            break;
          case 'gt':
            if (typeof target !== 'number' || !(target > value)) { matching = false; }
            break;
          case 'gte':
            if (typeof target !== 'number' || !(target >= value)) { matching = false; }
            break;
          case 'lt':
            if (typeof target !== 'number' || !(target < value)) { matching = false; }
            break;
          case 'lte':
            if (typeof target !== 'number' || !(target <= value)) { matching = false; }
            break;
          case 'inq':
            if (!value.includes(target)) { matching = false; }
            break;
          case 'nin':
            if (value.includes(target)) { matching = false; }
            break;
          case 'like':
            if (typeof target !== 'string' || !target.includes(value)) { matching = false; }
            break;
          case 'between':
            if (typeof target !== 'number' || target < value[0] || value > value[1]) { matching = false; }
            break;
          default:
            break;
        }
      }
    } else {
      if (target !== type) { matching = false; }
    }
  }

  return matching;
}

export type QueryFilter = WhereFilter | WhereFilter[];

export type WhereFilter = {
  [key: string]: ValueType | WhereCondition
};

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
};

export type ValueType = string | number | null | Date;
