import type { Flags } from 'lighthouse'
import { setMaxListeners } from 'node:events'
import { join } from 'node:path'
import lighthouse from 'lighthouse'
import minimist from 'minimist'

setMaxListeners(0);

export interface LighthouseExecArgs {
  lighthouseOptions: string
  url: string
  port: number
  artifactPath: string
}

/*
 * This file is intended to be run in its own process and should not rely on any global state.
 * @see https://www.npmjs.com/package/lighthouse#cli-options
 */

(async () => {
  const { lighthouseOptions: lighthouseOptionsEncoded, url, port, artifactPath }
    = minimist<LighthouseExecArgs>(process.argv.slice(2))
  let lhOptions: Flags
  try {
    lhOptions = JSON.parse(lighthouseOptionsEncoded)
  } catch (e: unknown) {
    console.error('Failed to parse lighthouseOptions. Please create an issue with this output.', process.argv.slice(2), e)
    return false
  }
  const lighthouseOptions: Flags = {
    ...lhOptions,
    // always generate html / json reports
    output: ['html', 'json'],
    // we tell lighthouse the port
    port,
  }
  try {
    const runnerResult = await lighthouse(url, lighthouseOptions)
    if (!runnerResult) {
      throw new Error('Lighthouse runner result is null')
    }
    const { report } = runnerResult
    if (!report[0] || !report[1]) {
      throw new Error("It's expected to get 2 reports, but failed")
    }
    const htmlFile = Bun.file(join(artifactPath, 'lighthouse.html'))
    const jsonFile = Bun.file(join(artifactPath, 'lighthouse.json'))

    await Promise.all([
      htmlFile.write(report[0]),
      jsonFile.write(report[1])
    ])

    return true
  } catch (e) {
    console.error(e)
  }
  return false
})()
