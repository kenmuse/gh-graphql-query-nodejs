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
    description: 'GH Token with permissions: repo,admin:org,read:user'
  })
  .option('org', {
    alias: 'o',
    type: 'string',
    description: 'Organization name'
  })
  .option('prettify', {
    alias: 'p',
    type: 'boolean',
    description: 'Set to prettify the output'
  })
  .help()
  .parseAsync();

const token = argv.token;
const organization = argv.org;
const prettySpaces = argv.prettify ? 2 : 0;

const query = `
query ($orgname:String!, $endCursor: String){
    organization(login: $orgname){
        repositories(first: 100, after: $endCursor) {
            nodes {
                nameWithOwner
                description
                url
                collaborators(first: 100, after: $endCursor) {
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
}`

const client = graphql.defaults({
    headers: {
      authorization: `token ${token}`,
    },
  });

const variables = {
    orgname: organization,
    endCursor: null
}

try {
    const result  = await client(query, variables) as any;
    console.log(JSON.stringify(result, null, prettySpaces));
    console.log(`Next page: ${result.organization.repositories.hasNextPage ? result.organization.repositories.endCursor : 'None' }`);
}
catch(error) {
    if (error instanceof GraphqlResponseError){
        console.error(error.message);
    }
}