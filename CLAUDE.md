
# Coding Standards

- Keep Code Simple
  - avoid deep recursion, call stacks, and nesting
  - write highly readable code, using descriptive variable names and clarifying comments
  - Always write the simplest code to achieve something, do not over engineer or plan for
    the future

# Schema & Data Management

- Backwards Compatibility is CRITICAL
  - All schema changes MUST be backwards compatible
  - New fields should be optional with sensible defaults
  - Never remove or rename existing fields
  - Old game files and saved games must continue to work
  - Parser should handle missing optional fields gracefully
  - When adding features, check that existing data still loads correctly
  - Test with old game formats before committing changes


