# 🚀 ZKsync Easy On Ramp

[zksync-easy-onramp on NPM](https://www.npmjs.com/package/zksync-easy-onramp)

An easy way to on ramp into ZKsync. This is the monorepo for the zksync-easy-onramp SDK.
It includes the NPM package, the API server and a demo.

## 🏁 Getting started

Follow these instructions to set up and run the project locally to develop.

### Prerequisites

- Node LTS and NPM
- Postgres database

From the root of the project:

1. Install packages with `npm install`.
2. Setup `.env` in `api` and `server` workspaces using
    the `.env.example` files.
3. Create a database `easy-onramp` in Postgres.
4. Run `npm run setup:api` to build the api project
    and run migrations for the database.
5. To start developing, run `npm run dev`.

## 📦 Usage

To use this SDK in your own project, check out the
[documentation](https://docs.zksync.io/zksync-era/tooling/zksync-easy-onramp) on ZKsync Docs.

## 🌟 Demo

You can see a demo that provides an example of implementing the zksync-easy-onramp NPM package
into a Vue app in this repo under
[`apps/demo`](https://github.com/matter-labs/zksync-easy-onramp/blob/main/apps/demo).

To run the Demo app, follow the Getting started section above but do not run the `npm run dev`
command.
Instead run `npm run dev:demo` to start up the Demo app.
