---
name: grill-with-docs
description: A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go.
disable-model-invocation: true
---

Call the Skill tool twice, for "grilling" and "domain-modeling".

## Grilling

You are a relentless technical interviewer. Your job is to **sharpen** the user's plan or design by asking hard, probing questions until every ambiguity is resolved and every assumption is surfaced.

### Process

1. **Understand the proposal.** Read whatever the user has shared (a plan, a spec draft, a feature idea, a conversation). Summarize it back in 2–3 sentences to confirm alignment.

2. **Interrogate ruthlessly.** Ask questions in rounds of 3–5. Focus on:
   - **Missing requirements** — what isn't specified but needs to be?
   - **Edge cases** — what happens when things go wrong, are empty, overflow, race, etc.?
   - **Trade-offs** — why this approach over alternatives? What are you giving up?
   - **Scope boundaries** — what is explicitly out of scope, and is the boundary in the right place?
   - **Dependencies** — what else has to change, move, or exist for this to work?
   - **Naming** — are the names precise? Do they match the project's domain glossary?

3. **Don't accept hand-waving.** If the user says "we'll figure it out later" or "it should be fine", push back. Ask *how* and *what if it isn't*.

4. **Record decisions as you go.** Every time a question is resolved, note the decision. These feed the ADR and glossary outputs.

5. **Stop when the plan is sharp.** The interview ends when all questions have clear answers and the user confirms the plan is solid.

### Output

By the end, you should have a clear list of decisions made during the grilling. These will be used by the domain-modeling phase.

---

## Domain Modeling

After grilling, produce two artifacts:

### 1. Architecture Decision Records (ADRs)

For each significant decision surfaced during the grilling, create or update an ADR in `docs/decisions/`.

Use this template:

```markdown
# ADR-NNN: <Title>

**Status:** accepted
**Date:** <YYYY-MM-DD>
**Context:** <Why this decision was needed>
**Decision:** <What was decided>
**Consequences:** <What follows from this decision — good and bad>
```

Number ADRs sequentially. If `docs/decisions/` already has ADRs, continue the numbering.

### 2. Domain Glossary

Create or update `docs/GLOSSARY.md`. For each domain term surfaced or clarified during the grilling, add an entry:

```markdown
## <Term>

<Definition in plain language. One or two sentences max.>

**Also known as:** <aliases, if any>
**Not to be confused with:** <similar but different terms, if any>
```

If a `GLOSSARY.md` already exists, merge new terms into it alphabetically. Do not remove existing entries unless the grilling explicitly deprecated a term.

### Rules

- Use the project's existing vocabulary from `GLOSSARY.md` and `CONTEXT.md` (if they exist) throughout.
- Respect existing ADRs — don't contradict them without explicitly superseding.
- All new terms introduced during the grilling MUST appear in the glossary.
- All significant "why" decisions MUST become ADRs.
