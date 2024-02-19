// VectorRetriever.ts
import {
  QueryPayload,
  SearchEngineCandidate,
  Reranker,
} from './models';
import EpsillaDB from './vectordb';
import { VectorDB } from './cloud';

export class VectorRetriever {
  private dbClient: EpsillaDB | VectorDB;
  private table: string;
  private primaryKeyField: string;
  private queryIndex?: string;
  private queryField?: string;
  private queryVector?: any; // Adjust based on your vector type
  private response?: string[];
  private limit: number;
  private filter: string;

  constructor(
    dbClient: EpsillaDB | VectorDB,
    table: string,
    primaryKeyField?: string,
    queryIndex?: string,
    queryField?: string,
    queryVector?: any,
    response?: string[],
    limit: number = 2,
    filter: string = '',
  ) {
    this.dbClient = dbClient;
    this.table = table;
    this.primaryKeyField = primaryKeyField || 'ID';
    this.queryIndex = queryIndex;
    this.queryField = queryField;
    this.queryVector = queryVector;
    this.response = response;
    this.limit = limit;
    this.filter = filter;
  }

  async retrieve(query: string): Promise<SearchEngineCandidate[]> {
    const queryPayload: QueryPayload = {
      table: this.table,
      query: query,
      queryIndex: this.queryIndex,
      queryField: this.queryField,
      queryVector: this.queryVector,
      response: this.response,
      limit: this.limit,
      filter: this.filter,
      withDistance: true,
    };

    const response = await this.dbClient.query(this.table, queryPayload);
    if (response instanceof Error) {
      throw new Error(`Failed to retrieve data from table ${this.table}: ${response.message || 'Unknown error'}`);
    } else {
      // Add @id from the table to each record based on the primaryKeyField
      return response.result?.map((record: any) => {
        if (!(this.primaryKeyField in record)) {
          throw new Error(`Primary key field ${this.primaryKeyField} not found in the response from table ${this.table}`);
        }
        return { ...record, '@id': record[this.primaryKeyField] };
      }) || [];
    }
  }
}

export class RRFReRanker implements Reranker {
  private weights: number[];
  private k: number;
  private limit?: number;

  constructor(weights: number[] = [], k: number = 50, limit?: number) {
    this.weights = weights;
    this.k = k;
    this.limit = limit;
  }

  async rerank(candidates: SearchEngineCandidate[][]): Promise<SearchEngineCandidate[]> {
    // Initialize weights if not provided
    if (!this.weights.length) {
      this.weights = Array(candidates.length).fill(1);
    }

    // Validate weights length
    if (this.weights.length !== candidates.length) {
      throw new Error('The length of weights should be equal to the number of candidate lists');
    }

    // Calculate RRF scores for each candidate
    const rrfScores: { [id: string]: { candidate: SearchEngineCandidate; score: number } } = {};

    candidates.forEach((candidateList, i) => {
      const weight = this.weights[i];
      candidateList.forEach((candidate, rank) => {
        const rrfScore = weight / (this.k + rank + 1); // +1 because rank starts at 0 in JS/TS
        const id = String(candidate['@id']);
        if (rrfScores[id]) {
          rrfScores[id].score += rrfScore;
        } else {
          rrfScores[id] = { candidate, score: rrfScore };
        }
      });
    });

    // Sort candidates based on aggregated RRF score
    let sortedCandidates = Object.values(rrfScores).sort((a, b) => b.score - a.score).map((item) => item.candidate);

    // Apply the limit to the final list if specified
    if (this.limit) {
      sortedCandidates = sortedCandidates.slice(0, this.limit);
    }

    return sortedCandidates;
  }
}

export class RelativeScoreFusionReranker implements Reranker {
  private limit?: number;

  constructor(limit?: number) {
    this.limit = limit;
  }

  private normalizeDistances(candidates: SearchEngineCandidate[]): SearchEngineCandidate[] {
    if (candidates.length < 2) {
      return candidates.map(candidate => ({ ...candidate, normalizedScore: 1 }));
    }

    const distances = candidates.map(candidate => candidate['@distance'] || 1);
    const maxDistance = Math.max(...distances);
    const minDistance = Math.min(...distances);

    if (maxDistance === minDistance) {
      return candidates.map(candidate => ({ ...candidate, normalizedScore: 1 }));
    }

    return candidates.map(candidate => {
      const normalizedScore = ((candidate['@distance'] || maxDistance) - minDistance) / (maxDistance - minDistance);
      return { ...candidate, normalizedScore: 1 - normalizedScore }; // Invert so that smaller distances get higher scores
    });
  }

