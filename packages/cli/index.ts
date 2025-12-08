import { program } from 'commander'
import { Golighthouse } from '@golighthouse/core'
import meta from './package.json'

async function run() {
  const golighthouse = new Golighthouse()
  golighthouse.start()
}

program
  .name('golighthouse')
  .description(meta.description)
  .version(meta.version)

program.action(run)

program.parse()