# Releases and deployment

## Releases

Use `MAJOR.MINOR.PATCH`: breaking changes, new features, fixes.

1. Update the version in `package.json` and keep `package-lock.json` consistent in an MR.
2. Merge after review and checks.
3. Tag the checked commit on `master`, for example `v2.1.0`, and push the tag to GitLab. The tag deploys the commit, see [Deployment](#deployment).
4. Create a GitLab Release with the changes and resolved issues.

## Deployment

The game runs on a free [Render](https://render.com/) web service at [https://frank-kps0.onrender.com/](https://frank-kps0.onrender.com/). Render cannot pull from the faculty GitLab without access to every other project, so it builds from the public GitHub repository [WardenSpirit/Frank](https://github.com/WardenSpirit/Frank). Do not push to it by hand: each deployment overwrites its `master` with the deployed commit.

### How a release is deployed

Pushing a `vMAJOR.MINOR.PATCH` tag to GitLab starts the `deploy` job defined in [.gitlab-ci.yml](.gitlab-ci.yml). Other tags and untagged commits start no pipeline. The job:

1. fails unless the tagged commit is on `master`, the tag matches `version` in `package.json`, and `npm test` passes,
2. force-pushes the tagged commit to GitHub `master`,
3. calls the Render deploy hook with the commit SHA, so Render builds and starts exactly that commit.

The job succeeds once Render accepts the deploy, not when the new version is live. If the job fails after the push to GitHub, retry the job in GitLab: its second push of the same commit to GitHub changes nothing.

### One-time setup

In GitLab, as a Maintainer:

- Settings → Repository → Protected tags: protect `v*`, allowed to create: Maintainers. Protected variables are passed only to pipelines of protected tags.
- Settings → CI/CD → Variables, both Protected and Masked, with *Expand variable reference* cleared, otherwise GitLab cannot mask the `?` in the deploy hook URL:
  - `RENDER_DEPLOY_HOOK_URL`: the URL from Render → service → Settings → Deploy Hook.
  - `GITHUB_PUSH_TOKEN`: a fine-grained personal access token of the GitHub repository owner, limited to `WardenSpirit/Frank` with the *Contents: Read and write* permission. Replace it before it expires.

Render service settings:

| Setting | Value |
|---|---|
| Repository and branch | `WardenSpirit/Frank`, `master` |
| Build command | `npm ci` |
| Start command | `node .` |
| Auto-Deploy | Off; the `deploy` job triggers deploys |
| Environment variables | `LISTEN_HOST=0.0.0.0`; Render sets `PORT` |

Without `LISTEN_HOST=0.0.0.0`, the server listens only on `127.0.0.1` and Render cannot reach it.

### After a release

1. In GitLab → Build → Pipelines, check that the `deploy` job of the tag passed.
2. After the first release only: the tag pipeline has created the `production` resource group. Set it to run deploy jobs oldest pipeline first, otherwise two tags pushed close together can deploy in the wrong order. GitLab sets this only through the API:

   ```sh
   glab api --hostname gitlab.fel.cvut.cz --method PUT projects/muchaja3%2Ffrank/resource_groups/production -f process_mode=oldest_first
   ```

   Then remove this step 2.

3. In the Render dashboard → Events, wait until the deploy of the tagged commit is live. `git rev-list -n 1 v2.1.0` prints the commit the tag points to.
4. Open the public URL; a sleeping free instance takes about a minute to start. Check two tabs, movement, state updates, and disconnecting a player.

### Manual deployment and rollback

- To roll back, open GitLab → Operate → Environments → `production` and roll back to an earlier deployment, or retry the `deploy` job in the pipeline of an earlier tag. Only tags of commits that contain `.gitlab-ci.yml` have such a pipeline.
- To deploy a commit without the pipeline, push it to GitHub `master`, then trigger its deploy in the Render dashboard → Manual Deploy → Deploy a specific commit:

  ```sh
  git push --force git@github.com:WardenSpirit/Frank.git <commit-sha>:refs/heads/master
  ```

- Render's own rollback in the dashboard reaches only the two most recent previous deploys on the free plan and does not change GitHub `master`.
