# Code sandbox

Student code **never** runs in the API process:

```
API ─▶ BullMQ queue ─▶ worker ─▶ sandbox driver ─▶ result ─▶ API ─▶ DB
```

`POST /code/run` and build-task run/submit enqueue a job and wait (up to 20s) for the worker's result.

## Drivers (`SANDBOX_DRIVER`)

### `docker` (production)

Each run starts a brand-new container that is removed afterwards:

- `--network none`
- `--read-only` root filesystem, with a 16MB `noexec` tmpfs at `/tmp`
- `--user 65534:65534` (nobody), `--cap-drop ALL`, `--security-opt no-new-privileges`
- `--memory 128m --memory-swap 128m`, `--cpus 0.5`, `--pids-limit 64`
- The code arrives on stdin, so nothing from the host is mounted
- A hard timeout (4s by default, plus container start-up); the container is force-removed on timeout
- Output is capped at 64KB

Images come from `SANDBOX_JS_IMAGE` and `SANDBOX_PY_IMAGE` (`node:22-alpine` and `python:3.12-alpine` by default). Pre-pull them on worker hosts.

**Run the worker on dedicated, isolated hosts.** Access to the Docker socket is equivalent to root on that host. For stronger isolation, run the containers under gVisor (`--runtime=runsc`) or use Firecracker microVMs.

### `process` (local development only)

The code runs as a child process with an empty temp directory, a clean environment and a hard kill on timeout. Node runs with the permission model (`--permission`), which blocks file writes, child processes and workers. Python has no equivalent restriction. **This is not a security boundary.** Never use it in production.

## Grading

`sandbox/harness.ts` wraps the student's code with a harness that calls the required function for each test case and compares results by canonical JSON (object key order is ignored, and `5.0` equals `5`). Results are printed on a line prefixed with a random nonce passed through an environment variable (and removed before the student's code runs), so `console.log` output can't forge a pass. Hidden test inputs and expected values never reach the browser.

## Content integrity

`npm run test:content` runs every code sample in the seed content. CI runs it on every change, and publishing a topic in the CMS re-runs that topic's samples: a broken sample blocks publishing unless a Super Admin overrides it.
