# CANON Bonus Wheel (StimTool3 WheelOfFortune)
Port of the StimTool3 WheelOfFortune task for the CANON online session. Spec:
`CANON_StimtoolOnline_Port/tasks/05_WheelOfFortune.md`. Participants only ever see "Bonus Wheel".

# Summary
A rigged prize wheel used as the second mood-induction step, right after each memory recall block.
The wheel spins on its own; the participant presses SPACE (or clicks/taps) to make it start slowing
down. **The outcome of every spin is chosen before the wheel moves**: the press only sets when the
spin-down starts. Spin-down travel is the smallest whole number of turns >= 720 deg that lands on the
target, so stop time carries no information about the outcome.

| run | URL `run=` | spins | rigged spin |
|-----|-----------|-------|-------------|
| `_WOF-PR-_BEH` | `PRAC` | 1 x `ZERO` | none (`none $0`) |
| `_WOF-R1-_BEH` | `1` | `ZERO, ZERO, RIGGED` | happy +$10 / sad -$10 |
| `_WOF-R2-_BEH` | `2` | `ZERO, ZERO, RIGGED` | happy +$5 / sad -$5 |

The rigged direction comes from the `valence` URL parameter (the session's memory valence). If a run
has a `RIGGED` spin and the valence is missing or invalid, the page shows an error and does not run
(deliberately no default).

# TRIAL STRUCTURE

```
 participant-paced (>=1.2 s, <=20 s)   3.43-5.14 s            3.0 s (5.0 s rigged)    1.5 s
[ wheel free-running + prompt ] -> [ wheel decelerating ] -> [ landed slice outlined ] -> [ fixation ]
^ SPIN_ONSET                       ^ PRESS                  ^ OUTCOME_ONSET             ^ ITI_ONSET
```
- Every spin starts at angle 0 (+$10 under the pointer), accelerates for 0.6 s to 420 deg/s.
- Presses before 1.2 s are discarded. With no press by 20 s the spin stops anyway (`no_response`) and
  still lands on its predetermined target.
- The outcome is re-anchored at the stop; outcome and ITI are then held against that anchor.
- No start gate: the first spin starts as soon as the last instruction slide is advanced.

# INPUT DETAILS
`schedules/study-SMITH-2026-CANON_task-WOF_run-*.schedule` (verbatim from StimTool3): one row per
spin, `TrialTypes` = `ZERO`/`RIGGED`, `Durations` = `outcome_duration iti_duration`. The `.params`
give `run_id` and `rigged_amount_happy` / `rigged_amount_sad`. Decks: `decks/practice.csv` (PRAC),
`decks/go.csv` (runs 1 and 2).

# OUTPUT DETAILS
Common CANON columns (see `CANON_StimtoolOnline_Port/ONLINE_BUILD.md`) plus `final_angle`, `jitter`,
`travel`, `stop_duration` (filled on `OUTCOME_ONSET` rows). `trial_number` is the 0-based spin index.
Angles are degrees clockwise from 12 o'clock.

```
COUNTERBALANCE (92), trial_type NA
result: arm, e.g. KEYBOARD-PST-FIRST-A1

COUNTERBALANCE (92), trial_type wheel_valence
result: '<label> <amount>', e.g. 'happy +$10', 'sad -$5'; PRAC 'none $0'

INSTRUCT_ONSET (1)

TASK_ONSET (2)
response_time: seconds since INSTRUCT_ONSET
result: same as wheel_valence

SPIN_ONSET (3)
trial_type: ZERO / RIGGED
result: predetermined outcome ('$0', '+$10', '-$5', ...)

PRESS (4)
response_time: seconds since SPIN_ONSET
response: 'space', 'mouse' (click or tap), or 'no_response' (20 s timeout)
result: wheel angle at the press, 0-360, one decimal

OUTCOME_ONSET (5)
response: landed slice index 0-15
result: landed label ('$0', '+$10', '-$5', ...)
final_angle / jitter / travel / stop_duration: spin-down details

ITI_ONSET (6)
result: ITI seconds ('1.5')

TASK_END (99)
```

Slice indices: even = value slices (0 +$10, 2 -$5, 4 +$5, 6 -$10, 8 +$10, 10 -$5, 12 +$5, 14 -$10),
odd = $0 slices.

# Online deviations from desktop
- Input: SPACE or click/tap instead of the hand-mapped LEFT button; `PRESS.response` records which.
  Prompt: "Press SPACE or click to start slowing the wheel".
- No RA ENTER start gate.
- `final_angle`, `jitter`, `travel`, `stop_duration` are logged (desktop did not log them).
- Label ink-centring (desktop `measure_label_correction`) is not reproduced; labels are centred on
  their text box (cosmetic, at most a few pixels).
