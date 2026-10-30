import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

export function Formula({ latex, display = false }: { latex: string; display?: boolean }) {
  const html = useMemo(() => katex.renderToString(latex, { displayMode: display, throwOnError: false, strict: 'warn' }), [latex, display])
  return <span className={display ? 'formula display' : 'formula'} dangerouslySetInnerHTML={{ __html: html }} />
}
