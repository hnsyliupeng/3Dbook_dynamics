import { atwoodLesson, type MechanicsLesson } from './atwood/lesson'
import { DerivationEngine } from '../math/DerivationEngine'

/** A source catalog alone does not make a lesson playable. Registration requires
 * a reviewed model and derivation; unreviewed notebook records remain metadata. */
export class LessonCompiler {
  private readonly registered = new Map<string, MechanicsLesson>()
  register(lesson: MechanicsLesson): void {
    if (this.registered.has(lesson.id)) throw new Error(`Duplicate lesson ${lesson.id}`)
    if (!lesson.source.commit || !lesson.source.notebooks.length || !lesson.model.assumptions.length)
      throw new Error(`Missing source or assumptions in ${lesson.id}`)
    new DerivationEngine(lesson.derivation)
    this.registered.set(lesson.id, lesson)
  }
  get(id: string): MechanicsLesson | undefined { return this.registered.get(id) }
  list(): MechanicsLesson[] { return [...this.registered.values()] }
}
export const lessonCompiler = new LessonCompiler()
lessonCompiler.register(atwoodLesson)
