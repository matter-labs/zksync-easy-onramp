# Writing Commit Messages

This project follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
standard to ensure clear, consistent, and structured commit messages.

## Commit Message Format

A commit message should follow this format:

```txt
<type>(<optional scope>): <description>
```

### Example

```txt
feat(auth): add support for two-factor authentication
fix(ui): resolve button alignment issue on mobile
```

## Enforcing Commit Conventions

A GitHub workflow is set up to check PR titles to ensure they adhere
to the Conventional Commits format.
This helps maintain a clean commit history and enables automated changelog generation.

For the full commit linting rules, see:
[@commitlint/config-conventional](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional).

## Commonly Used Commit Types

Below is a list of the most frequently used commit types in this project:

- **feat** – Introduces a new feature
- **fix** – Fixes a bug
- **docs** – Updates or improves documentation
- **ci** – Changes related to CI/CD workflows
- **chore** – Routine maintenance or non-functional changes

Following this convention ensures that commits are meaningful and easy to track in the project's history.
