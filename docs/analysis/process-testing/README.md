# Process testing (CPT)

This directory contains three process models and their generated test paths for [Checkpoint 1](https://gitlab.fel.cvut.cz/muchaja3/frank/-/milestones/1).

## Processes

| Directory | Process | Scope |
| --- | --- | --- |
| `01-message-validation/` | WebSocket message validation | Validate incoming `MOVE` and `SETTINGS` messages, reject invalid input, and dispatch valid messages to their handlers. |
| `02-turn-synchronization/` | Server turn synchronization | Record eligible moves, handle disconnects/rejections/errors, wait for remaining players, and resolve a turn. |
| `03-client-input/` | Client touch input | Recognize touch gestures (tap, swipe, long press, two-finger tap), dispatch their actions, or finish without dispatching. |

The settings-form CPT model was removed to keep the three distinct processes required for Checkpoint 1. Settings inputs are covered separately by equivalence-class/boundary-value and combinatorial analysis.

## Files

Each process directory contains:

- `model.json` — CPT Manager process model.
- `diagram.png` — exported process diagram.
- `tdl-1.json` — PCT test paths for edge coverage.
- `tdl-2.json` — PCT test paths for edge-pair coverage.
- `tdl-3.json` — PCT test paths for three-edge-sequence coverage.

## Test generation and coverage

Test sets were generated in [CPT Manager](https://cpt.fel.cvut.cz/manager/) using the **PCT** algorithm, with test depth levels **1**, **2**, and **3** and no path reduction.

| Process | TDL 1 paths | TDL 2 paths | TDL 3 paths |
| --- | ---: | ---: | ---: |
| Message validation | 13 | 13 | 13 |
| Turn synchronization | 7 | 8 | 8 |
| Client touch input | 12 | 12 | 12 |

The exported paths were checked against the included model edges: each test set covers all structurally possible consecutive edge sequences of its requested depth (1, 2, or 3). Some TDL levels produce the same complete paths.

## Model boundaries and implementation notes

- **Message validation** ends when a valid message reaches `handleMove` or `handleSettings`. It checks message format and field validity.
- **Turn synchronization** begins in `handleMove` or `eliminateWebSocket`. It checks state-dependent conditions such as whether `gameId` matches the current game. The elimination branch includes socket `close`, `error`, and message rejection.
- **Client touch input** models one touch-event processing step. All no-dispatch outcomes share `NO_ACTION`, but a branch waiting for another `touchend` preserves the in-progress gesture, unlike a cancelled gesture.
