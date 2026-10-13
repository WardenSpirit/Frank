# Contributing

Create an issue for each task and a merge request (MR) for each change to `master`.

## Issues

Title: `<type>: <short goal>`, for example `docs: document contribution workflow`. Use the [commit types](#branches-and-commits) below.

Use this issue template when creating a new issue:
[Task.md](.gitlab/issue_templates/Task.md)

The issue author fills in the description and proposes a type label, assignee, and milestone. For type labels, use `feature`, `bug`, `test`, `docs`, `design` or `build`. For priority labels, use `P:low`, `P:medium`, `P:high`. Split larger work into smaller issues with their own assignees.

The assignee owns implementation, tests, documentation, and status updates. Keep the project's issue board up to date by moving issue cards between columns as work progresses:

| State | When to use it |
|---|---|
| Open, no workflow label | Waiting for triage |
| `ready` | Scope, acceptance criteria, assignee, and estimate are set |
| `in-progress` | Work has started |
| `review` | An MR is ready for review |
| Closed | The change is merged and acceptance criteria are met |

Estimate before starting and log active work on the issue each day. GitLab comment commands:

```text
/estimate 2h
/spend 45m
```

You can optionally add a short note about the work done. Log time once, on the issue.

## Milestones

Name: `CP<number> - <goal>`, for example `CP1 - development workflow`.

Set a start date and due date, then assign the included issues and MRs. Use this description:

```markdown
## Deliverables
- #<issue-id>: <expected output>

## Done when
- [ ] Required issues are closed and related MRs are merged.
- [ ] Relevant checks pass and their results are recorded.
- [ ] The team has reviewed the deliverables.
```

Close the milestone after its required deliverables are accepted. Move deferred work to another milestone and explain the change on the issue.

## Branches and commits

Start from the latest `master`. Merge back through an MR; do not push directly to `master`.

Branch: `<issue-id>-<short-kebab-case-description>`.

Example: `1-add-workflow-and-guidelines`.

Commit subject: `<type>: <short description> (#<issue-id>)`.

```text
docs: document contribution workflow (#1)
```

Write the subject in English, start the description with a verb such as `add`, `fix`, or `remove`, and keep it within 72 characters. Use the body to explain why, when the subject is not enough.

| Type | Use for |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `test` | Tests |
| `docs` | Documentation |
| `refactor` | Code changes without changing behavior |
| `build` | Dependencies or build tools |
| `chore` | Other maintenance |

Where it doesn’t take much extra effort, keep one logical change per commit and let the reviewer squash them. Commit the files needed to run, test, and understand it.

## Merge requests and review

Use the same title format as commits. Include every issue the MR addresses; use `Closes #<issue-id>` for issues it completes.

```markdown
## Changes
- <what changed>

## Issues
Closes #<issue-id>

## Checks
- Command or manual steps: <...>
- Result: <...>

## Checklist
- [ ] Acceptance criteria met
- [ ] Relevant tests or manual checks completed
- [ ] Documentation updated where needed
```

For UI changes, add a screenshot when it helps explain the result. Request one teammate as reviewer. The reviewer checks behavior, test results, readability, and whether the change matches the issue.

Require one approval from someone other than the author. Reviewers should reply by the next working day and aim to review within two working days. If a reviewer is unavailable, they should tell the author so another teammate can review.

The author replies to each thread either with the fix or a reason to keep the code as is. After approval, the author or the reviewer merges the MR with squash enabled. Use squash merge after approval and successful checks; follow stricter GitLab project settings where applicable.

## Code style and testing

Follow the surrounding style: four-space indentation and semicolons. Avoid reformatting unrelated code.

With Node.js 16.11 or newer:

```sh
npm ci
npm start
```

Linux/macOS users can also install dependencies with `./setup.sh`.

Open [http://localhost:3000/](http://localhost:3000/). Check the changed behavior; for multiplayer changes, also check two tabs, movement, state updates, and disconnecting a player. Record steps and results in the MR.

When adding automated tests:

- Use Arrange–Act–Assert: prepare inputs, perform the action, check the expected result.
- Cover changed rules with unit tests and bug fixes with regression tests.
- Test WebSocket behavior against a real server; check key user flows in a browser.
- Use deterministic data and clean up sockets and timers after each test.
- Add the runner and an `npm test` script so teammates can run the suite.

## Releases

No release automation is configured. Use `MAJOR.MINOR.PATCH`: breaking changes, new features, fixes.

1. Update the version in `package.json` and keep `package-lock.json` consistent in an MR.
2. Merge after review and checks.
3. Tag the checked commit on `master`, for example `v2.1.0`.
4. Create a GitLab Release with the changes and resolved issues.

Document any deployment procedure separately before using it.
