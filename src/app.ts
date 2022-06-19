'use strict';
import * as args from './args.js';
import * as format from './format.js';
import * as query from './query.js';

// Parse the command line arguments
const options = await args.parseAsync(process.argv);

// Execute the query
const results = await query.execute(options.token, options.organization, options.paginate, options.sortBy)

// Format the results
format.writeToConsole(results, options.format, options.spaces);
