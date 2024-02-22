// litefs-js should be used server-side only. It imports `fs` which results in Remix
// including a big polyfill. So we put the import in a `.server.ts` file to avoid that
// polyfill from being included. https://github.com/epicweb-dev/epic-stack/pull/331
export {
	getInstanceInfo,
	getAllInstances,
	getInternalInstanceDomain,
	getInstanceInfoSync,
} from 'litefs-js'
export { ensurePrimary, ensureInstance } from 'litefs-js/remix.js'
