import type { BoxOpts } from 'consola/utils'
import { colorize, box as makeBox } from 'consola/utils'
import wrapAnsi from 'wrap-ansi'
import { spinner } from '@clack/prompts'

/**
 * Copied from https://github.com/nuxt/nuxt.js/blob/dev/packages/cli/src/utils/formatting.js
 */
export const maxCharsPerLine = () => (process.stdout.columns || 100) * 80 / 100

export function indent(count: number, chr = ' ') {
  return chr.repeat(count)
}

export function indentLines(string: string, spaces: number, firstLineSpaces: number) {
  const lines = Array.isArray(string) ? string : string.split('\n')
  let s = ''
  if (lines.length) {
    const i0 = indent(firstLineSpaces === undefined ? spaces : firstLineSpaces)
    s = i0 + lines.shift()
  }
  if (lines.length) {
    const i = indent(spaces)
    s += `\n${lines.map(l => i + l).join('\n')}`
  }
  return s
}

export function foldLines(string: string, spaces: number, firstLineSpaces: number, charsPerLine = maxCharsPerLine()) {
  return indentLines(wrapAnsi(string, charsPerLine), spaces, firstLineSpaces)
}

export function box(message: string, title: string, options?: BoxOpts) {
  return `${makeBox([
    title,
    '',
    colorize('white', foldLines(message, 0, 0, maxCharsPerLine())),
  ].join('\n'), Object.assign({
    borderColor: 'white',
    borderStyle: 'round',
    padding: 1,
    margin: 1,
  }, options))}\n`
}

export function successBox(message: string, title: string) {
  return box(message, title, {
    style: {
      borderColor: 'green',
    },
  })
}

export interface ProgressData {
  currentJob: string
  completedJobs: number
  totalJobs: number
  averageScore?: number
  timeElapsed: number
  timeRemaining?: number
}

export interface ProgressBox {
  update: (progressData: ProgressData) => void
  clear: () => void
}

/**
 * Create a progress box that displays scanning progress using Clack spinner
 */
export function createProgressBox(): ProgressBox {
  let clackSpinner: ReturnType<typeof spinner> | undefined

  const update = (progressData: ProgressData) => {
    // Initialize Clack spinner if not started
    if (!clackSpinner && progressData.totalJobs > 0) {
      clackSpinner = spinner()
      clackSpinner.start('Starting scan...')
    }

    // Update progress
    if (clackSpinner && progressData.totalJobs > 0) {
      const percentage = Math.round((progressData.completedJobs / progressData.totalJobs) * 100)

      // Format additional info
      const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000)
        const seconds = Math.floor((ms % 60000) / 1000)
        if (minutes > 60) {
          const hours = Math.floor(minutes / 60)
          const remainingMins = minutes % 60
          return `${hours}h ${remainingMins}m`
        }
        return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
      }

      const formatScore = (score?: number) => {
        if (score === undefined)
          return 'calculating...'
        const rounded = Math.round(score * 100)
        return `${rounded}/100`
      }

      // Build progress message
      let message = `${percentage}% (${progressData.completedJobs}/${progressData.totalJobs})`

      if (progressData.averageScore !== undefined) {
        message += ` • Score: ${formatScore(progressData.averageScore)}`
      }

      message += ` • ${formatTime(progressData.timeElapsed)}`

      if (progressData.timeRemaining && progressData.timeRemaining > 0) {
        message += ` • ETA: ${formatTime(progressData.timeRemaining)}`
      }
      if (progressData.currentJob) {
        const job = progressData.currentJob.length > 60
          ? `${progressData.currentJob.substring(0, 57)}...`
          : progressData.currentJob
        message += ` • ${job}`
      }
      // Update the spinner message
      clackSpinner.message(message)
    }
  }

  const clear = () => {
    if (clackSpinner) {
      clackSpinner.stop('Scan completed!')
      clackSpinner = undefined
    }
  }

  return { update, clear }
}