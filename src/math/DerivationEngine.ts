import type { DerivationStep } from '../lessons/atwood/lesson'

/** Validates a real dependency DAG instead of pretending formulas are independent animation frames. */
export class DerivationEngine {
  private readonly byId: Map<string, DerivationStep>
  constructor(readonly steps: DerivationStep[]) {
    this.byId = new Map(steps.map(s => [s.id, s]))
    if (this.byId.size !== steps.length) throw new Error('Duplicate derivation ID')
    for (const step of steps) for (const dependency of step.mathematicalDependencies) {
      if (!this.byId.has(dependency)) throw new Error(`Missing derivation dependency ${dependency}`)
    }
    steps.forEach(step => this.pathTo(step.id))
  }
  pathTo(id: string): DerivationStep[] {
    const result: DerivationStep[] = [], seen = new Set<string>(), visiting = new Set<string>()
    const visit = (key: string) => {
      if (seen.has(key)) return
      if (visiting.has(key)) throw new Error('Cyclic derivation')
      const step = this.byId.get(key)
      if (!step) throw new Error(`Unknown step ${key}`)
      visiting.add(key); step.mathematicalDependencies.forEach(visit); visiting.delete(key)
      seen.add(key); result.push(step)
    }
    visit(id)
    return result
  }
}
