#!/usr/bin/env node
const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const WORKSPACE_SOURCE_BASE = path.join(ROOT, 'core-api', 'node_modules')
const ROOT_SOURCE_BASE = path.join(ROOT, 'node_modules')
const SOURCE_BASE = fs.existsSync(path.join(WORKSPACE_SOURCE_BASE, '@prisma', 'client'))
  ? WORKSPACE_SOURCE_BASE
  : ROOT_SOURCE_BASE
const SOURCE_CLIENT = path.join(SOURCE_BASE, '@prisma', 'client')
const SOURCE_GENERATED = path.join(SOURCE_BASE, '.prisma', 'client')

const DESTINATIONS = [
  { label: 'repo root', path: path.join(ROOT, 'node_modules') },
  { label: 'scanner-service workspace', path: path.join(ROOT, 'scanner-service', 'node_modules') },
]

async function main() {
  await ensureSourceExists(SOURCE_CLIENT, 'Run `npm install` and `npm run prisma:generate -w core-api` first.')
  await ensureSourceExists(SOURCE_GENERATED, 'Prisma client artifacts not found. Did generate finish correctly?')

  for (const destination of DESTINATIONS) {
    const exists = fs.existsSync(destination.path)
    if (!exists) {
      console.warn(`[prisma-sync] Skipping ${destination.label} (node_modules missing)`)
      continue
    }

    const clientTarget = path.join(destination.path, '@prisma', 'client')
    const generatedTarget = path.join(destination.path, '.prisma', 'client')

    if (path.resolve(destination.path) === path.resolve(SOURCE_BASE)) {
      console.warn(`[prisma-sync] Skipping ${destination.label} (source == destination)`)
      continue
    }

    await copyDirectory(SOURCE_CLIENT, clientTarget, destination.label, '@prisma/client')
    await copyDirectory(SOURCE_GENERATED, generatedTarget, destination.label, '.prisma/client')
  }
}

async function ensureSourceExists(sourcePath, errorMessage) {
  const exists = fs.existsSync(sourcePath)
  if (!exists) {
    throw new Error(`[prisma-sync] ${errorMessage} (missing ${sourcePath})`)
  }
}

async function copyDirectory(source, target, destinationLabel, artifactLabel) {
  await fsp.rm(target, { recursive: true, force: true })
  await fsp.mkdir(path.dirname(target), { recursive: true })
  await fsp.cp(source, target, { recursive: true })
  console.log(`[prisma-sync] Copied ${artifactLabel} to ${destinationLabel}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
