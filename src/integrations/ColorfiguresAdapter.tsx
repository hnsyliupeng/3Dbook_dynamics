import { useEffect, useRef } from 'react'
import type { AtwoodParameters } from '../physics/atwood'
import type { PhysicsSnapshot } from '../physics/PhysicsModel'

const channel = 'mechanics-book', version = 1
export function ColorfiguresAdapter({ snapshot, parameters, showForces, showConstraint, selected, onSelect }: {
  snapshot: PhysicsSnapshot; parameters: AtwoodParameters; showForces: boolean; showConstraint: boolean
  selected: string; onSelect: (part: string) => void
}) {
  const frame = useRef<HTMLIFrameElement>(null)
  const current = useRef({ snapshot, parameters, showForces, showConstraint, selected })
  current.current = { snapshot, parameters, showForces, showConstraint, selected }
  const send = () => frame.current?.contentWindow?.postMessage({ channel, version, type:'SET_STATE', ...current.current }, window.location.origin)
  useEffect(() => { send() }, [snapshot, parameters, showForces, showConstraint, selected])
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow ||
          event.data?.channel !== channel || event.data?.version !== version) return
      if (event.data.type === 'VIEW_READY') send()
      if (event.data.type === 'SELECT_PART' && ['m1','m2'].includes(event.data.part)) onSelect(event.data.part)
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [onSelect])
  return <iframe ref={frame} onLoad={send} className="colorfigure-frame" title="Colorfigures 手绘阿特伍德机"
    src={`${import.meta.env.BASE_URL}skill-artifacts/atwood-colorfigures.html?embed=1`} />
}
