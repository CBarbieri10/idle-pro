---
name: tdd
description: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests. Also includes the implement workflow for building from specs/tickets.
---

# Test-Driven Development

TDD is the red → green loop. This skill is the reference that makes that loop produce tests worth keeping: what a good test is, where tests go, the anti-patterns, and the rules of the loop. Every section applies on every cycle: consult them before and during the loop, not after.

When exploring the codebase, read `CONTEXT.md` (if it exists) so test names and interface vocabulary match the project's domain language, and respect ADRs in the area you're touching.

## What a good test is

Tests verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't. A good test reads like a specification: "user can checkout with valid cart" tells you exactly what capability exists, and it survives refactors because it doesn't care about internal structure.

## Seams: where tests go

A **seam** is the public boundary you test at: the interface where you observe behavior without reaching inside. Tests live at seams, never against internals.

**Test only at pre-agreed seams.** Before writing any test, write down the seams under test and confirm them with the user. No test is written at an unconfirmed seam. You can't test everything, so agreeing the seams up front is how testing effort lands on the critical paths and complex logic instead of every edge case.

Ask: "What's the public interface, and which seams should we test?"

When the shape of that interface is itself in question (how deep the module is, where the seam belongs, what the interface should expose), consult the "Codebase Design Reference" section at the bottom of this skill for the vocabulary. It is the shared source of the module, interface, depth, seam, adapter, leverage and locality terms.

## Anti-patterns

- **Implementation-coupled**: mocks internal collaborators, tests private methods, or verifies through a side channel (querying the database instead of using the interface). The tell: the test breaks when you refactor but behavior hasn't changed.
- **Tautological**: the assertion recomputes the expected value the way the code does (`expect(add(a, b)).toBe(a + b)`, a snapshot derived by hand the same way, a constant asserted equal to itself), so it passes by construction and can never disagree with the code. Expected values must come from an independent source of truth: a known-good literal, a worked example, the spec.
- **Horizontal slicing**: writing all tests first, then all implementation. Bulk tests verify _imagined_ behavior: you test the _shape_ of things rather than user-facing behavior, the tests go insensitive to real changes, and you commit to test structure before understanding the implementation. Work in **vertical slices** instead: one test → one implementation → repeat, each test a **tracer bullet** that responds to what the last cycle taught you.

## Rules of the loop

- **Red before green.** Write the failing test first, then only enough code to pass it. Don't anticipate future tests or add speculative features.
- **One slice at a time.** One seam, one test, one minimal implementation per cycle.
- **Refactoring is not part of the loop.** It belongs to the review stage (see the `code-review` skill), not the red → green implementation cycle.

---

# Implement

## Implementation Workflow

Implement the work described by the user in the spec or tickets.

Use TDD (the red → green loop above) where possible, at pre-agreed seams.

### Process

1. **Read the spec/tickets.** Understand the full scope before writing any code.
2. **Identify seams.** Propose the seams you'll test at. Get user confirmation.
3. **Work in vertical slices.** For each slice:
   - Write the failing test (red)
   - Write the minimal code to pass (green)
   - Move to the next slice
4. **Run typechecking regularly**, single test files regularly, and the full test suite once at the end.
5. **Once done**, use the `code-review` skill to review the work.
6. **Commit your work** to the current branch.

### Rules

- Follow the TDD anti-patterns list above — avoid implementation-coupled, tautological, and horizontally-sliced tests.
- Use the project's domain glossary vocabulary.
- Respect existing ADRs.
- Don't gold-plate: implement what the spec asks for, nothing more.

---

# Reference: Testing Examples

## Good Test Examples

```javascript
// ✅ GOOD: Tests behavior through the public interface
test("user can add item to cart", () => {
  const cart = createCart();
  cart.addItem({ id: "abc", price: 10, qty: 1 });
  expect(cart.total()).toBe(10);
  expect(cart.itemCount()).toBe(1);
});

// ✅ GOOD: Expected value is a known-good literal, not recomputed
test("discount applies to orders over $100", () => {
  const cart = createCart();
  cart.addItem({ id: "abc", price: 120, qty: 1 });
  cart.applyDiscount("SAVE10");
  expect(cart.total()).toBe(108); // 120 * 0.9 = 108, pre-calculated
});

// ✅ GOOD: Tests the edge case through the public interface
test("empty cart has zero total", () => {
  const cart = createCart();
  expect(cart.total()).toBe(0);
  expect(cart.itemCount()).toBe(0);
});
```

## Bad Test Examples

```javascript
// ❌ BAD: Implementation-coupled — tests internal state
test("cart stores items in array", () => {
  const cart = createCart();
  cart.addItem({ id: "abc", price: 10, qty: 1 });
  expect(cart._items.length).toBe(1); // reaching into internals
});

// ❌ BAD: Tautological — recomputes the expected value
test("calculates total", () => {
  const cart = createCart();
  cart.addItem({ id: "abc", price: 10, qty: 3 });
  expect(cart.total()).toBe(10 * 3); // same math as the code
});

// ❌ BAD: Mocks internal collaborators
test("applies discount", () => {
  const mockPriceCalculator = jest.fn(() => 90);
  const cart = createCart({ priceCalculator: mockPriceCalculator });
  cart.addItem({ id: "abc", price: 100, qty: 1 });
  cart.applyDiscount("SAVE10");
  expect(mockPriceCalculator).toHaveBeenCalledWith(100, "SAVE10");
});
```

---

# Reference: Mocking Guidelines

## When to Mock

Mocking is a last resort. Before reaching for a mock, ask:

1. **Can I test this through a higher seam?** If the behavior is observable through the public API, test there.
2. **Can I use a real implementation?** In-memory databases, fake file systems, and test servers are almost always better than mocks.
3. **Is the dependency truly external?** Only mock things you don't own: third-party APIs, payment processors, email services.

## When Mocking is Appropriate

- **External services** you don't control (Stripe, SendGrid, AWS)
- **Non-deterministic behavior** (current time, random numbers)
- **Slow resources** that would make the test suite unusable (network calls, large databases)

## When Mocking is NOT Appropriate

- **Internal modules** — if you're mocking your own code, the test is coupled to implementation
- **Database layers** — use an in-memory database or test database instead
- **To make a test pass** — if you need a mock to pass, the design is wrong; fix the design

## Mock Rules

1. **Mock at the boundary, not inside.** The mock should replace the outermost adapter (the HTTP client, the file system wrapper), never an internal service or helper.
2. **One mock per test, ideally.** If you need multiple mocks, you're probably testing at too low a seam.
3. **Verify behavior, not calls.** Assert on the result or side effect, not that a specific method was called with specific arguments.
4. **Keep mocks simple.** A mock that has complex setup logic is a test smell — the seam is too low.

---

# Reference: Codebase Design Vocabulary

These terms are shared vocabulary for discussing module design and testing seams:

- **Module**: a unit of code with a public interface and hidden internals. Size varies: a function, a class, a package.
- **Interface**: the public surface of a module — what callers can see and use.
- **Depth**: how much complexity a module hides behind a simple interface. Deep modules are good.
- **Seam**: the boundary where you test. Always at a public interface.
- **Adapter**: a module that translates between your domain and an external system.
- **Leverage**: the ratio of behavior tested to test code written. High-seam tests have high leverage.
- **Locality**: keeping related changes close together. Good locality means one change touches few files.
