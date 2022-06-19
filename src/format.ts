import * as CSV from 'csv-string';

/**
 * Writes the formatted data to the console in the specified format
 * @param data the array of results to be formatted
 * @param format the output format
 * @param spaces the number of spaces to use for indentation (JSON only)
 */
export function writeToConsole<Type>(data: Array<Type>, format: "json" | "csv" | "table", spaces: number) : void {
    switch (format) {
        case 'json':
            console.log(JSON.stringify(data, null, spaces));
            break;
        case 'csv':
            console.log(CSV.stringify(data.map(item => Object.values(item))));
            break;
        default:
            console.table(data);
    }
}