import type yargs from 'yargs'
import type { ValaxyNode } from '..'

export interface ValaxyModule {
  extendCli?: (cli: yargs.Argv) => void
  setup?: (node: ValaxyNode) => void
}

export function defineValaxyModule(
  module: ValaxyModule,
) {
  return module
}

export function setupModules(
  node: ValaxyNode,
  modules: ValaxyModule[],
) {
  modules.forEach((module) => {
    module.setup?.(node)
  })
}
