import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_PARAMETERS, type AtwoodParameters } from '../physics/atwood'
import { TimelineController } from './TimelineController'
import { SimulationClock } from './SimulationClock'

export function useSimulation() {
  const controller = useRef(new TimelineController(DEFAULT_PARAMETERS))
  const clock = useRef(new SimulationClock())
  const [parameters, setParametersState] = useState<AtwoodParameters>({ ...DEFAULT_PARAMETERS })
  const [snapshot, setSnapshot] = useState(controller.current.snapshot)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(0.5)
  const sync = useCallback(() => { setSnapshot(controller.current.snapshot); setPlaying(controller.current.playing) }, [])
  const pause = useCallback(() => { controller.current.pause(); clock.current.reset(); sync() }, [sync])
  const playPause = useCallback(() => {
    if (controller.current.playing) controller.current.pause()
    else controller.current.play()
    clock.current.reset(); sync()
  }, [sync])
  const reset = useCallback(() => { controller.current.reset(); clock.current.reset(); sync() }, [sync])
  const seek = useCallback((time: number) => { controller.current.seek(time); clock.current.reset(); sync() }, [sync])
  const step = useCallback((direction: -1 | 1) => { controller.current.step(direction); clock.current.reset(); sync() }, [sync])
  const setParameters = useCallback((next: AtwoodParameters) => {
    controller.current.setParameters(next); setParametersState({ ...next }); clock.current.reset(); sync()
  }, [sync])
  useEffect(() => {
    if (!playing) return
    let frame = 0, previous = performance.now()
    const tick = (now: number) => {
      const delta = clock.current.consume((now - previous) / 1000, speed); previous = now
      if (delta > 0) { controller.current.advance(delta); sync() }
      if (controller.current.playing) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, speed, sync])
  return { parameters, setParameters, snapshot, playing, speed, setSpeed, pause, playPause, reset, seek, step,
    store: controller.current.store }
}
