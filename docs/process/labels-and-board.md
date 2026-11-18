# Labels and project board

How issues are labelled and how a ticket moves across the project board.
Issues are created from the forms in `.github/ISSUE_TEMPLATE/` and delivered through pull requests that use `.github/pull_request_template.md`.

## Issue hierarchy

```text
Epic  >  Feature  >  User story  >  Pull request (Closes #n)
```

- **Epic**: the top-level initiative (vision, context, scope, guardrails). There is one: #1.
- **Feature**: a coherent group of user stories, a sub-issue of the epic.
- **User story**: the smallest independently shippable slice, a sub-issue of a feature. It has a user story, acceptance criteria (each one becomes a test first) and a Definition of done. One story is delivered by one pull request.
- **Bug**: something that does not work as specified. Link the story it regresses.

Link children as GitHub sub-issues and list them as a task list in the parent body.
Issue forms render each field as a `###` heading; the content is the same as in the existing backlog.

## Labels

Every issue carries exactly one type label and one `area:*` label. The `mvp` label is optional.
The form applies the type label automatically; add the `area:*` label (and `mvp`) after creating the issue, as GitHub issue forms cannot set labels from a dropdown.

### Type (one per issue)

| Label        | Used for                               | Form                                    |
| ------------ | -------------------------------------- | --------------------------------------- |
| `epic`       | Top-level initiative                   | `.github/ISSUE_TEMPLATE/epic.yml`       |
| `feature`    | Coherent group of user stories         | `.github/ISSUE_TEMPLATE/feature.yml`    |
| `user-story` | Smallest independently shippable slice | `.github/ISSUE_TEMPLATE/user-story.yml` |
| `bug`        | Something does not work as specified   | `.github/ISSUE_TEMPLATE/bug.yml`        |

### Area (one per feature, story or bug)

| Label              | Scope                                 |
| ------------------ | ------------------------------------- |
| `area:foundation`  | Project setup, tooling, AIDD workflow |
| `area:ingest`      | CSV upload and parsing                |
| `area:catalog`     | Parameter catalog enrichment          |
| `area:charts`      | Chart rendering                       |
| `area:selection`   | Parameter selection and grouping      |
| `area:interaction` | Zoom, pan, cursor, analysis           |
| `area:scale`       | Axes and scales                       |
| `area:nfr`         | Performance, a11y, privacy, theming   |
| `area:session`     | Persistence, export, sharing          |

### Priority

| Label | Meaning                          |
| ----- | -------------------------------- |
| `mvp` | Part of the first usable release |

Everything without `mvp` is a candidate for after the first release.

### Other labels

GitHub's default labels (`enhancement`, `documentation`, `duplicate`, `invalid`, `question`, `wontfix`, `help wanted`, `good first issue`) and `accessibility` exist on the repository but are not part of the taxonomy.
Use `area:nfr` and the story text for accessibility work instead.

## Project board status flow

The GitHub project (number 7, owner `AnthoFio`) has a single-select field `Status`:

```text
Backlog > Ready > In progress > In review > Done
```

| Status        | Meaning                                                                              | Who moves it, and when                                                            |
| ------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `Backlog`     | Created, not yet refined or not yet next up                                          | The maintainer, on creation. Default for new issues.                              |
| `Ready`       | Acceptance criteria are written and testable and nothing blocks it                   | The maintainer, once the story meets the definition of ready.                     |
| `In progress` | Someone is working on it                                                             | The developer, when taking the ticket. The reviewer or QA, when sending it back.  |
| `In review`   | Pull request open and green locally (`npm run check`, `npm run build`)               | The developer, right after opening the PR. The reviewer leaves it when approving. |
| `Done`        | QA verified every acceptance criterion and Definition of done item and merged the PR | The QA agent, after the squash merge. The issue closes through `Closes #n`.       |

Rules:

- The agent that takes over a ticket or hands it on sets the status itself; nobody else moves it.
- A reviewer that requests changes sets `In progress`; the developer sets `In review` again after fixing.
- QA that finds a failing criterion sets `In progress` and does not merge.
- Only the QA agent merges, and only when every criterion passes.

## Pull requests

- Branch `story/<issue-number>-<slug>` from the latest `origin/main`; PR title `<imperative summary> (#<n>)`.
- The PR body starts with `Closes #<n>` (see `.github/pull_request_template.md`), then lists how each acceptance criterion is met, the test evidence, screenshots for UI changes and the Definition of done checklist.
- `npm run check` and `npm run build` must pass before the PR is opened.

## Keeping the templates healthy

GitHub silently drops an invalid issue form instead of reporting an error.
`src/test/github-templates.test.ts` (run by `npm run check`) parses every `.github/ISSUE_TEMPLATE/*.yml` and asserts the required keys, ids, dropdown options and that the labels and status flow documented here match the forms.
Change a form, this document or the test together.
