# Thesis 31: Adapt and evaluate the companion model

Published: https://github.com/RediSetHack/RediSetHack-V2/issues/148

Status: ready-for-agent. Approved on 2026-10-15.

## Parent

https://github.com/RediSetHack/RediSetHack-V2/issues/117

## What to build

Researchers can reproduce a RediSetHack-adapted model artifact and inspect its held-out tutoring comparison with the base model.

## Acceptance criteria

- [ ] Run parameter-efficient or equivalent task-specific adaptation of an existing model using the approved corpus and recorded training configuration.
- [ ] Emit versioned artifact/adapter, tokenizer/configuration compatibility information, lineage, and a base-versus-adapted evaluation report.
- [ ] Evaluate hint behavior, correctness, secure-programming advice, story tone, and answer leakage with the held-out rubric; disclose limitations.
- [ ] Prove the artifact loads under the selected serving interface; a prompt-only base-model connection does not satisfy this ticket.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

- #147 — Prepare approved companion training and evaluation material

## Further notes

Traceability: Fine-Tuned LLM AI Companion.

External prerequisite: The permitted model, compute capacity, and any spending authorization are external prerequisites; do not fabricate training/evaluation evidence if unavailable.
