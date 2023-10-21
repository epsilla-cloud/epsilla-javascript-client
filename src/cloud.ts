import axios, { AxiosError } from 'axios';
import { DeleteRecordsConfig, EpsillaResponse, PreviewConfig, QueryConfig } from './models';

export interface CloudClientConfig {
  projectID: string;
  apiKey: string;
}

const projectHost = 'https://dispatch.epsilla.com/api/v2/project/';
const vectordbPath = 'api/v2/project/${projectID}/vectordb';
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

  constructor({ projectID, apiKey }: CloudClientConfig) {
    this.projectID = projectID;
    this.headers = { 'Content-type': 'application/json', 'X-API-KEY': apiKey };
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
      const response = await axios.get(`${projectHost}${this.projectID}/vectordb/${this.dbID}`, { headers: this.headers });
      this.host = 'https://' + response.data.result.public_endpoint;
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
    if (!config.primaryKeys) {
      return new Error('[ERROR] Please provide primary keys to delete records!');
    }
    if (config.filter) {
      console.warn('[WARNING] Epsilla Cloud has not supported deleting records with filter yet.')
    }
    try {
      const response = await axios.post(
        `${this.host}/${vectordbPath.replace('${projectID}', this.projectID)}/${this.dbID}/data/delete`,
        {
          table: tableName,
          primaryKeys: config.primaryKeys
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
}