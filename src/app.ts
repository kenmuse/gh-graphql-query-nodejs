'use strict';
import { graphql, GraphqlResponseError } from '@octokit/graphql';
import _yargs from 'yargs/yargs';
import {hideBin} from 'yargs/helpers';

const argv = await _yargs(hideBin(process.argv))
  .usage("Usage: $0 -t token -o organization")
  .showHelpOnFail(true)
  .demandOption(['token', 'org'], 'Both token and org are required')
  .option('token', {
    alias: 't',
    type: 'string',
    description: 'GH PAT with repo,admin:org,read:user'
  })
  .option('org', {
    alias: 'o',
    type: 'string',
    description: 'Organization name'
  })
  .option('prettify', {
    alias: 'p',
    type: 'boolean',
    description: 'Set to prettify the output',
    default: false
  })
  .option('paginate', {
    alias: 'a',
    type: 'boolean',
    description: 'Automatically follow pages',
    default: true
  })
  .help()
  .parseAsync();

const token = argv.token;
const organization = argv.org;
const prettySpaces = argv.prettify ? 2 : 0;
const paginate = argv.paginate;

const query = `
query ($orgname:String!, $endCursor: String){
    organization(login: $orgname){
        repositories(first: 100, after: $endCursor) {
            nodes {
                nameWithOwner
                description
                url
                collaborators(first: 100, after: null) {
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

const client = graphql.defaults({
    headers: {
      authorization: `token ${token}`,
    },
  });

var endCursor = null;
do
{
    const variables = {
        orgname: organization,
        endCursor: endCursor
    }

    try {
        const result  = await client(query, variables) as any;
        console.log(JSON.stringify(result, null, prettySpaces));
        endCursor = result.organization.repositories.pageInfo.hasNextPage ? result.organization.repositories.pageInfo.endCursor : null;
        // console.log(`>> Next page: ${ endCursor ?? 'None' }`);
    }
    catch(error) {
        if (error instanceof GraphqlResponseError){
            console.error(error.message);
        }
        else {
            console.error(JSON.stringify(error, null, prettySpaces));
        }
    }
} while(endCursor != null && paginate)