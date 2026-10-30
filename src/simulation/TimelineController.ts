import { FIXED_DT, type AtwoodParameters } from '../physics/atwood'
import { SnapshotStore } from './SnapshotStore'

export class TimelineController {
  store: SnapshotStore
  time = 0
  playing = false
  constructor(parameters: AtwoodParameters) { this.store = new SnapshotStore(parameters) }
  get snapshot() { return this.store.at(this.time) }
  play() {
    if (this.time >= this.store.endTime - 1e-9) this.time = 0
    this.playing = true
  }
  pause() { this.playing = false }
  seek(time: number) { this.pause(); this.time = Math.max(0, Math.min(this.store.endTime, time)) }
  advance(delta: number) {
    if (!this.playing) return
    this.time = Math.min(this.store.endTime, this.time + Math.max(0, delta))
    if (this.time >= this.store.endTime - 1e-10) { this.time = this.store.endTime; this.pause() }
  }
  step(direction: -1 | 1) { this.seek(this.time + direction * FIXED_DT) }
  reset() { this.pause(); this.time = 0 }
  setParameters(p: AtwoodParameters) { this.pause(); this.store = new SnapshotStore(p); this.time = 0 }
}
