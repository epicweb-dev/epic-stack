// litefs-js should be used server-side only. It imports `fs` which results in Remix
// including a big polyfill. So we put the import in a `.server.ts` file to avoid that
// polyfill from being included. https://github.com/epicweb-dev/epic-stack/pull/331
export * from 'litefs-js'
export * from 'litefs-js/remix.js'
