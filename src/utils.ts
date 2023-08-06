import { AxiosError } from 'axios';

export async function HandleAxiosError(err: any): Promise<string> {
  const error = err as AxiosError;

  if (error.response) {
    // The request was made and the server responded with a status code that falls out of the range of 2xx
    // console.error(`Error with request to ${error.response.config.url}: ${error.response.status} - ${error.response.statusText}`);
    return Promise.reject(`Response data: ${JSON.stringify(error.response.data)}`);
  } else if (error.request) {
    // The request was made but no response was received
    return Promise.reject(`No response received. There might be an issue connecting to ${error.config?.url}. Ensure the server is running and accessible.`);
    // console.error(`Error message: ${error.message}`);
  } else {
    // Something happened in setting up the request that triggered an error
    return Promise.reject(`Error setting up request: ${error.message}`);
  }
}