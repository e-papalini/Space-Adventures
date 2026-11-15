# Landing approach and science relay mini-games

Changes are on `integration-test`; original teammate branches and `main` are
unchanged. The original Flight files remain untouched. No commits or pushes are
performed by this change.

## Landing

The integration-only `automaticLanding.js` uses a **450 m** proximity zone and a
**four-second continuous hold**. Keep piloting normally; the guidance text and
progress bar count down while inside. Leaving the zone resets the count. There
are no strict speed, altitude or heading requirements. After the hold, the
existing 2.5-second landing sequence follows a smooth approach curve and hands
off to Exploration through the existing controller. Neither the old button nor
the F key can skip the approach hold.

## Onboard scan

This activity prepares information already discovered in Exploration. It does
not generate generic surveys or invent new scientific results.

1. Read the short introduction and choose **Start preparing my findings**.
2. Pick a real finding. Its explanation and preparation status are visible.
3. Choose the installed instrument that collected it.
4. Prepare it: a short progress animation checks the reading. Success costs the
   original **2 energy**, awards **5 preparation points**, and marks the finding
   ready. Its packets already occupy storage; no storage is charged again.

Wrong tools and repeated preparation consume no resources and earn no points.
Uninstalled tools never appear. No findings means a clear empty-state message,
with the existing option to finish the mission and try exploring again.

## Signal alignment

Choose a packet from a prepared finding, open its signal console, read the short
explanation, and choose **Start lining up the waves**. The original frequency and
phase controls remain. Frequency changes the spacing between wave bumps; phase
shifts them sideways.

The gold reference is now drawn at the same target used for scoring:
frequency **1.14**, phase **35 degrees**. Previously the visual reference and the
lock target differed. The blue wave uses the player's controls. Accuracy is
computed from the root-mean-square difference between the same 181 normalized
wave samples used in the graph, scaled to 0–100 and rounded. Identical waves
score 100%; circularly equivalent phases match.

| Accuracy | Result | Signal bonus |
| --- | --- | --- |
| 90–100% | Excellent connection | 30 |
| 75–89% | Good connection | 20 |
| 50–74% | Weak connection | 10 |
| Below 50% | Keep trying | 0; cannot send |

Accuracy and possible points update as sliders move. Adjusting, cancelling and
failed attempts are free. Successful contacts retain the original per-packet
energy cost, antenna limit, relay availability and storage checks. Only the sent
packet's space is released. Each receipt records its accuracy.

## Rewards and fairness

- Preparation: **5** per different real finding, up to six.
- Scientific data delivered: the existing **10** per complete real finding, up
  to six. This replaces the existing data reward in the mission breakdown; it
  is not added a second time.
- Valuable data: **5 extra** for prepared Bennu water clues or sample information
  that fully arrive, up to four. Radio waves carry information about samples,
  not the physical samples themselves.
- Signal alignment: **one bonus per mission**, at most **30**. Every packet of a
  finding must arrive. Its weakest packet determines that finding's connection
  quality; the best complete finding determines the mission signal bonus.

An explicit packet manifest proves delivery; discarding unsent packets cannot
turn a partial transmission into a complete finding. Duplicate sends, repeated
preparation and splitting a finding into more packets never multiply rewards.
The live summary shows delivered findings, valuable records, connection accuracy,
preparation points, signal points, scientific-data points and total stage points.
Immediate messages explain successful preparation and send rewards.

Stage rewards are provisional mission-score points. They are saved together
with the final mission score when finishing the mission. Lifetime points retain
the existing best-score rule: a first run adds its score; a replay adds only the
amount it improves the destination's best. Duplicate completion callbacks remain
unrewarded. Saved progress uses the same localStorage key and schema. Existing
saves remain readable; the validated score ceiling is now 325 rather than 265
to accommodate the bounded new categories. Unlock thresholds are unchanged.

Example: one Bennu infrared finding, prepared and fully sent at 100%, earns
**50 stage points** (5 preparation + 30 connection + 10 data + 5 water-clue bonus)
and **105 mission points** including the existing science/completion/resource
rewards. Resources finish at **75.75 Wh**, **100 MB free**. A previous best of
65 means this improved replay adds **40 lifetime points**, not 105 again.

## Testing locally

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Open http://localhost:8000/ and play Bennu. Use the same browser/port for the same
saved progress. Test these behaviors:

1. Fly into the 450 m zone and watch the countdown. Leave before it finishes to
   reset it. Hold inside for four seconds to land automatically.
2. Collect a real Exploration finding with an installed instrument.
3. Start preparation; try another tool if installed, then the correct tool.
   Check the +5 message, energy and unchanged packet/storage counts.
4. Open a prepared packet's console. Start aligning and move both sliders. The
   accuracy meter should change; below 50% cannot send. Aim for 1.14 / 35 degrees
   for a 100% connection, or try a weaker connection for a smaller reward.
5. Complete all packets, inspect the stage summary, finish the mission, return to
   Earth and refresh. Check saved best scores and replay improvement.

`npm.cmd test` runs all regressions. Tests cover the hold and reset, button bypass
prevention, accuracy tiers, preparation validation, no invented/duplicate data,
weak/good/excellent contacts, packet completion, discarded packets, exact resource
costs, score integration, replay protection and persisted rewards.
