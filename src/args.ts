// This module is responsible for parsing the command line arguments
// to create a strong-typed configuration that can be used to execute
// a query.

import _yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

/**
 * Parses the command line arguments to retrieve the parameter values.
 * @param {string[]} args The command line arguments.
 * @returns the command line argument values.
 */
export async function parseAsync(args:string[]) : Promise<CommandLineArguments> {
    const argv = await _yargs(hideBin(args))
        .usage("Usage: $0 -t token -o organization")
        .showHelpOnFail(true)
        .demandOption(['token', 'org'])
        .option('token', {
            alias: 't',
            type: 'string',
            requiresArg: true,
            description: 'GH PAT with repo,admin:org,read:user'
        })
        .option('org', {
            alias: 'o',
            type: 'string',
            requiresArg: true,
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
        .option('all', {
            alias: 'u',
            type: 'boolean',
            description: 'Show all users instead of just ADMIN',
            default: false
        })
        .option('format',{
            alias: 'f',
            type: 'string',
            choices: ['json', 'csv', 'table'],
            default: 'json'
        })
        .option('sort',{
            alias: 's',
            type: 'string',
            choices: ['repository', 'user'],
            default: 'repository'
        })
        .help()
        .parseAsync();
    
    let result : CommandLineArguments = {
        token: argv.token ?? "",
        organization: argv.org ?? "",
        spaces: argv.prettify ? 2 : 0,
        paginate: argv.paginate,
        sortBy: argv.sort as "user" | "repository",
        format: argv.format as "json" | "csv" | "table",
        showAllUsers: argv.all
    }

    return result;
}

/** 
* The command line arguments. 
*/
export interface CommandLineArguments {
    /** The GitHub PAT token. */
    readonly token: string;

    /** The GitHub organization name. */
    readonly organization: string;
    
    /** The number of spaces to use for indentation. */
    readonly spaces: number;

    /** 
     *  Indicates whether to automatically retrieve additional
     *  pages of results from queries. 
     */
    readonly paginate: boolean;

    /** The column to use for sorting the results. */
    readonly sortBy: "user" | "repository";

    /** The format to use for results  */
    readonly format: "json" | "csv" | "table";

    /** Indicates whether to show all users or only ADMIN users */
    readonly showAllUsers: boolean;
}
