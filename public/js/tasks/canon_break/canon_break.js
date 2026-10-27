/**
 * CANON break
 * Self-paced break between the two halves of the CANON session. On desktop this slot is the
 * anatomical scan (Rest:STRUCT_run-1, 360 s); online it is excluded and replaced by this screen
 * (see CANON_StimtoolOnline_Port/excluded-scanner-tasks.md).
 * @author Aardron Robinson
 */

import { CanonPage, CanonRun, KEYS } from '/js/tasks/canon_common/canon_common.js'

const event_types = {
  BREAK_ONSET: 1,
  BREAK_END: 2
}

let run

new CanonPage({
  expName: 'Break',
  prepare: async () => [],
  build: (page) => {
    run = new CanonRun({ page, runId: 'BREAK', runSlot: 'BREAK' })
    page.add({
      begin: () => {
        run.start()
        run.logCounterbalance()
        run.log('NA', 'NA', event_types.BREAK_ONSET, 'NA', 'NA', 'NA')
      }
    })
    page.add(page.messageRoutine(
      'You are halfway through.\n\nTake a short break if you like.\n\nWhen you are ready to continue, press the RIGHT ARROW key.',
      { keyList: [KEYS.right], height: 0.045, onEnd: () => run.log('NA', 'NA', event_types.BREAK_END, run.now(), 'NA', 'NA') }
    ))
    page.add(page.finishRoutine(run))
  }
})
