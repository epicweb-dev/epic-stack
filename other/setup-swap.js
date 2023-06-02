#!/usr/bin/env node

import { $ } from 'execa'
import { writeFile } from 'node:fs/promises'

console.log('setting up swapfile...')
await $`fallocate -l 512M /swapfile`
await $`chmod 0600 /swapfile`
await $`mkswap /swapfile`
await writeFile('/proc/sys/vm/swappiness', '10')
await $`swapon /swapfile`
await writeFile('/proc/sys/vm/overcommit_memory', '1')
console.log('swapfile setup complete')
