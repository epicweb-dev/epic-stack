export const originAgentCluster = (): Headers => {
	const headers = new Headers()
	headers.set('Origin-Agent-Cluster', '?1')
	return headers
}
