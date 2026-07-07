# Attestor — visual proof-of-completion notary with escrow

Attestor locks GEN against acceptance criteria, then lets a GenLayer
**vision panel** confirm that a submitted photo proves the work is done —
releasing payment automatically when it does. The first vision-judged
build in the series: the panel doesn't read a description of the work, it
*looks at the image*.

**Contract:** `0xCf27D41Cd8d1eC66186D8FbEBBD94cE169Ec7A55` (GenLayer Studionet)

## How it works

1. **Post** — the client writes acceptance criteria (what a photo must
   show) and locks the full bounty in GEN. Open bounty (any wallet may
   submit) or assigned to one worker.
2. **Submit** — the worker pastes a public image URL as proof, plus an
   optional note.
3. **See** — the contract screenshots the image
   (`gl.nondet.web.render(mode="screenshot")`), an objective analyst
   describes it defect-aware, and a notary judge rules `VERIFIED | REJECTED`
   against the criteria (`gl.nondet.exec_prompt(images=[...])` under
   consensus).
4. **Release** — VERIFIED pays the worker on the same transaction; REJECTED
   costs one of a capped number of attempts (1–5). When attempts run out,
   or before any submission, the client reclaims the escrow with
   `cancel_job`.

## Why GenLayer

Confirming that an image depicts a required state is subjective visual
judgment over untrusted input — impossible for a deterministic contract,
and untrustworthy from a single off-chain server (whoever runs it controls
the money). GenLayer runs a multimodal LLM under optimistic consensus:
validators independently look at the same image and must converge on the
ruling before any GEN moves.

## Trust boundaries (stated honestly)

- **Depiction, not provenance.** The panel confirms the image shows what
  the criteria describe. It cannot know the photo is recent, unstaged, or
  the worker's own work.
- **Proof is a hosted URL** the worker controls; the contract screenshots
  it. A dead link is judged as missing proof.
- **Rulings are inline and final per attempt** — the capped resubmit budget
  is the only second chance; there is no appeal.
- The fetched image and the worker note are material under review, never
  instructions — anti-injection guardrails reject anything in them that
  tries to steer the ruling.
- Wallet payouts are EVM external messages (an empty
  `@gl.evm.contract_interface` proxy executed by the contract's ghost
  account), the correct pattern for sending GEN to an EOA.

## Structure

```
├── contracts/
│   └── attestor.py        # the Intelligent Contract (vision adjudication + escrow)
├── deploy/
│   └── deployScript.ts    # genlayer-js deploy script
├── tests/
│   └── direct/            # 21 deterministic tests (stubbed GenLayer + vision)
├── frontend/              # Next.js 16 — "darkroom" dark design
├── gltest.config.yaml
├── pyproject.toml
└── requirements.txt
```

## Frontend

- **Job board** — every job with status filters
- **Job room** — criteria, bounty, attempts, proof form (paste an image
  URL), and the proof log with per-attempt verdict + panel reasoning
- **Post a job** — lock the bounty, set criteria, open or assigned, choose
  the attempt budget
- **My work** — jobs you posted and jobs you worked

Every write surfaces its transaction hash with a Studionet explorer link.

## Running locally

```bash
cd frontend
npm install
# .env.local: NEXT_PUBLIC_CONTRACT_ADDRESS + Studionet RPC vars (see .env.Example)
npm run dev -- -p 4700
```

Tests: `python -m pytest tests/direct -q` from the repo root.
