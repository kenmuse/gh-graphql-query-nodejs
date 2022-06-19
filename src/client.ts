// This module is responsible for creating a GraphQL client that can
// be used to query the GitHub API. It is invoked by calling getClient(token).

import { graphql } from '@octokit/graphql';
import type { graphql as ClientType, RequestParameters } from '@octokit/graphql/dist-types/types';

/**
 * Creates an instance of the GitHub GraphQL client.
 * @param token the GitHub token
 * @returns the GitHub GraphQL client
 */
export function getClient(token: string) : IQueryClient {
    return new QueryClient(token);
}

/**
 * The GitHub GraphQL client.
 */
class QueryClient implements IQueryClient {
    private readonly client: ClientType;

    /**
     * Creates an instance of the GitHub GraphQL client.
     * @param token the GitHub token
     */
    constructor(token: string) {
        this.client = graphql.defaults({
            headers: {
                authorization: `token ${token}`,
            },
        });
    }
    
    /**
     * Executes the query and returns the results.
     * @param query the query to be executed
     * @param variables the variables to be used in the query
     * @returns the results of the query
     * @throws an error (often GraphqlResponseError) if the query fails
     */
    async query<ResponseType>(query: string, variables: RequestParameters) : Promise<ResponseType> {
        const result = await this.client<ResponseType>(query, variables);
        return result;
    }
}

/**
 * The interface for the GitHub GraphQL client.
 */
export interface IQueryClient {
    query<ResponseType>(query: string, variables: any) : Promise<ResponseType>;
}
