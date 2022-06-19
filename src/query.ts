// Queries an organization for the permissions associated with each of its repositories
// and returns the results.

import * as QueryClient from './client.js';
import { Organization, PageInfo, Repository, RepositoryCollaboratorConnection, RepositoryCollaboratorEdge, Team } from '@octokit/graphql-schema';

/**
 * Executes the query and returns an array of unique user permissions.
 * @param token the GitHub token
 * @param organization the GitHub organization
 * @param paginate true to automatically gather all pages of the results
 * @param sortBy the column to use for sorting the results
 * @returns the results of the query
 */
export async function execute(token: string, organization: string, paginate: boolean, sortBy: SortColumn): Promise<Array<UserPermissionSummary>> {
    // Create the client
    const client = QueryClient.getClient(token);

    // Define the initial query variables
    const variables = { orgname: organization, endCursor: null, innerCursor: null };

    // Execute the query
    const results = await retrieveQueryResults(client, query, variables, paginate);

    // Eliminate duplicate results
    const unique = getUniqueInstances(results);

    // Return the sorted results
    return sort(unique, sortBy);
}

/**
 * The query to be executed to retrieve the list of users with permissions.
 */
const query = `
query ($orgname:String!, $endCursor: String, $innerCursor: String){
    organization(login: $orgname){
        repositories(first: 100, after: $endCursor) {
            nodes {
                nameWithOwner
                description
                url
                collaborators(first: 100, after: $innerCursor) {
                    edges {
                        permission
                        permissionSources {
                          permission
                          source {
                              ... on Organization {
                                  login
                              }
  
                              ... on Repository {
                                  nameWithOwner
                              }
  
                              ... on Team {
                                  name
                              }
                          }
                        }
                        node {
                            login
                        }
                    }
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                }
            }
            pageInfo {
                hasNextPage
                endCursor
            }
        }
    }
    rateLimit {
        limit
        cost
        remaining
        resetAt
    }
}`

/**
 * Queries the GitHub API for list of users and permissions by organization
 * @param client Represents the client to be used for the query
 * @param query The GraphQL query to be executed
 * @param variables The variables to be used in the query
 * @param paginate indicates whether to automatically return all pages of the results
 * @returns the results of the query
 */
async function retrieveQueryResults(client: QueryClient.IQueryClient,
    query: string,
    variables: UserPermissionQueryVariables,
    paginate: boolean): Promise<Array<UserPermissionSummary>> {
    const results = new Array<UserPermissionSummary>();

    try {
        // Get the results
        const result = await client.query<{ organization: Organization }>(query, variables);

        let repositories = result.organization.repositories.nodes?.filter((node): node is Repository => node !== null) ?? [];
        for (const repo of repositories.filter(r => r !== null)) {
            const collaborators = repo.collaborators;
            if (collaborators != null) {
                results.push(...processCollaborators(repo, collaborators));

                 // Additional inner payloads
                results.push(...await processAdditionalPages(paginate, 
                    collaborators.pageInfo, 
                    client, 
                    Object.assign({}, variables, { innerCursor: collaborators.pageInfo.endCursor })));
            }
        }

        // Additional outer payloads
        results.push(...await processAdditionalPages(paginate, 
            result.organization.repositories.pageInfo, 
            client, 
            Object.assign({}, variables, { endCursor: result.organization.repositories.pageInfo.endCursor, innerCursor: null })));

        return results;
    }
    catch (error) {
        console.error(JSON.stringify(error));
        return [];
    }
}

/**
 * Processes the collaborators of a repository and returns an array of UserPermissionSummaries
 * @param collaborators the list of collaborators
 * @param repo the repository
 * @returns the user summaries
 */
function processCollaborators(repo: Repository, collaborators: RepositoryCollaboratorConnection) : Array<UserPermissionSummary> {
    const summaries: Array<UserPermissionSummary> = [];
    const edges = collaborators.edges?.filter((edge): edge is RepositoryCollaboratorEdge => edge !== null) ?? [];
    for (const user of edges) {
        if (user) {
            const summary = createUserSummary(repo, user);
            summaries.push(summary);
        }
    }

    return summaries;
}

