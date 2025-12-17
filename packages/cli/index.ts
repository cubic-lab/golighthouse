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
  samples: number
  throttle: boolean
  headless: boolean
  device: 'mobile' | 'desktop'
  categories: string[]
  config?: string
  debug: boolean
  output: string
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
    debug,
    proxy,
    sites: site ? [
      {
        baseUrl: site,
        domainRotation,
        urls
      }
    ] : [],
    sampler: {
      size: samples,
      throttle,
      categories,
      device,
      headless
    },
    output,
  }
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
  .option('--samples [samples]', 'The of number samples', value => parseInt(value), 1)
  .option('--throttle [throttle]', 'Enable throttling or not', value => value === 'true', true)
  .option('--headless [headless]', 'The browser launch mode', value => value === 'true', true)
  .option('--device [device]', 'The device option accepts mobile and pc', 'mobile')
  .option('--categories [categories...]', 'Categories to run', ['accessibility', 'best-practices', 'performance', 'seo'])
  .option('--debug [debug]', 'Enable debug log or not', value => value === 'true', false)
  .option('--output [output]', 'Set artifacts output path, default is current directory', 'artifacts')
  .option('--config [config]', 'The config file path')
  .action(async (siteArg: string, { site, ...restOpts}: RunOptions) => {
    const start = new Date()
    const config = await resolveUserConfig({
      site: siteArg || site,
      ...restOpts
    })

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