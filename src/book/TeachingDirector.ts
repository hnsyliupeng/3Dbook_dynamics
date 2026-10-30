export type TeachingPhase = 'INTRO' | 'PREDICT' | 'BUILD_MODEL' | 'IDENTIFY_COORDINATES' | 'DEFINE_CONSTRAINTS' | 'DERIVE_EQUATIONS' | 'RUN_SIMULATION' | 'CHANGE_PARAMETERS' | 'COMPARE_RESULTS' | 'VERIFY' | 'CHALLENGE' | 'SUMMARY'
/** Teaching phases name intent; they never advance the physics clock. */
export const phaseForPage = { theory: 'DEFINE_CONSTRAINTS', experiment: 'DERIVE_EQUATIONS', verify: 'VERIFY' } as const satisfies Record<string, TeachingPhase>
