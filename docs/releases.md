# Releasing `zksync-easy-onramp` SDK

The [`Changesets`](https://github.com/changesets/changesets) tool is used to manage versioning,
changelogs, and publishing to NPM for the `zksync-easy-onramp` SDK.
The release process is mostly automated, with only a few manual approval steps required.

## Managing Version Updates

Version changes are handled using the Changesets CLI.
Any PR that introduces changes requiring a version update must include a changeset.
This can be generated using the following command:

```sh
npm run prepare-release
```

This script creates a changeset entry and updates relevant versioning files.
The generated changeset should be committed along with the PR.

To ensure consistency, a Changesets bot is set up in the repository to check PRs
and remind maintainers to include a version update when necessary.

## Packaging and Publishing to NPM

This step is handled only by the maintainers of the repo.

Once a PR containing a changeset is merged into the `main` branch,
the Changesets bot will automatically open a new release PR.
This PR handles version updates and prepares the package for publishing.

To complete the release process:

1. **Review and approve** the release PR created by the bot.
2. **Merge** the release PR into `main`.

Once merged, the following steps will execute automatically:

- The Changesets CLI runs `changeset version` to update package versions.
- The package.json `publish-package` script is triggered to build and publish the SDK to NPM.

If the process completes successfully, the new version of the package will be available on NPM.
