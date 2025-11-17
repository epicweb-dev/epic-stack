// This file will be introduced soon in prisma upgrade PR
// see https://github.com/epicweb-dev/epic-stack/pull/1059

import 'varlock/auto-load' // this loads DATABASE_URL
import { defineConfig } from 'prisma/config'

export default defineConfig({
	earlyAccess: true, // TS type in this prisma version requires this?
})