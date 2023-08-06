import axios, { AxiosError, AxiosInstance } from 'axios';
import { LoadPayload } from './models';

interface ClientConfig {
  protocol?: string;
  host?: string;
  port?: number;
}

class EpsillaDB {
  private protocol: string;
  private host: string;
  private port: number;
  private db: string | null;
  private httpClient: AxiosInstance;

  constructor({ protocol = 'http', host = 'localhost', port = 8888 }: ClientConfig = {}) {
    this.protocol = protocol;
    this.host = host;
    this.port = port;
    this.db = null;

    const baseurl = `${this.protocol}://${this.host}:${this.port}`;
    this.httpClient = axios.create({
      baseURL: baseurl,
      headers: { 'Content-type': 'application/json' },
      timeout: 10 }
    );
    this.checkNetworking();
  }

  private async checkNetworking() {
    try {
      const response = await this.httpClient.get('/');
      if (response.status === 200) {
        console.log(`[INFO] Connected to ${this.host}:${this.port} successfully.`);
      } else {
        console.error(`[ERROR] Failed to connect to ${this.host}:${this.port}`);
        return new Error(`[ERROR] Failed to connect to ${this.host}:${this.port}`);
      }
    } catch (error) {
      console.error(`[ERROR] Failed to connect to ${this.host}:${this.port}`);
      return new Error(`[ERROR] Failed to connect to ${this.host}:${this.port}`);
    }
  }

  useDB(dbName: string) {
    this.db = dbName;
  }

  async loadDB(dbPath: string, dbName: string, vectorScale?: number, walEnabled?: boolean) {
    try {
      const payload: LoadPayload = {
        name: dbName,
        path: dbPath
      };
      if (vectorScale) {
        payload.vectorScale = vectorScale;
      }
      if (walEnabled) {
        payload.walEnabled = walEnabled;
      }
      const response = await this.httpClient.post('/api/load', payload);

      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data;
    }
  }

  async unloadDB(dbName: string) {
    try {
      const response = await this.httpClient.post(`/api/${dbName}/unload`);
      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data;
    }
  }

  async createTable(tableName: string, fields: any[]) {
    if (!this.db) {
      console.error('[ERROR] Please use_db() first!');
      return new Error('[ERROR] Please use_db() first!');
    }
    try {
      const response = await this.httpClient.post(`/api/${this.db}/schema/tables`,
        {
          name: tableName,
          fields
        }
      );
      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data;
    }
  }

  async insert(tableName: string, data: any[]) {
    if (!this.db) {
      console.error('[ERROR] Please use_db() first!');
      return new Error('[ERROR] Please use_db() first!');
    }
    try {
      const response = await this.httpClient.post(`/api/${this.db}/data/insert`,
        {
          table: tableName,
          data
        }
      );
      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data;
    }
  }

  async query(
    tableName: string,
    queryField: string,
    queryVector: number[],
    limit: number,
    responseField: string[] = [],
    withDistance = false
  ) {
    if (!this.db) {
      console.error('[ERROR] Please use_db() first!');
      return new Error('[ERROR] Please use_db() first!');
    }
    try {
      const response = await this.httpClient.post(`/api/${this.db}/data/query`,
        {
          table: tableName,
          queryField,
          queryVector,
          response: responseField,
          limit,
          withDistance
        }
      );
      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data;
    }
  }

  async get(tableName: string, responseField: string[] = []) {
    if (!this.db) {
      console.error('[ERROR] Please use_db() first!');
      return new Error('[ERROR] Please use_db() first!');
    }
    try {
      const response = await this.httpClient.post(`/api/${this.db}/data/get`,
        {
          table: tableName,
          response: responseField
        }
      );
      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data;
    }
  }

  async dropTable(tableName: string) {
    if (!this.db) {
      console.error('[ERROR] Please use_db() first!');
      return new Error('[ERROR] Please use_db() first!');
    }
    try {
      const response = await this.httpClient.delete(`/api/${this.db}/schema/tables/${tableName}`);
      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data;
    }
  }

  async dropDB(dbName: string) {
    try {
      const response = await this.httpClient.delete(`/api/${dbName}/drop/`);
      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data;
    }
  }
}

export default EpsillaDB