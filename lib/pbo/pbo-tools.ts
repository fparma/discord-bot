import { exec } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import { LoggerFactory } from '../logger'

interface LintError extends Error {
  code: number
}

export abstract class PboTools {
  private static log = LoggerFactory.create(PboTools)

  static extractPbo(filePath: string): Promise<string> {
    const command = `extractpbo -PWS ${filePath}`
    this.log.info('Running command', command)

    return new Promise((resolve, reject) => {
      exec(command, (err, stdout, stderr) => {
        if (err) return reject(err)
        resolve(filePath.slice(0, filePath.lastIndexOf('.pbo')))
      })
    })
  }

  static lintPboFolder(folderPath: string) {
    this.log.debug(folderPath)
    return new Promise((resolve, reject) => {
      fs.access(path.join(folderPath, 'mission.sqm'), fs.constants.R_OK, err => {
        if (err) {
          if (err.code === 'ENOENT') {
            return reject('Failure, pbo seems to be missing a mission.sqm')
          }
          this.log.error(err)
          return reject('Failed to access mission sqm')
        }

        const command = `makepbo -WP ${folderPath} bla.pbo`
        exec(command, (err, stdout, stderr) => {
          if (!err) return resolve()

          const lintMessages = PboTools.getLintErrors(err as LintError, stdout, folderPath)
          if (lintMessages) return reject(lintMessages)

          const msg = [folderPath, stdout, stderr].join(' - ')
          return reject(new Error(`Makepbo fail ${(err as LintError).code} ${msg}`))
        })
      })
    })
  }

  private static getLintErrors(err: LintError, stdout: string, folderPath: string) {
    const { code = -1 } = err
    // previously the exit was 87 for lint errors, now it's 17?
    if (![17, 87].includes(code)) return null

    const errors = stdout
      .split(/\r?\n/)
      .filter(str => str.includes(folderPath))
      .map(str => str.replace(folderPath, '').trim())
      .join('\n')
    return errors
  }
}
