import axios, { AxiosError } from 'axios';

import {
  ClientConfig,
  DeleteRecordsConfig, EpsillaResponse, Index, LoadDBPayload,
  PreviewConfig, QueryConfig, QueryPayload, TableField
} from './models';

import SearchEngine from './searchengine';

class EpsillaDB {
  private protocol: string;
  private host: string;
  private port: number;
  private db: string | null;
  private baseurl: string;
  private headers: any;

  constructor({ protocol = 'http', host = 'localhost', port = 8888, headers = {} }: ClientConfig = {}) {
    this.protocol = protocol;
    this.host = host;
    this.port = port;
    this.db = null;
    this.baseurl = `${this.protocol}://${this.host}:${this.port}`;
    this.headers = { 'Content-type': 'application/json' };
    if (headers) {
      this.headers = { ...this.headers, ...headers };
    }
  }

  useDB(dbName: string) {
    this.db = dbName;
  }

  async loadDB(
    dbPath: string,
    dbName: string,
    vectorScale?: number,
    walEnabled?: boolean
  ): Promise<EpsillaResponse | Error> {
    try {
      const payload: LoadDBPayload = {
        name: dbName,
        path: dbPath
      };
      if (vectorScale) {
        payload.vectorScale = vectorScale;
      }
      if (walEnabled) {
        payload.walEnabled = walEnabled;
      }
      const response = await axios.post(`${this.baseurl}/api/load`, payload, { headers: this.headers });

      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data as EpsillaResponse;
    }
  }

  async unloadDB(dbName: string): Promise<EpsillaResponse | Error> {
    try {
      const response = await axios.post(`${this.baseurl}/api/${dbName}/unload`, { headers: this.headers });
      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data as EpsillaResponse;
    }
  }

  async createTable(tableName: string, fields: TableField[], indices?: Index[]): Promise<EpsillaResponse | Error> {
    if (!this.db) {
      console.error('[ERROR] Please useDB() first!');
      return new Error('[ERROR] Please useDB() first!');
    }
    try {
      let payload: any = {
        name: tableName,
        fields
      };
      if (indices) {
        payload['indices'] = indices;
      }
      const response = await axios.post(`${this.baseurl}/api/${this.db}/schema/tables`,
        payload,
        { headers: this.headers }
      );
      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data as EpsillaResponse;
    }
  }

  async listTables(): Promise<EpsillaResponse | Error> {
    if (!this.db) {
      console.error('[ERROR] Please useDB() first!');
      return new Error('[ERROR] Please useDB() first!');
    }
    try {
      const response = await axios.get(`${this.baseurl}/api/${this.db}/schema/tables/show`);
      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data as EpsillaResponse;
    }
  }

  async insert(tableName: string, data: any[]): Promise<EpsillaResponse | Error> {
    if (!this.db) {
      console.error('[ERROR] Please useDB() first!');
      return new Error('[ERROR] Please useDB() first!');
    }
    try {
      const response = await axios.post(`${this.baseurl}/api/${this.db}/data/insert`,
        {
          table: tableName,
          data
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data as EpsillaResponse;
    }
  }

  async upsert(tableName: string, data: any[]): Promise<EpsillaResponse | Error> {
    if (!this.db) {
      console.error('[ERROR] Please useDB() first!');
      return new Error('[ERROR] Please useDB() first!');
    }
    try {
      const response = await axios.post(`${this.baseurl}/api/${this.db}/data/insert`,
        {
          table: tableName,
          data,
          upsert: true,
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data as EpsillaResponse;
    }
  }

  async deleteByPrimaryKeys(tableName: string, primaryKeys: (string | number)[]): Promise<EpsillaResponse | Error> {
    if (!this.db) {
      console.error('[ERROR] Please useDB() first!');
      return new Error('[ERROR] Please useDB() first!');
    }
    try {
      const response = await axios.post(`${this.baseurl}/api/${this.db}/data/delete`,
        {
          table: tableName,
          primaryKeys
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data as EpsillaResponse;
    }
  }

  async delete(tableName: string, config: DeleteRecordsConfig): Promise<EpsillaResponse | Error> {
    if (!this.db) {
      console.error('[ERROR] Please useDB() first!');
      return new Error('[ERROR] Please useDB() first!');
    }
    if (!config || (!config.primaryKeys && !config.filter)) {
      return new Error('[ERROR] Please provide primary keys or filter expression to delete records!');
    }
    try {
      const response = await axios.post(`${this.baseurl}/api/${this.db}/data/delete`,
        {
          table: tableName,
          ...config
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data as EpsillaResponse;
    }
  }

  async query(tableName: string, queryConfig: QueryConfig): Promise<EpsillaResponse | Error> {
    if (!this.db) {
      console.error('[ERROR] Please useDB() first!');
      return new Error('[ERROR] Please useDB() first!');
    }
    try {
      const payload: QueryPayload = {
        table: tableName,
        ...queryConfig
      };
      const response = await axios.post(`${this.baseurl}/api/${this.db}/data/query`,
        payload,
        { headers: this.headers }
      );
      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data as EpsillaResponse;
    }
  }

  async get(tableName: string, previewConfig?: PreviewConfig): Promise<EpsillaResponse | Error> {
    if (!this.db) {
      console.error('[ERROR] Please useDB() first!');
      return new Error('[ERROR] Please useDB() first!');
    }
    try {
      const response = await axios.post(`${this.baseurl}/api/${this.db}/data/get`,
        {
          table: tableName,
          ...previewConfig
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data as EpsillaResponse;
    }
  }

  async dropTable(tableName: string): Promise<EpsillaResponse | Error> {
    if (!this.db) {
      console.error('[ERROR] Please useDB() first!');
      return new Error('[ERROR] Please useDB() first!');
    }
    try {
      const response = await axios.delete(`${this.baseurl}/api/${this.db}/schema/tables/${tableName}`, { headers: this.headers });
      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data as EpsillaResponse;
    }
  }

  async dropDB(dbName: string): Promise<EpsillaResponse | Error> {
    try {
      const response = await axios.delete(`${this.baseurl}/api/${dbName}/drop/`, { headers: this.headers });
      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data as EpsillaResponse;
    }
  }

  asSearchEngine(): SearchEngine {
    return new SearchEngine(this);
  }
}

export default EpsillaDB