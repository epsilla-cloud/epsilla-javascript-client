export interface ClientConfig {
  protocol?: string;
  host?: string;
  port?: number;
  headers?: { [key: string]: string };
}

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

export interface Index {
  name: string;
  field: string;
  model?: string;
  dimensions?: number;
}

export interface SparseVector {
  indices: number[];
  values: number[];
}

export interface QueryPayload {
  table: string;
  query?: string;
  queryIndex?: string;
  queryField?: string;
  queryVector?: number[] | SparseVector;
  limit: number;
  response?: string[];
  filter?: string;
  withDistance?: boolean;
  facets?: FacetConfig[];
}

export interface FacetConfig {
  group?: string[];
  aggregate: string[];
}

export interface QueryConfig {
  query?: string;
  queryIndex?: string;
  queryField?: string;
  queryVector?: number[] | SparseVector;
  limit: number;
  response?: string[];
  filter?: string;
  withDistance?: boolean;
  facets?: FacetConfig[];
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
  facets?: FacetConfig[];
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

export interface RetrieverConfig {
  table: string;
  primaryKeyField?: string;
  queryIndex?: string;
  queryField?: string;
  queryVector?: number[] | SparseVector;
  limit: number;
  response?: string[];
  filter?: string;
}

export interface RerankerConfig {
  weights?: number[];
  scaleRanges?: number[][];
  k: number;
  limit?: number;
}

export interface SearchEngineCandidate extends EpsillaQueryResult {
  '@id': string | number;
  '@distance': number;
}

export interface Reranker {
  rerank(candidates: SearchEngineCandidate[][]): Promise<SearchEngineCandidate[]>;
}
