/** Presentation state only. The physics timeline is paused before a page changes. */
export type BookState = 'CLOSED' | 'OPENING' | 'CHAPTER_SELECT' | 'PAGE_TURNING' | 'INK_DRAWING' | 'POPUP_RISING' | 'MODEL_READY' | 'SIMULATING' | 'PAUSED' | 'DERIVING' | 'EXPERIMENTING' | 'VERIFYING' | 'COMPLETED'
export type BookPage = 'theory' | 'experiment' | 'verify'
export const pageLabels: Record<BookPage, string> = { theory: '认识模型', experiment: '推导与实验', verify: '验证与思考' }
