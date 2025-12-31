import bcrypt from 'bcryptjs'

export function hashPassword(raw: string) {
  return bcrypt.hash(raw, 10)
}

export function verifyPassword(raw: string, hashed: string) {
  return bcrypt.compare(raw, hashed)
}