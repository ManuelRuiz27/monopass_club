const HEX_DIGITS = '0123456789abcdef'
const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$'

type AutoCredentialParams<T> = {
  displayName: string
  takenUsernames: Set<string>
  createUser: (payload: { username: string; password: string }) => Promise<T>
}

type WelcomeMessageParams = {
  profileName: string
  username: string
  password: string
  loginUrl: string
  role: 'rp' | 'scanner'
}

export function normalizeDisplayName(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 22)
}

export function generatePassword(length = 12) {
  const chars = PASSWORD_CHARS
  const randomInt = (max: number) => {
    if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function') {
      const bytes = new Uint32Array(1)
      globalThis.crypto.getRandomValues(bytes)
      return bytes[0] % max
    }
    return Math.floor(Math.random() * max)
  }

  let output = ''
  for (let index = 0; index < length; index += 1) {
    output += chars[randomInt(chars.length)]
  }
  return output
}

function findStartingHexIndex(base: string, taken: Set<string>) {
  let highest = -1
  const regex = new RegExp(`^${base}_([0-9a-f])$`)
  taken.forEach((username) => {
    const match = username.match(regex)
    if (!match) return
    const idx = HEX_DIGITS.indexOf(match[1])
    if (idx > highest) {
      highest = idx
    }
  })
  return highest >= 0 ? (highest + 1) % HEX_DIGITS.length : 0
}

function isDuplicateUsernameError(error: unknown) {
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  return message.includes('existe') || message.includes('conflict') || message.includes('already')
}

export async function createUserWithAutoCredentials<T>({
  displayName,
  takenUsernames,
  createUser,
}: AutoCredentialParams<T>) {
  const normalized = normalizeDisplayName(displayName) || 'usuario'
  const localTaken = new Set(Array.from(takenUsernames).map((item) => item.toLowerCase()))
  const startIndex = findStartingHexIndex(normalized, localTaken)

  for (let offset = 0; offset < HEX_DIGITS.length; offset += 1) {
    const hex = HEX_DIGITS[(startIndex + offset) % HEX_DIGITS.length]
    const username = `${normalized}_${hex}`
    if (localTaken.has(username)) continue

    const password = generatePassword()
    try {
      const created = await createUser({ username, password })
      return { created, username, password }
    } catch (error) {
      if (!isDuplicateUsernameError(error)) {
        throw error
      }
      localTaken.add(username)
    }
  }

  throw new Error('No hay usernames disponibles para este nombre. Usa una variacion distinta del nombre.')
}

export function buildWelcomeMessage({ profileName, username, password, loginUrl, role }: WelcomeMessageParams) {
  const roleLabel = role === 'rp' ? 'embajador' : 'staff scanner'
  return `Bienvenido ${roleLabel} ${profileName}, tu usuario para entrar a Pass Monkey es: ${username} y tu contrasena es: ${password}. Puedes logearte en ${loginUrl}`
}

export function buildWhatsappShareUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}
