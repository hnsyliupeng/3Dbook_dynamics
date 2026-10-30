import { useEffect, useRef } from 'react'
import type { AtwoodParameters } from '../physics/atwood'
import type { PhysicsSnapshot } from '../physics/PhysicsModel'
import type { DerivationStep } from '../lessons/atwood/lesson'

const channel = 'mechanics-book', version = 1
export function ColorfiguresAdapter({ snapshot, parameters, showForces, showConstraint, selected, onSelect, activeStep }: {
  snapshot: PhysicsSnapshot; parameters: AtwoodParameters; showForces: boolean; showConstraint: boolean
  selected: string; onSelect: (part: string) => void; activeStep: DerivationStep | null
}) {
  const frame = useRef<HTMLIFrameElement>(null)
  // A generated standalone book injects the exact Colorfigures artifact as srcdoc.
  // In file://, the document has an opaque origin; window identity is still checked.
  const figureHtml = (window as Window & {__MECHANICS_EMBEDDED_COLORFIGURE__?:string}).__MECHANICS_EMBEDDED_COLORFIGURE__
  // Chromium reports location.origin as 'file://' while postMessage serializes
  // a file document's security origin as opaque 'null'. In that case only,
  // target '*' is necessary; both directions still verify origin and Window.
  const fileOrigin = window.location.protocol === 'file:'
  const trustedOrigin = fileOrigin ? 'null' : window.location.origin
  const srcDoc = figureHtml?.replace('<html lang="en"', `<html lang="en" data-standalone-embed="1" data-parent-origin="${trustedOrigin}"`)
  const targetOrigin = fileOrigin ? '*' : trustedOrigin
  const current = useRef({ snapshot, parameters, showForces, showConstraint, selected, activeStep })
  current.current = { snapshot, parameters, showForces, showConstraint, selected, activeStep }
  const send = () => frame.current?.contentWindow?.postMessage({ channel, version, type:'SET_STATE', ...current.current }, targetOrigin)
  useEffect(() => { send() }, [snapshot, parameters, showForces, showConstraint, selected, activeStep])
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin !== trustedOrigin || event.source !== frame.current?.contentWindow ||
          event.data?.channel !== channel || event.data?.version !== version) return
      if (event.data.type === 'VIEW_READY') send()
      if (event.data.type === 'SELECT_PART' && ['m1','m2'].includes(event.data.part)) onSelect(event.data.part)
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [onSelect])
  return <iframe ref={frame} onLoad={send} className="colorfigure-frame" title="Colorfigures 手绘阿特伍德机"
    srcDoc={srcDoc} src={srcDoc ? undefined : `${import.meta.env.BASE_URL}skill-artifacts/atwood-colorfigures.html?embed=1`} />
}
