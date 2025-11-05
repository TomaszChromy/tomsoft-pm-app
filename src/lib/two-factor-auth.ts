import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import crypto from 'crypto'
import { prisma } from './prisma'

export interface TwoFactorSetupResult {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

export interface TwoFactorVerificationResult {
  isValid: boolean
  isBackupCode?: boolean
}

export class TwoFactorAuthService {
  private static readonly APP_NAME = 'TomSoft PM'
  private static readonly BACKUP_CODES_COUNT = 10

  /**
   * Generate a new 2FA secret and QR code for user setup
   */
  static async generateSetup(userId: string, userEmail: string): Promise<TwoFactorSetupResult> {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${this.APP_NAME} (${userEmail})`,
      issuer: this.APP_NAME,
      length: 32,
    })

    // Generate QR code URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

    // Generate backup codes
    const backupCodes = this.generateBackupCodes()

    return {
      secret: secret.base32!,
      qrCodeUrl,
      backupCodes,
    }
  }

  /**
   * Enable 2FA for a user
   */
  static async enable2FA(userId: string, secret: string, token: string, backupCodes: string[]): Promise<boolean> {
    // Verify the token first
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps tolerance
    })

    if (!isValid) {
      return false
    }

    // Encrypt backup codes
    const encryptedBackupCodes = this.encryptBackupCodes(backupCodes)

    // Save to database
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        backupCodes: encryptedBackupCodes,
      },
    })

    return true
  }

  /**
   * Disable 2FA for a user
   */
  static async disable2FA(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null,
      },
    })
  }

  /**
   * Verify a 2FA token or backup code
   */
  static async verifyToken(userId: string, token: string): Promise<TwoFactorVerificationResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true,
        backupCodes: true,
      },
    })

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return { isValid: false }
    }

    // First try to verify as TOTP token
    const isValidTotp = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    })

    if (isValidTotp) {
      return { isValid: true }
    }

    // If TOTP fails, try backup codes
    if (user.backupCodes) {
      const backupCodes = this.decryptBackupCodes(user.backupCodes)
      const isValidBackupCode = backupCodes.includes(token)

      if (isValidBackupCode) {
        // Remove used backup code
        const remainingCodes = backupCodes.filter(code => code !== token)
        const encryptedRemainingCodes = this.encryptBackupCodes(remainingCodes)

        await prisma.user.update({
          where: { id: userId },
          data: {
            backupCodes: encryptedRemainingCodes,
          },
        })

        return { isValid: true, isBackupCode: true }
      }
    }

    return { isValid: false }
  }

  /**
   * Generate new backup codes for a user
   */
  static async regenerateBackupCodes(userId: string): Promise<string[]> {
    const newBackupCodes = this.generateBackupCodes()
    const encryptedBackupCodes = this.encryptBackupCodes(newBackupCodes)

    await prisma.user.update({
      where: { id: userId },
      data: {
        backupCodes: encryptedBackupCodes,
      },
    })

    return newBackupCodes
  }

  /**
   * Check if user has 2FA enabled
   */
  static async is2FAEnabled(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    })

    return user?.twoFactorEnabled || false
  }

  /**
   * Get remaining backup codes count
   */
  static async getBackupCodesCount(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { backupCodes: true },
    })

    if (!user?.backupCodes) {
      return 0
    }

    const backupCodes = this.decryptBackupCodes(user.backupCodes)
    return backupCodes.length
  }

  /**
   * Generate backup codes
   */
  private static generateBackupCodes(): string[] {
    const codes: string[] = []
    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase()
      codes.push(code)
    }
    return codes
  }

  /**
   * Encrypt backup codes for storage
   */
  private static encryptBackupCodes(codes: string[]): string {
    const secret = process.env.BACKUP_CODES_SECRET || 'fallback-secret'
    const cipher = crypto.createCipher('aes-256-cbc', secret)
    let encrypted = cipher.update(JSON.stringify(codes), 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
  }

  /**
   * Decrypt backup codes from storage
   */
  private static decryptBackupCodes(encryptedCodes: string): string[] {
    try {
      const secret = process.env.BACKUP_CODES_SECRET || 'fallback-secret'
      const decipher = crypto.createDecipher('aes-256-cbc', secret)
      let decrypted = decipher.update(encryptedCodes, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      return JSON.parse(decrypted)
    } catch (error) {
      console.error('Failed to decrypt backup codes:', error)
      return []
    }
  }
}
