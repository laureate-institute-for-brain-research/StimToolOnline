# CANON Slider ratings
Online port of the StimTool3 `Slider` task as used in the CANON functional session.
Spec: `CANON_StimtoolOnline_Port/tasks/02_Slider-Ratings.md`. Session wiring: `CANON_StimtoolOnline_Port/ONLINE_BUILD.md`.

# Summary
Five rating blocks per visit, one page each (`run=` in the task URL):

| run | items | run_id |
|---|---|---|
| PRE-PST | PRE (2) | RATE-1A-_BEH |
| POST-TRAIN | POST (16) | RATE-1B-_BEH |
| POST-TEST | POST (16) | RATE-1C-_BEH |
| PRE-SET | PRE (2) | RATE-2A-_BEH |
| POST-SET | POST (16) | RATE-2B-_BEH |

Items come verbatim from `schedules/study-SMITH-2026-CANON_task-RATE_run-<slot>-R.schedule` (the `-R` and `-L`
files are byte-identical; online has one keyboard map). Self-paced, no time limit, one item per screen.

# TRIAL STRUCTURE

```
[instructions]--->[ready screen]--->([item: rating until committed])x N
^                                    ^                            ^
COUNTERBALANCE, INSTRUCT_ONSET       (item onset)                 RESPONSE
```

# INPUT
- Keyboard (desktop parity): the first LEFT/RIGHT press puts the marker next to the midpoint (N=11: 4 or 6;
  N=5: 1 or 3), later presses move one tick, clamped. SPACE (SELECT) commits.
- Mouse: click a tick to place the marker, then click **Continue** (or press SPACE).
- Committing without a marker shows "Please enter a response".

# OUTPUT DETAILS
Common CANON columns are described in `ONLINE_BUILD.md`.

```
COUNTERBALANCE (92)
result: arm string, e.g. KEYBOARD-PST-FIRST-A1

INSTRUCT_ONSET (0)

RESPONSE (1)
trial_number: Question_Type (e.g. pleasent_unpleasant, happy, positive, ..., attention)
response_time: commit time - item onset (s)
response: 0-based tick INDEX (desktop parity; face "3" is logged 2)
result: question text
item_index: 1-based position in the block
response_label: label under the chosen tick ('' for unlabeled ticks)
response_value_1based: response + 1
input: keyboard / mouse

TASK_END (99)
```

# DEVIATIONS FROM DESKTOP
- Button-box instruction slides replaced by the key-map slide; the "how to use the buttons" slide is kept with a
  keyboard footer. The deck is shown before every block, as on desktop.
- Mouse input is new. A mouse click reaches any tick (including the midpoint) in one step, whereas the
  desktop keyboard needs an extra press for the midpoint. Use the `input` column to separate them.
- Narration audio, the breathing block and the between-run screen are dropped.
