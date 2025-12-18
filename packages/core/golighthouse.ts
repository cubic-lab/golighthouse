import path from 'path'
import { createHooks } from 'hookable'
import { Launcher } from 'chrome-launcher'
import { colorize } from 'consola/utils'
import { defu } from 'defu'
import { createLogger, useLogger } from './logging'
import { GolighthouseScheduler } from './sched/scheduler'
import type { 
  GolighthouseContext,
  GolighthouseHooks,
  GolighthouseUserConfig,
  GolighthouseRuntimeSetting,
  ModeProvider,
} from './types'
import { AppName, DefaultUserConfig, ScreenEmulations, Throttling } from './constants'
import { successBox } from './toolkits/terms'
import { newRoute, type Route } from './route'
import { fileURLToPath } from 'url'
import {  createServer } from './server'

const clientEntryPath = '@golighthouse/client/dist/index.html'

export class Golighthouse {
  #context: GolighthouseContext
  #scheduler: GolighthouseScheduler

  constructor(provider: ModeProvider, config: GolighthouseUserConfig) {
    createLogger(config.debug || false)
    this.validateUserConfig(config)
    config = defu(config, DefaultUserConfig)
    this.#scheduler = new GolighthouseScheduler(this)
    this.#context = {
      provider,
      hooks: createHooks<GolighthouseHooks>(),
      userConfig: config,
      runtimeSetting: this.resolveRuntimeSetting(config),
    }
  }

  get context() {
    return this.#context
  }

  get hooks() {
    return this.#context.hooks
  }

  private validateUserConfig(config: GolighthouseUserConfig) {
    if (config.sites.length <= 0) {
      throw new Error('Failed to valid user config as there is no sites provided.')
    }
  }

  async closeWorker() {
    this.#scheduler.close()
  }

  clearProgress() {
    this.#scheduler.clearProgress()
  }

  private resolveRuntimeSetting(config: GolighthouseUserConfig): GolighthouseRuntimeSetting {
    const { sampler: { categories, headless, device, throttle }, output } = config
    const cwd: string = process.cwd()
    const log = useLogger()

    const resolveArtifactsDir = () => {
      let artifactsDir: string
      if (output) {
        artifactsDir = path.isAbsolute(output) ? output : path.resolve(cwd, output)
      } else {
        artifactsDir = cwd
      }

      return artifactsDir
    }
    const resolveExecutablePath = () => {
      try {
        const chromePath = Launcher.getFirstInstallation()
        log.info(`Using system Chrome located at: \`${chromePath}\`.`)
        return chromePath
      } catch (err) {
        throw new Error('Failed to find system Chrome')
      }
    }

    const screenEmulation = ScreenEmulations[device]
    const throttling = Throttling[throttle ? 'true' : 'false']
    const executablePath = resolveExecutablePath()
    const __dirname = fileURLToPath(new URL('.', import.meta.url))
    
    return {
      lighthouseProcessPath: path.resolve(__dirname, 'process/lighthouse.ts'),
      lighthouseOptions: {
        throttlingMethod: throttle ? 'provided' : 'simulate',
        throttling,
        formFactor: device,
        onlyCategories: categories,
        screenEmulation,
      },
      puppeteerOptions: {
        executablePath,
        headless,
        defaultViewport: screenEmulation,
        // try avoid timeouts
        timeout: 0,
        protocolTimeout: 0,
      },
      clientDir: path.resolve(require.resolve(clientEntryPath), '..'),
      artifactsDir: resolveArtifactsDir(),
    }
  }

  async start() {
    const server = createServer(this.context)

    const routes = this.resolveRoutes()
    this.displayBanner(server.url, routes)

    await this.#scheduler.start(routes)
  }

  private resolveRoutes(): Route[] {
    const { userConfig: { sites } } = this.context
    const routes: Route[] = []

    sites.forEach(site => {
      const siteUrl = site.baseUrl
      const siteDomainRotation = site.domainRotation || false

      routes.push(newRoute(siteUrl, siteDomainRotation, site.baseUrl))
      site.urls?.forEach(url => {
        routes.push(newRoute(site.baseUrl, siteDomainRotation, url))
      })
    })

    return routes
  }

  private displayBanner(serverUrl: URL, routes: Route[]) {
    const label = (name: string) => colorize('bold', colorize('magenta', (`▸ ${name}:`)))
    const { provider, userConfig: { sampler }, runtimeSetting: { artifactsDir } } = this.context
    const title = [
      `🚀 ${colorize('bold', colorize('blueBright', AppName))} ${colorize('dim', `${provider.name} @ v${provider.version}`)} \n`
    ]
    title.push(...[
      `${label('Scanning Routes')} ${routes.length}`,
      `${label('Emulation Device')} ${sampler.device}`,
      `${label('Samples')} ${sampler.size}`,
      `${label('Throttle')} ${sampler.throttle}`,
      `${label('Artifacts Directory')} ${artifactsDir}`,
    ])
    process.stdout.write(successBox(
      colorize('whiteBright', `Server Url: ${serverUrl}`),
      title.join('\n')
    ))
  }
}