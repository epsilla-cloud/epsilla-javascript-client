export interface LoadDBPayload {
  path: string;
  name: string;
  vectorScale?: number;
  walEnabled?: boolean;
}

export interface QueryPayload {
  table: string;
  queryField: string;
  queryVector: number[];
  limit: number;
  response?: string[];
  filter?: string;
  withDistance?: boolean;
}

export interface QueryExtraArgsConfig {
  filter?: string;
}

export interface EpsillaResponse {
  statusCode: number;
  message: string;
  result?: any;
}