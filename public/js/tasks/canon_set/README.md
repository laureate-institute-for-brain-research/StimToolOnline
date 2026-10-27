# CANON Social Evaluation Task (SET)
Online port of the StimTool3 `SocialEvaluationTask` as used in the CANON functional session.
Spec: `CANON_StimtoolOnline_Port/tasks/04_SocialEvaluationTask.md`. Session wiring: `CANON_StimtoolOnline_Port/ONLINE_BUILD.md`.

# Summary
Raters (name + avatar whose colour and printed label give the rater's approval group) have "liked" or "disliked"
the participant's profile. The participant predicts each rating (Yes/No), then sees the prescribed feedback.
Interspersed RATING probes ask "How good do you feel about yourself at this moment?" on a 0-10 slider.

| run (URL) | schedule | rows | run_id | length after TASK_ONSET |
|---|---|---|---|---|
| PRAC | `SET_run-PRAC-R` | 10 (8 raters + 2 RATING) | _SET-PR-_BEH | 74.0 s |
| MAIN | `SET_run-A` or `SET_run-B` (schedule letter) | 151 (112 + 39 RATING) | _SET-R2-_BEH | 1056.5 s (17:36.5) |

Schedules are used verbatim and in file order (`schedules/`). All phases are clock-anchored: each phase ends at
TASK_ONSET + the sum of the nominal durations before it, so the run lasts exactly its schedule sum.

# TRIAL STRUCTURE

```
Rater trial
 (fixation col 3 #1)     (2.0 s fixed)           (delay col 3 #2)        (1.0 s)
[fixation + question]--> [name, avatar, Yes/No]--> [only chosen option]--> [thumb in avatar slot]
^                        ^          ^              ^                       ^
TRIAL_ONSET, FIXATION    RATER_ONSET PREDICTION    DELAY_ONSET             FEEDBACK

RATING probe
 (fixation col 3 #1)     (2.0 s)                 (5.0 s fixed)
[fixation + question]--> [self-esteem question]--> [question + slider, starts at 5, grey marker]
^                        ^                         ^         ^                 ^
TRIAL_ONSET, FIXATION    QUESTION_ONSET            RATING_ONSET RATING_CHANGE  RATING_SELECTION
```

The rater question "Did this person like you?" is also shown during RATING fixations (desktop quirk, kept for parity).

# INPUT
- LEFT ARROW = Yes, RIGHT ARROW = No (first press only; the unchosen option disappears).
- Slider: LEFT/RIGHT move one tick (one press = one tick), SPACE locks the rating (marker turns white, slider freezes).
  The window always runs its full 5 s.

# OUTPUT DETAILS
Common CANON columns are described in `ONLINE_BUILD.md`. `trial_number` is the 0-based row index (the on-screen
counter shows row + 1 / rows); `trial_type` is the full schedule string (e.g. `MLG_Jordan W.`, `RATING`).

```
COUNTERBALANCE (92)   result: arm string
INSTRUCT_ONSET (1)
TASK_ONSET (2)        response_time: instructions + start gate
TRIAL_ONSET (3)       result: trial_type
FIXATION (4)          result: fixation seconds
RATER_ONSET (5)
PREDICTION (6)        absolute_time: key time; response_time: RT from RATER_ONSET; result: YES / NO (no row if missed)
DELAY_ONSET (7)       result: delay seconds
FEEDBACK (8)          (outcome = feedback_code)
QUESTION_ONSET (9)
RATING_ONSET (10)     result: 5
RATING_CHANGE (11)    response: key name; response_time: ABSOLUTE key time (desktop quirk); result: new position
                      (logged even when the marker is clamped at 0 or 10)
RATING_SELECTION (12) response: select / no_response; response_time: from RATING_ONSET; result: position 0-10
TASK_END (99)

Extra columns: sex (M/F), group (G/LG/LR/R), rater_name, feedback_code (1 like, 2 dislike, 0 neutral),
fixation_dur, delay_dur
```

# DEVIATIONS FROM DESKTOP
- 3 s "Task will begin soon" start gate for both runs; no scanner lead fixation, no end fixation.
- Button-box slide in the practice deck replaced by the key-map slide; slide footers say RIGHT ARROW KEY.
  `Slide19` still says "Please let us know if there are any questions" (an RA reference), and `Slide2` describes a
  profile the participant supposedly submitted: both need study-team sign-off for online use.
