import chokidar from 'chokidar'
import fs from 'fs/promises'
import path from 'path'

import {debug as serverDebug} from './debug'
import {getEntryModule} from './getEntryModule'
import {
  decorateIndexWithAutoGeneratedWarning,
  getPossibleDocumentComponentLocations,
  renderDocument,
} from './renderDocument'
import {getSanityStudioConfigPath} from './sanityConfig'
import {loadSanityMonorepo} from './sanityMonorepo'

const debug = serverDebug.extend('runtime')

export interface RuntimeOptions {
  cwd: string
  reactStrictMode: boolean
  watch: boolean
  basePath?: string
}

/**
 * Generates the `.sanity/runtime` directory, and optionally watches for custom
 * document files, rebuilding when they change
 *
 * @param options - Current working directory (Sanity root dir), and whether or not to watch
 * @internal
 */
export async function writeSanityRuntime({
  cwd,
  reactStrictMode,
  watch,
  basePath,
}: RuntimeOptions): Promise<void> {
  debug('Resolving Sanity monorepo information')
  const monorepo = await loadSanityMonorepo(cwd)
  const runtimeDir = path.join(cwd, '.sanity', 'runtime')

  debug('Making runtime directory')
  await fs.mkdir(runtimeDir, {recursive: true})

  async function renderAndWriteDocument() {
    debug('Rendering document template')
    const indexHtml = decorateIndexWithAutoGeneratedWarning(
      await renderDocument({
        studioRootPath: cwd,
        monorepo,
        props: {
          entryPath: `/${path.relative(cwd, path.join(runtimeDir, 'app.js'))}`,
          basePath: basePath || '/',
        },
      }),
    )

    debug('Writing index.html to runtime directory')
    await fs.writeFile(path.join(runtimeDir, 'index.html'), indexHtml)
  }

  if (watch) {
    chokidar
      .watch(getPossibleDocumentComponentLocations(cwd))
      .on('all', () => renderAndWriteDocument())
  }

  await renderAndWriteDocument()

  debug('Writing app.js to runtime directory')
  const studioConfigPath = await getSanityStudioConfigPath(cwd)
  const relativeConfigLocation = studioConfigPath
    ? path.relative(runtimeDir, studioConfigPath)
    : null

  await fs.writeFile(
    path.join(runtimeDir, 'app.js'),
    getEntryModule({reactStrictMode, relativeConfigLocation, basePath}),
  )
}
