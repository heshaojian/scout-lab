## Summary

Describe the user-visible change and why it is needed.

## Verification

- [ ] I added or updated the nearest automated tests for every behavior change.
- [ ] I updated `tests/acceptance/browser-matrix.md` when a control, workflow, source contract, theme, or responsive behavior changed.
- [ ] `npm run check` passes.
- [ ] `npm run test:coverage` passes with the 80% coverage gate.
- [ ] `npm run test:live` passes, or temporary upstream failures are documented with fixture tests still passing.
- [ ] I completed the affected real-browser acceptance cases and checked the console.
- [ ] I reviewed manifest permission changes and `npm audit --omit=dev --audit-level=high` has no high-severity findings.
