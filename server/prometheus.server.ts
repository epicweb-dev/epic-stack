import * as client from 'prom-client';

// Recreate the singleton function here, we don't want to import it from
// the utils because this is used by server index.ts which can only import the JS
// compiled directly from this file, and I don't want to move it to the server folder
function singleton<Value>(name: string, value: () => Value): Value {
    const g = global as any;
    g.__singletons ??= {};
    g.__singletons[name] ??= value();
    return g.__singletons[name];
}

export const prometheus = singleton('prometheus-client', () => {
    // NOTE: if you change anything in this function you'll need to restart
    // the dev server to see your changes.

    const requestCounter = new client.Counter({
        name: 'http_request_count',
        help: 'Number of HTTP requests',
        labelNames: ['method', 'path', 'status'] as const,
    });

    const requestDuration = new client.Histogram({
        name: 'http_request_duration_histogram',
        help: 'Duration of HTTP requests',
        labelNames: ['method', 'path', 'status'] as const,
        buckets: [1, 10, 100, 1000, 5000, 10000, 30000],
    });

    const requestDurationSummary = new client.Summary({
        name: 'http_request_duration_summary',
        help: 'Duration of HTTP requests',
        labelNames: ['method', 'path', 'status'] as const,
    });

    const sqlQueryCounter = new client.Counter({
        name: 'sql_query_count',
        help: 'Number of SQL queries executed',
        labelNames: ['query'] as const,
    });

    const sqlQueryDuration = new client.Histogram({
        name: 'sql_query_duration_histogram',
        help: 'Duration of SQL queries executed',
        labelNames: ['query'] as const,
        buckets: [1, 10, 100, 1000, 5000, 10000, 30000],
    });

    const sqlQueryDurationSummary = new client.Summary({
        name: 'sql_query_duration_summary',
        help: 'Duration of SQL queries executed',
        labelNames: ['query'] as const,
    });

    return {
        client,
        requestCounter,
        requestDuration,
        requestDurationSummary,
        sqlQueryCounter,
        sqlQueryDuration,
        sqlQueryDurationSummary,
    };
});