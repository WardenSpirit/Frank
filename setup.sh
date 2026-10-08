#!/usr/bin/env bash
# Prepares a fresh clone for running: ensures Node.js (system one if new enough,
# otherwise a pinned version downloaded into .node/) and installs dependencies.
# Safe to run repeatedly.
set -euo pipefail

NODE_VERSION="24.21.0"   # downloaded into .node/ when no suitable system Node.js exists
NODE_MIN="16.11.0"       # oldest Node.js the game is known to work with

cd "$(dirname "$0")"
LOCAL_NODE_DIR="$PWD/.node"

log() { printf '\033[1m==> %s\033[0m\n' "$*"; }
die() { printf '\033[31mError: %s\033[0m\n' "$*" >&2; exit 1; }

# Succeeds when the given node binary exists and is at least NODE_MIN.
node_ok() {
    [ -x "$1" ] || return 1
    "$1" -e '
        const v = s => s.split(".").map(Number);
        const [a, b] = [v(process.versions.node), v(process.argv[1])];
        for (let i = 0; i < 3; i++) if (a[i] !== b[i]) process.exit(a[i] > b[i] ? 0 : 1);
    ' "$NODE_MIN" 2>/dev/null
}

download() {
    if command -v curl >/dev/null; then curl -fsSL -o "$2" "$1"
    elif command -v wget >/dev/null; then wget -qO "$2" "$1"
    else die "curl or wget is required to download Node.js"
    fi
}

sha256() {
    if command -v sha256sum >/dev/null; then sha256sum "$1" | cut -d' ' -f1
    else shasum -a 256 "$1" | cut -d' ' -f1
    fi
}

install_local_node() {
    local os arch
    case "$(uname -s)" in
        Linux)  os=linux ;;
        Darwin) os=darwin ;;
        *) die "unsupported OS $(uname -s), install Node.js >= $NODE_MIN manually" ;;
    esac
    case "$(uname -m)" in
        x86_64|amd64)  arch=x64 ;;
        aarch64|arm64) arch=arm64 ;;
        *) die "unsupported CPU $(uname -m), install Node.js >= $NODE_MIN manually" ;;
    esac

    local name="node-v$NODE_VERSION-$os-$arch"
    local base="https://nodejs.org/dist/v$NODE_VERSION"
    tmp="$(mktemp -d)"   # global, the EXIT trap runs after this function returns
    trap 'rm -rf "$tmp"' EXIT

    log "Downloading Node.js v$NODE_VERSION ($os-$arch) into .node/"
    download "$base/$name.tar.gz" "$tmp/$name.tar.gz"
    download "$base/SHASUMS256.txt" "$tmp/SHASUMS256.txt"

    local expected
    expected="$(awk -v f="$name.tar.gz" '$2 == f { print $1 }' "$tmp/SHASUMS256.txt")"
    [ -n "$expected" ] || die "no checksum for $name.tar.gz"
    [ "$(sha256 "$tmp/$name.tar.gz")" = "$expected" ] || die "checksum mismatch for $name.tar.gz"

    # Extract next to the target and swap, so an interrupted run never leaves a broken .node/
    mkdir "$tmp/node"
    tar -xzf "$tmp/$name.tar.gz" -C "$tmp/node" --strip-components=1
    rm -rf "$LOCAL_NODE_DIR"
    mv "$tmp/node" "$LOCAL_NODE_DIR"
}

# 1. Node.js: prefer an existing local install, then the system one, then download
if node_ok "$LOCAL_NODE_DIR/bin/node"; then
    NODE_BIN_DIR="$LOCAL_NODE_DIR/bin"
elif command -v node >/dev/null && node_ok "$(command -v node)"; then
    NODE_BIN_DIR="$(dirname "$(command -v node)")"
else
    install_local_node
    NODE_BIN_DIR="$LOCAL_NODE_DIR/bin"
fi
# npm is a `#!/usr/bin/env node` script, so the chosen node must come first on PATH
export PATH="$NODE_BIN_DIR:$PATH"
log "Using Node.js $(node --version) from $NODE_BIN_DIR"

# 2. Dependencies, exactly as pinned in package-lock.json
log "Installing dependencies"
npm ci --no-audit --no-fund

if [ "$NODE_BIN_DIR" = "$LOCAL_NODE_DIR/bin" ]; then
    start_cmd=".node/bin/node ."
else
    start_cmd="node ."
fi
log "Done. Start the server with: $start_cmd"
log "Then open http://localhost:3000/"
