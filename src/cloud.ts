import axios, { AxiosError } from 'axios';
import { DeleteRecordsConfig, EpsillaResponse, Index, PreviewConfig, QueryConfig, TableField } from './models';

import SearchEngine from './searchengine';

export interface CloudClientConfig {
  projectID: string;
  apiKey: string;
  headers?: { [key: string]: string };
}

const dispatchDomain = 'https://dispatch.epsilla.com';
const projectHost = 'https://dispatch.epsilla.com/api/v3/project';
const vectordbPath = 'api/v3/project/${projectID}/vectordb';
/**
 * Cloud client config:
 *  - projectID: The project ID you used for your cloud client.
 *  - apiKey: Your API key to connect your client.
 *
 * @export
 * @class EpsillaCloud
 */
export class EpsillaCloud {
  projectID: string;
  headers: any;

  constructor({ projectID, apiKey, headers = {} }: CloudClientConfig) {
    this.projectID = projectID;
    this.headers = { 'Content-type': 'application/json', 'X-API-KEY': apiKey };
    if (headers) {
      this.headers = { ...this.headers, ...headers };
    }
  }
}

/**
 * dbID: The ID of your vector database.
 * client: The client used for your vector database.
 *
 * @export
 * @class VectorDB
 */
export class VectorDB {
  private dbID: string;
  private host: string = '';
  private projectID: string;
  private headers: any;

  constructor(dbID: string, client: EpsillaCloud) {
    this.dbID = dbID;
    this.projectID = client.projectID;
    this.headers = client.headers;
  }

  async connect() {
    try {
      // Get public endpoint with project id.
      const response = await axios.get(`${projectHost}/${this.projectID}/vectordb/${this.dbID}`, { headers: this.headers });
      this.host = 'https://' + response.data.result.public_endpoint;

      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data as EpsillaResponse;
    }
  }

  async createTable(tableName: string, fields: TableField[], indices?: Index[]) {
    try {
      const domain = this.host || dispatchDomain;
      let payload: any = {
        name: tableName,
        fields
      };
      if (indices) {
        payload['indices'] = indices;
      }
      const response = await axios.post(
        `${domain}/api/v3/project/${this.projectID}/vectordb/${this.dbID}/table/create`,
        payload,
        { headers: this.headers }
      );
      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data as EpsillaResponse;
    }
  }

  async dropTable(tableName: string) {
    try {
      const domain = this.host || dispatchDomain;
      const response = await axios.delete(
        `${domain}/api/v3/project/${this.projectID}/vectordb/${this.dbID}/table/delete`,
        {
          params: {
            table_name: tableName
          },
          headers: this.headers
        }
      );
      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data as EpsillaResponse;
    }
  }

  private checkConnection() {
    if (!this.host) {
      console.error('[ERROR] Please connect to vector database first!');
      return new Error('[ERROR] Please connect to vector database first!');
    }
  }

  async insert(tableName: string, data: any[]): Promise<EpsillaResponse | Error> {
    this.checkConnection();
    try {
      const response = await axios.post(
        `${this.host}/${vectordbPath.replace('${projectID}', this.projectID)}/${this.dbID}/data/insert`,
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
    this.checkConnection();
    try {
      const response = await axios.post(
        `${this.host}/${vectordbPath.replace('${projectID}', this.projectID)}/${this.dbID}/data/insert`,
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

  async query(tableName: string, queryConfig: QueryConfig): Promise<EpsillaResponse | Error> {
    this.checkConnection();
    try {
      const payload = {
        table: tableName,
        ...queryConfig
      };

      const response = await axios.post(
        `${this.host}/${vectordbPath.replace('${projectID}', this.projectID)}/${this.dbID}/data/query`,
        payload,
        { headers: this.headers }
      );
      return response.data;
    } catch (err) {
      return (err as AxiosError).response?.data as EpsillaResponse;
    }
  }

  async delete(tableName: string, config: DeleteRecordsConfig): Promise<EpsillaResponse | Error> {
    this.checkConnection();
    if (!config || (!config.primaryKeys && !config.filter)) {
      return new Error('[ERROR] Please provide primary keys or filter expression to delete records!');
    }
    try {
      const response = await axios.post(
        `${this.host}/${vectordbPath.replace('${projectID}', this.projectID)}/${this.dbID}/data/delete`,
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

  async get(tableName: string, previewConfig?: PreviewConfig): Promise<EpsillaResponse | Error> {
    this.checkConnection();
    try {
      const response = await axios.post(
        `${this.host}/${vectordbPath.replace('${projectID}', this.projectID)}/${this.dbID}/data/get`,
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

  asSearchEngine(): SearchEngine {
    return new SearchEngine(this);
  }
}