  async rerank(candidatesLists: SearchEngineCandidate[][]): Promise<SearchEngineCandidate[]> {
    const normalizedLists = candidatesLists.map(list => this.normalizeDistances(list));

    const aggregatedScores: { [id: string]: { candidate: SearchEngineCandidate; score: number } } = {};

    normalizedLists.forEach(list => {
      list.forEach(({ '@id': id, normalizedScore }) => {
        if (aggregatedScores[id]) {
          aggregatedScores[id].score += normalizedScore as number;
        } else {
          aggregatedScores[id] = { 
            candidate: list.find(candidate => candidate['@id'] === id) as SearchEngineCandidate,
            score: normalizedScore as number
          };
        }
      });
    });

    let sortedCandidates = Object.values(aggregatedScores)
      .sort((a, b) => b.score - a.score)
      .map(item => item.candidate);

    if (this.limit) {
      sortedCandidates = sortedCandidates.slice(0, this.limit);
    }

    return sortedCandidates;
  }
}

export class DistributionBasedScoreFusionReranker implements Reranker {
  private scaleRanges: number[][];
  private limit?: number;

  constructor(scaleRanges: number[][] = [], limit?: number) {
    this.scaleRanges = scaleRanges;
    this.limit = limit;
  }

  private normalizeDistances(scaleRange: number[], candidates: SearchEngineCandidate[]): SearchEngineCandidate[] {
    const [minScale, maxScale] = scaleRange;

    return candidates.map(candidate => {
      let normalizedScore = 0;
      if (maxScale !== minScale) { // Avoid division by zero
        normalizedScore = (candidate['@distance'] - minScale) / (maxScale - minScale);
        normalizedScore = Math.max(0, Math.min(1, normalizedScore)); // Clamp between 0 and 1
      }
      return { ...candidate, normalizedScore: 1 - normalizedScore }; // Invert score so smaller distances score higher
    });
  }

  async rerank(candidatesLists: SearchEngineCandidate[][]): Promise<SearchEngineCandidate[]> {
    if (this.scaleRanges.length !== candidatesLists.length) {
      throw new Error("The length of scaleRanges should be equal to the number of candidates lists.");
    }

    const normalizedLists = candidatesLists.map((list, index) => 
      this.normalizeDistances(this.scaleRanges[index], list)
    );

    const aggregatedScores: { [id: string]: { candidate: SearchEngineCandidate; score: number } } = {};

    normalizedLists.forEach(list => {
      list.forEach(({ '@id': id, normalizedScore }) => {
        if (aggregatedScores[id]) {
          aggregatedScores[id].score += normalizedScore as number;
        } else {
          const candidate = list.find(candidate => candidate['@id'] === id) as SearchEngineCandidate;
          aggregatedScores[id] = { candidate, score: normalizedScore as number };
        }
      });
    });

    let sortedCandidates = Object.values(aggregatedScores)
      .sort((a, b) => b.score - a.score)
      .map(item => item.candidate);

    if (this.limit !== undefined) {
      sortedCandidates = sortedCandidates.slice(0, this.limit);
    }

    return sortedCandidates;
  }
}

class SearchEngine {
  private dbClient: EpsillaDB | VectorDB;
  private retrievers: VectorRetriever[] = [];
  private reranker?: Reranker;

  constructor(dbClient: EpsillaDB | VectorDB) {
    this.dbClient = dbClient;
  }

  addRetriever(
    table: string,
    primaryKeyField: string = "ID",
    queryIndex?: string,
    queryField?: string,
    queryVector?: any, // Adjust based on your vector type
    response?: string[],
    limit: number = 2,
    filter: string = ''
  ): SearchEngine {
    this.reranker = undefined; // Reset reranker when a new retriever is added
    this.retrievers.push(
      new VectorRetriever(
        this.dbClient,
        table,
        primaryKeyField,
        queryIndex,
        queryField,
        queryVector,
        response,
        limit,
        filter
      )
    );
    return this;
  }

  setReranker(type: string, weights?: number[], scaleRanges?: number[][], k: number = 50, limit?: number): SearchEngine {
    switch (type) {
      case "rrf":
      case "reciprocal_rank_fusion":
        this.reranker = new RRFReRanker(weights, k, limit);
        break;
      case "rsf":
      case "relative_score_fusion":
        this.reranker = new RelativeScoreFusionReranker(limit);
        break;
      case "dbsf":
      case "distribution_based_score_fusion":
        this.reranker = new DistributionBasedScoreFusionReranker(scaleRanges, limit);
        break;
      default:
        throw new Error("Invalid reranker type: " + type);
    }
    return this;
  }

  async search(query: string): Promise<SearchEngineCandidate[]> {
    if (!this.retrievers.length) {
      throw new Error("No retriever added to the search engine");
    }
    if (this.retrievers.length > 1 && !this.reranker) {
      throw new Error("More than one retriever added to the search engine, but no reranker is set");
    }

    // Retrieve candidates concurrently
    const retrievePromises = this.retrievers.map(retriever => retriever.retrieve(query));
    let candidates = await Promise.all(retrievePromises);

    // Rerank candidates if reranker is set
    if (this.reranker) {
      candidates = [await this.reranker.rerank(candidates)];
    }

    // Flatten the array of arrays to a single array of candidates
    return candidates.flat();
  }
}

export default SearchEngine;

