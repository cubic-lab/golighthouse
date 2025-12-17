import { Cluster } from 'puppeteer-cluster'
import os from 'os'
import type { GolighthouseContext, GolighthousePuppetterCluster } from '../types'

export async function launchPuppeteerCluster(context: GolighthouseContext) {
  const { runtimeSetting: { puppeteerOptions } } = context

  const cluster = await Cluster.launch({
    puppeteerOptions,
    monitor: true,
    workerCreationDelay: 500,
    retryLimit: 3,
    timeout: 5 * 60 * 1000, // wait for up to 5 minutes
    maxConcurrency: Math.max(Math.floor(os.cpus().length / 2), 1),
    skipDuplicateUrls: false,
    retryDelay: 2000,
    // Important, when using Lighthouse we want browser isolation.
    concurrency: Cluster.CONCURRENCY_BROWSER,
  }) as GolighthousePuppetterCluster
  
  return cluster
}