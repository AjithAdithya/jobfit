declare module 'latex.js' {
  export class HtmlGenerator {
    constructor(options?: { hyphenate?: boolean })
    domFragment(): DocumentFragment
    stylesAndScripts(basePath?: string): HTMLElement[]
  }
  export function parse(source: string, options?: { generator: HtmlGenerator }): void
}
