# Evaluation report

## 1. Hand-labelled events

| route | week | expected | got | |
|---|---|---|---|---|
| Delhi-Jaipur | 2024-11-11 | Yes  | Yes  | PASS |
| Delhi-Jaipur | 2024-11-18 | Yes  | Yes  | PASS |
| Ahmedabad-Mumbai | 2025-01-20 | No (justified) N002 | No (justified) N002 | PASS |
| Chennai-Bangalore | 2025-02-24 | No (justified) N001 | No (justified) N001 | PASS |
| Chennai-Bangalore | 2025-03-03 | No (justified) N001 | No (justified) N001 | PASS |
| Chennai-Bangalore | 2025-03-10 | Yes  | Yes  | PASS |
| Chennai-Bangalore | 2025-03-17 | Yes  | Yes  | PASS |

- **Labelled rows correct**: 7/7
- **False flags in clean period (before 2024-11-04)**: 0 of 308 route-weeks
- **Mumbai-Pune drift weeks flagged (from 2025-06-16)**: 11 of 28; wrongly justified: 0
- **Other flags outside labelled events**: Mumbai-Delhi 2025-05-12 (No (justified) N003)

## 1b. Retrieval quality (free-text queries, no route filter, 8 labelled)

- **Top-1 correct**: 8/8; **top-3 correct**: 8/8

## 1c. Rule-based note reader (does the note say costs went UP?)

- 10 supplied notes: **10/10** correct. 12 new, differently worded notes: **5/12** correct (misses stay "unexplained"; a few can read a negated rise as a rise).
- This is a known limit: the parser is tuned to the supplied notes' phrasing. Unfamiliar wording should be reviewed by a person.

## 2. Synthetic injection (21 clean route-weeks per magnitude, seeded)

| injected rise | detected | false flags elsewhere in clean period | injected weeks wrongly "justified" |
|---|---|---|---|
| +5% | 2/21 | 0 | 0 |
| +8% | 6/21 | 0 | 0 |
| +10% | 10/21 | 0 | 0 |
| +12% | 16/21 | 0 | 0 |
| +15% | 19/21 | 0 | 0 |
| +20% | 21/21 | 0 | 0 |
| +30% | 21/21 | 0 | 0 |

Injected rises sit on top of ~3% normal weekly noise, so recall rises with size. Thresholds favour precision over catching small rises.
