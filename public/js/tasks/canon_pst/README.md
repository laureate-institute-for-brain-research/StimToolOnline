# CANON Probability Selection Task (PST)
Online port of the StimTool3 ProbabilitySelectionTask as run in the CANON functional session.<br/>
Spec: `CANON_StimtoolOnline_Port/tasks/03_ProbabilitySelectionTask.md`; shared conventions:
`CANON_StimtoolOnline_Port/ONLINE_BUILD.md`.

# Summary
Frank probabilistic selection task. Six pictures in three learning pairs (AB, CD, EF); each picture
carries a hidden reward probability set by the probability map. One page per desktop run:

| `run` URL value | Schedule (`schedules/study-SMITH-2026-CANON_task-PST_run-…`) | Deck | run_id |
|---|---|---|---|
| `PRAC` | `PRAC-R-<letter>` | `decks/prac_<letter>.csv` | `_PST-PR-_BEH` |
| `TRAIN-P1` | `TRAIN-<letter><outlist>-P1` | `decks/train_p1.csv` | `_PST-T1-_BEH` |
| `TRAIN-P2` | `TRAIN-<letter><outlist>-P2` | `decks/train_p2.csv` | `_PST-T2-_BEH` |
| `TEST` | `TEST-<letter>` | `decks/test.csv` | `_PST-TE-_BEH` |

`letter`, `outlist` and `probmap` come from the task URL (written into the condition study JSON).
An invalid value stops the page on an error screen.

| probmap | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| CURRENT | 80 | 20 | 70 | 30 | 60 | 40 |
| ALT1 | 20 | 80 | 30 | 70 | 40 | 60 |
| ALT2 | 40 | 60 | 20 | 80 | 30 | 70 |

Schedule tokens: A=1, B=6, C=2, D=5, E=3, F=4. Accuracy is 1 when the chosen picture's mapped
probability is higher (tokens are never compared).

# TRIAL STRUCTURE
All phases are clock-anchored to TASK_ONSET (non-slip): every phase ends at its ideal time, so a run
lasts exactly its schedule sum (PRAC 18.0 s, TRAIN-P1 687.5 s, TRAIN-P2 704.5 s, TEST 692.75 s).

```
TRAIN / PRAC choice trial
[choice 3.0 s fixed]--[ISI fixation, TRAIN only]--[feedback 1.0 s]--[ITI fixation]
 counter + 2 pictures   schedule Durations #2      reward / zero /    schedule Durations #1
 ring on first choice                              No Response Detected!
TEST choice trial
[choice 3.0 s fixed]--[responded: black 1.0 s | missed: No Response Detected! 1.0 s]--[ITI fixation]
HAPPY probe (every 5th TRAIN row; TEST rows 29/58/87; last PRAC row)
[How happy do you feel at this moment? 0-10, start 5, fixed 5.0 s]--[0.25 s fixation]
```
- The first LEFT/RIGHT press counts; the window always runs its full 3.0 s.
- HAPPY: LEFT/RIGHT move one tick per press; SPACE locks the rating in (marker grey -> white) and
  freezes it; the window still runs 5.0 s.
- Reward: TRAIN uses the run's count-based list (`count_outcome_schedule` in the .params), looked up
  by the chosen picture's mapped probability and how many times it has been chosen this run (counts
  reset every run). PRAC rewards `accuracy == ExtraArgs`. TEST gives no feedback.
- Trial counter `n/N` (N = all schedule rows) top-left on choice, feedback and HAPPY screens only.

# INPUT DETAILS
```
EACH LINE CODES: one trial (verbatim desktop .schedule, header skipped)
TrialTypes - token pair 'L_R' (e.g. 1_6) or HAPPY
Stimuli    - 'left right' picture paths (media\canon_images\A.bmp ...; served as .png)
Durations  - 'ITI ISI' in seconds (HAPPY rows: ignored)
ExtraArgs  - PRAC reward rule bit (logged in the TRIAL_ONSET result)
TRIAL ORDER IS: fixed
```

# OUTPUT DETAILS
Columns: the desktop seven (`trial_number, trial_type, event_code, absolute_time, response_time,
response, result`) plus the CANON condition columns (see ONLINE_BUILD.md). `trial_number` is the
0-based schedule row; `trial_type` is the mapped probability pair `pL_pR` (or `HAPPY`).
```
COUNTERBALANCE (92)
  1st row: result = arm (e.g. KEYBOARD-PST-FIRST-A1)
  2nd row: trial_type = pst_prob_map, result = e.g. 'ALT2 A:40 B:60 C:20 D:80 E:30 F:70'
INSTRUCT_ONSET (1)
TASK_ONSET (2)        response_time: instructions + 3 s start screen
TRIAL_ONSET (3)       response: pL_pR (TEST: raw token pair, e.g. 5_1); result: ExtraArgs
IMAGE_ONSET (4)       response: as TRIAL_ONSET; result: '<left path> <right path>' (schedule paths)
RESPONSE (6)          response_time: RT from image onset; response: left/right; result: chosen picture path
ACCURACY (7)          response_time: RT; response: left/right; result: 1/0
FIXATION (5)          result: ISI / ITI seconds, or 0.25 after HAPPY
FEEDBACK (8)          TRAIN/PRAC: response '<ExtraArgs>_<accuracy>' (999 = none),
                                  result reward / zero / 'no response'
                      TEST: response NA, result blank / no_response
RATING_ONSET (9)      result: 5
RATING_CHANGE (10)    response_time: since RATING_ONSET; response: left/right; result: new position
RATING_SELECTION (11) response: select / no_response; result: position 0-10
TASK_END (99)
```

# Online deviations
- Keys: LEFT = left arrow, RIGHT = right arrow, SELECT = space. No escape/quit.
- A 3 s "Task will begin soon" screen precedes trial 1 (desktop BEHAVIORAL); there is no RA ENTER
  gate and no 10 s scan lead.
- Instruction slides carry the keyboard footer; the button-box slide is replaced by the key-map slide.
- Before the start screen, every image is rendered once under a black cover, so the first display of
  each picture/outcome image is not delayed by its GPU upload.
- Pictures are served as PNG (lossless conversion of the desktop BMPs).
