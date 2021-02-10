import * as SftpClient from 'ssh2-sftp-client'
import { LoggerFactory } from '../logger'

export abstract class SftpHandler {
  private static log = LoggerFactory.create(SftpHandler)

  static async getConnection() {
    const sftp = new SftpClient()

    try {
      await sftp.connect({
        host: process.env.FTP_HOST,
        port: Number(process.env.FTP_PORT),
        username: process.env.FTP_USER,
        password: process.env.FTP_PASSWORD,
      })

      this.log.debug('Sftp connected')
      return sftp
    } catch (err) {
      sftp.end()
      this.log.error('Connection error', err)
      throw err
    }
  }

  static async getLastDeploy(sftp: SftpClient.Client) {
    const stream = await sftp.get(String(process.env.FTP_DEPLOYED_REPO_INFO))

    return new Promise((resolve, reject) => {
      let str = ''
      stream.on('data', chunck => (str += chunck.toString()))
      stream.on('error', err => stream.emit('end', err))
      stream.on('end', err => {
        if (err) {
          this.log.error('Failed to download last deploy info')
          return reject(err)
        }
        return resolve(str.trim())
      })
    })
  }
}
