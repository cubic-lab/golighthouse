import { program } from 'commander'
import { YAML } from 'bun'
import meta from './package.json'
import { Golighthouse } from '@golighthouse/core'
import type { GolighthouseUserConfig } from '@golighthouse/core/types'
import { useLogger } from '@golighthouse/core/logging'

interface RunOptions {
  site: string
  domainRotation?: boolean
  urls?: string[]
  proxy?: string
  samples?: number
  throttle?: boolean
  headless?: boolean
  device?: 'mobile' | 'desktop'
  categories?: string[]
  config?: string
  debug?: boolean
  output?: string
}

async function resolveUserConfig(options: RunOptions): Promise<GolighthouseUserConfig> {
  const { config } = options

  if (config) {
    const file = Bun.file(config)
    const configText = await file.text()

    return YAML.parse(configText) as GolighthouseUserConfig
  }
  const { 
    proxy, site, domainRotation, urls, 
    samples, throttle, headless, device, 
    categories, debug, output,
  } = options

  return {
    debug: debug || false,
    proxy,
    sites: site ? [
      {
        baseUrl: site,
        domainRotation,
        urls
      }
    ] : [],
    sampler: {
      size: samples || 1,
      throttle: throttle || true,
      categories: categories || ['accessibility', 'best-practices', 'performance', 'seo'],
      device: device || 'mobile',
      headless: headless || true
    },
    output: output || process.cwd(),
  }
}

function validateUserConfig(config: GolighthouseUserConfig) {
  if (config.sites.length <= 0) {
    console.error('Cli exited as there is no sites provided. Use -h for help')

    return false
  }

  return true
}

program
  .name('golighthouse')
  .description(meta.description)
  .version(meta.version)

program
  .argument('[site]', 'The site to run lighthouse')
  .option('-s, --site <site>', 'The site to run lighthouse')
  .option('--urls [urls...]', 'The urls of this site')
  .option('--proxy [proxy]', 'The proxy server url')
  .option('--samples [samples]', 'The of number samples', _ => 1)
  .option('--throttle [throttle]', 'Enable throttling or not')
  .option('--headless [headless]', 'The browser launch mode', value => value === 'true')
  .option('--device [device]', 'The device option accepts mobile and pc', _ => 'mobile')
  .option('--categories [categories...]', 'Categories to run')
  .option('--debug [debug]', 'Enable debug log or not')
  .option('--output [output]', 'Set artifacts output path, default is current directory')
  .option('--config [config]', 'The config file path')
  .action(async (siteArg: string, { site, ...restOpts}: RunOptions) => {
    const start = new Date()
    const config = await resolveUserConfig({
      site: siteArg || site,
      ...restOpts
    })
    if (!validateUserConfig(config)) return

    const golighthouse = new Golighthouse({
      name: 'cli',
      version: meta.version,
    }, config)
    const log = useLogger()

    golighthouse.hooks.hook('worker-finished', async () => {
      const end = new Date()
      const seconds = Math.round((end.getTime() - start.getTime()) / 1000)
      golighthouse.clearProgress()
      log.success(`Golighthouse has finished scanning routes in ${seconds}s.`)
      await golighthouse.closeWorker()
    })

    await golighthouse.start()
  })

program.parse()