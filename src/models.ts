export interface LoadDBPayload {
  path: string;
  name: string;
  vectorScale?: number;
  walEnabled?: boolean;
}

export interface TableField {
  name: string;
  dataType: string;
  primaryKey?: boolean;
  dimensions?: number;
  metricType?: string;
}

export interface SparseVector {
  indices: number[];
  values: number[];
}

export interface QueryPayload {
  table: string;
  queryField: string;
  queryVector: number[] | SparseVector;
  limit: number;
  response?: string[];
  filter?: string;
  withDistance?: boolean;
}

export interface QueryConfig {
  queryField: string;
  queryVector: number[] | SparseVector;
  limit: number;
  response?: string[];
  filter?: string;
  withDistance?: boolean;
}

export interface DeleteRecordsConfig {
  primaryKeys?: string[] | number[];
  filter?: string;
}

export interface PreviewConfig {
  response?: string[];
  primaryKeys?: string[] | number[];
  filter?: string;
  skip?: number;
  limit?: number;
}

export interface EpsillaBaseResponse {
  statusCode: number;
  message: string;
}

export interface EpsillaQueryResult {
  [key: string]: string | number | boolean | number[] | Object;
}

export interface EpsillaResponse extends EpsillaBaseResponse {
  result?: EpsillaQueryResult[] | string[];
  time?: number;
}