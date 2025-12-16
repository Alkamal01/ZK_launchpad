# ZK Token Demo

A Solana program implementing token minting with architectural preparation for ZK Compression (Light Protocol).

## ⚠️ Important Note on Toolchain

This project uses **Anchor 0.28.0** and **Solana 1.16.x** dependencies to ensure compatibility with the Solana BPF toolchain (rustc 1.79.0) shipped with Solana CLI 2.1.0. 

Building with newer versions (Anchor 0.30+) may fail due to `borsh` and `indexmap` crate incompatibilities with the legacy BPF compiler.

## Prerequisites

- **Solana CLI**: v2.1.0+ (Agave)
- **Anchor CLI**: v0.31.0 (or matching 0.28.0)
- **Rust**: v1.79.0
- **Node.js / Yarn**

## Setup

1. **Install Dependencies**
   ```bash
   yarn install
   ```

2. **Generate Keypair** (if not already done)
   ```bash
   solana-keygen new -o ~/.config/solana/id.json
   ```

## Build

Compile the program using the configured toolchain settings:

```bash
# Ensure you are using the Solana 2.1.0 toolchain
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Build the program
anchor build
```

## Test

Run the TypeScript test suite:

```bash
anchor test --skip-build
```

## Architecture

The program currently implements:
- **Initialize**: Sets up a global `TokenConfig` PDA.
- **Create Token Mint**: Creates a new SPL Token Mint managed by the config.
- **Mint Token**: Mints tokens to a user and creates a `MintRecord` PDA.

**Future ZK Compression Integration:**
state compression using Light Protocol is currently blocked by BPF toolchain version conflicts. The `MintRecord` structure is designed to be converted to a compressed account once toolchains align.

## Structure

- `programs/zk_token`: The Anchor program code.
- `tests/zk_token.ts`: Integration tests.
- `Anchor.toml`: Network and test configuration.
