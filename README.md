# GraphQL Query using Node.js/TypeScript

This sample contains a TypeScript application which runs on Node.js and issues a query for all users in all repositories in a organization. This illustrates GitHub GraphQL queries and iterating through nested cursors.

## Prerequisites
Running this application requires a GitHub personal access token (PAT) with the following minimum set of permissions:

- repo
- admin:org
- read:user

## Usage
The application can be used to query a list of users from the repositories in an organization. At a minimum, the organization name (`--org` or `-o`) and token (`--token` or `-t`) must be provided. The full set of options:

| Argument     | Alias | Description                                        | Value                 |
| ------------ | ----- | -------------------------------------------------- | ----------------------|
| `--token`    | `-t`  | GH PAT with repo,admin:org,read:user               | string (required)     |
| `--org`      | `-o`  | GitHub organization name                           | string (required)     |
| `--prettify` | `-p`  | True for formatted JSON, false for unformatted     | true / **false**      |
| `--allpages` | `-a`  | True to return all data, false for first page only | **true** / false      |
| `--allusers` | `-u`  | True to return all users, false for only ADMIN     | true / **false**      |
| `--format`   | `-f`  | The format for the results                         | csv, json, table      |
| `--sort`     | `-s`  | The column to use for sorting the results          | repository, users     |

## Docker Image
The application can be built into a Docker image which hosts the application and accepts a command line.
For example, an image can be created with `docker build . -t orgquery`. It can then be executed with the
command `docker run -it orgquery [args]`.

## Permissions
The GraphQL query returns permissions as READ, WRITE, or ADMIN. Permissions at the organization,
repository, and team levels are returned.
A user may have organization-level rights. For example, owners receive ADMIN permissions on all 
repositories, and internal repositories typically give all organization members READ permissions.
Permissions can also be explicitly set at the repository level or granted through one or more teams.
The highest permission level across these three levels is the user's overall permission.