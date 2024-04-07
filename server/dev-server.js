import { spawn } from 'node:child_process'

if (process.env.NODE_ENV === 'production') {
  await import('./index.js')
} else {
  const command =
    'tsx watch --clear-screen=false --ignore ".cache/**" --ignore "app/**" --ignore "vite.config.ts.timestamp-*" --ignore "build/**" --ignore "node_modules/**" --inspect ./index.js'
  const [bin, ...args] = command.split(' ')
  const childProcess = spawn(bin, args, {
    shell: true,
    // do not use stdio: 'inherit'. see issue https://github.com/epicweb-dev/epic-stack/issues/688
    env: {
      FORCE_COLOR: true,
      MOCKS: true,
      ...process.env,
    },
  })
  childProcess.stdout.pipe(process.stdout)
  childProcess.stderr.pipe(process.stderr)
}
