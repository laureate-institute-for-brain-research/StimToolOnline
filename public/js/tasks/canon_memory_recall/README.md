# CANON Memory Recall
Online port of StimTool3 `MemoryRecall` for the CANON functional session.<br/>
Spec: `CANON_StimtoolOnline_Port/tasks/01_MemoryRecall.md`. Session-wide decisions: `CANON_StimtoolOnline_Port/ONLINE_BUILD.md`.

# Summary
The first half of the mood induction before each task block. The participant types six autobiographical
memory sentences once, at the start of the session (all six share the session's `memory_valence`). Later
the sentences are shown back as timed recall slides: 60 s per memory, on a dark-blue screen, with a 3 s
grey screen between memories.

| `run` URL value | run_id | What happens |
|---|---|---|
| `entry` | `_MEM-EN-_BEH` | Six required single-line fields. The sentences are saved on the server (`/saveCanonMemories`, keyed by subject + visit) and logged. |
| `recall1` | `_MEM-R1-_BEH` | Memories 1, 2, 3 (schedule `MEM_run-recall1.schedule`) |
| `recall2` | `_MEM-R2-_BEH` | Memories 4, 5, 6 (schedule `MEM_run-recall2.schedule`) |

The recall pages read the memories back with `/getCanonMemories`. If they cannot be found, the page shows an
error and does not run (desktop aborts the same way).

# TRIAL STRUCTURE (recall)

```
                                     60 s            3 s            60 s            3 s            60 s
[instructions]--[Task will begin soon 3 s]--[memory 1]------[grey]------[memory 2]------[grey]------[memory 3]--
^                                           ^               ^           ^                ^          ^           ^
INSTRUCT_ONSET                              TASK_ONSET      TRANSITION  SLIDE_ONSET      TRANSITION SLIDE_ONSET TASK_END
                                            SLIDE_ONSET
```
Every boundary is anchored to TASK_ONSET on one clock (targets 0, 60, 63, 123, 126, 186 s), so the run is
exactly 186 s from TASK_ONSET to TASK_END. Durations come from the schedule's Durations column.

# INPUT DETAILS
```
.schedule (verbatim desktop file): TrialTypes = 1-based memory index, Durations = hold time in seconds.
Stimuli and ExtraArgs are unused. Non-numeric indices are skipped; an out-of-range index stops the run.
decks/recall.csv: the 5 instruction slides (mem_recall_1..5.png, footer re-rendered for the keyboard).
```

# OUTPUT DETAILS
Common CANON columns on every row (see ONLINE_BUILD.md), then the desktop columns:

```
COUNTERBALANCE (92)  first row. result: arm string, e.g. KEYBOARD-PST-FIRST-A1
INSTRUCT_ONSET (1)   entry: before the form. recall: before the instruction slides.
SENTENCE_ENTRY (3)   entry only, one row per memory.
                     trial_number: 1-based memory index (1-6), trial_type: ENTRY, result: sentence text
TASK_ONSET (2)       recall only. response_time: instructions + start screen (s).
                     result: "<valence> #0000A8" (happy / sad; "none" if the URL had no valid valence)
SLIDE_ONSET (4)      trial_number: 0-based slide position in this run (0,1,2)
                     trial_type: memory index (1-3 or 4-6), result: sentence text
TRANSITION_ONSET (5) trial_number / trial_type: the slide it leads into. result: "3.0s #2F2F2F"
TASK_END (99)
```
Expected rows: entry `92, 1, 3x6, 99`; recall `92, 1, 2, 4, 5, 4, 5, 4, 99`.

# Online deviations
- The RA dialog is replaced by a participant-facing form. Its wording depends on `memory_valence`.
  **The wording in `ENTRY_PROMPTS` (canon_memory_recall.js) is a draft and needs study-team review.**
  The entry page refuses to run without a valid valence (the prompt depends on it).
- Memory fields are single-line, trimmed, max 250 characters; line breaks are removed (pressing Enter moves
  to the next field), so stored memories stay one per index.
- Memories are stored per subject **and visit**, so a T2 recall can never show T1 memories (desktop keyed
  the file by subject only).
- The RA ENTER start gate is replaced by the 3 s "Task will begin soon" screen.
- Online CSVs quote sentences that contain commas (desktop wrote them raw).