/**
 * Creates a UserPermissionSummary from a Repository and an associated RepositoryCollaboratorEdge
 * @param repository the repository details
 * @param user the edge containing the user details
 * @returns the UserPermissionSummary
 */
function createUserSummary(repository: Repository, user: RepositoryCollaboratorEdge): UserPermissionSummary {
    return {
        repository: repository?.nameWithOwner ?? "unknown",
        handle: user.node.login,
        permission: user.permission,
        organizationPermission: user.permissionSources?.find(src => isOrganization(src.source))?.permission ?? null,
        repositoryPermission: user.permissionSources?.find(src => isRepository(src.source))?.permission ?? null,
        teamPermission: user.permissionSources
            ?.filter(src => isTeam(src.source))
            ?.map<TeamPermission>(src => ({
                permission: src.permission,
                name: (src.source as Team).name
            })) ?? null
    };
}

/**
 * Processes additional pages of results and returns an array of UserPermissionSummaries
 * @param paginate indicates whether to automatically process all pages of the results
 * @param pageInfo the GraphQL page info response
 * @param client the GraphQL client
 * @param context the variables to be used in the query
 * @returns the next page of results for the query, or an empty array if there are no more results
 */
async function processAdditionalPages(paginate: boolean, pageInfo: PageInfo, client: QueryClient.IQueryClient, context: UserPermissionQueryVariables ): Promise<Array<UserPermissionSummary>> {
    if (paginate
        && pageInfo.hasNextPage
        && pageInfo.endCursor) {
        const summaries = await retrieveQueryResults(client, query, context, paginate);
        return summaries;
    }

    return [];
}

/**
 * Type guard that identifies an organization and strong types the result
 * @param source a union source
 * @returns true if the source is an organization
 */
function isOrganization(source: Organization | Repository | Team): source is Organization {
    return (source as Organization).login !== undefined;
}

/**
 * Type guard that identifies a repository and strong types the result
 * @param source a union source
 * @returns true if the source is a repository
 */
function isRepository(source: Organization | Repository | Team): source is Repository {
    return (source as Repository).nameWithOwner !== undefined;
}

/**
 * Type guard that identifies a team and strong types the result
 * @param source a union source
 * @returns true if the source is a team
 */
function isTeam(source: Organization | Repository | Team): source is Team {
    return (source as Team).name !== undefined;
}

/**
 * Returns a unique list of items where the combination of properties only exists once.
 * @param instance the array to be processed
 * @returns an array of unique items
 */
function getUniqueInstances<Type extends object>(instance: Array<Type>): Array<Type> {
    const unique = Array.from(new Set(instance.flatMap(item => JSON.stringify(item))));
    return unique.flatMap(item => JSON.parse(item) as Type);
}

/**
 * A summary of a user's permissions for a repository.
 */
export interface UserPermissionSummary {
    readonly repository: string;
    readonly handle: string;
    readonly permission: string;
    readonly organizationPermission: string | null;
    readonly teamPermission: Array<TeamPermission> | null;
    readonly repositoryPermission: string | null;
}

/**
 * A summary of a team and associated permission.
 */
export interface TeamPermission {
    readonly name: string;
    readonly permission: string;
}

/**
 * The GraphQL query variables used to retrieve the user permissions.
 */
interface UserPermissionQueryVariables {

    /** The name of the organization */
    readonly orgname: string;

    /** The cursor to use for pagination of repository data */
    readonly endCursor: string | null;

    /** The cursor to use for pagination of collaborator data */
    readonly innerCursor: string | null;
}

/** The available sort types for query results */
type SortColumn = keyof typeof sortBy;

/** Processes a specified sort direction for query results */
const sortBy = {
    "user": (results: Array<UserPermissionSummary>) => results.sort((left, right) => left.handle.localeCompare(right.handle) || left.repository.localeCompare(right.repository)),
    "repository": (results: Array<UserPermissionSummary>) => results.sort((left, right) => left.repository.localeCompare(right.repository) || left.handle.localeCompare(right.handle))
}

/**
 * Sorts the specified array of results by the specified sort column
 * @param results the array of results to be sorted
 * @param sortColumn the name of the primary sort column
 * @returns the sorted array of results
 */
function sort(results: Array<UserPermissionSummary>, by: SortColumn): Array<UserPermissionSummary> {
    return sortBy[by](results);
}