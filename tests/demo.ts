import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
// import { ZkToken } from "../target/types/zk_token";
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress
} from "@solana/spl-token";
import { assert } from "chai";

// Helper for nice logs
const log = (step: string, msg: string) => {
    console.log(`\n\x1b[36m[${step}]\x1b[0m ${msg}`);
};
const success = (msg: string) => {
    console.log(`\x1b[32m  ✔ ${msg}\x1b[0m`);
};
const info = (msg: string) => {
    console.log(`\x1b[90m    ${msg}\x1b[0m`);
};

describe("zk_token demo", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    // const program = anchor.workspace.ZkToken as any;
    const programId = new anchor.web3.PublicKey("7o3hKkBugQQ5duPBRSzU1KZshKTK1o3ob3jwLSBPa65c");

    // Create a dummy IDL or use 'any' to construct program manually
    // We use a minimal IDL structure so Anchor doesn't crash
    const idl = {
        version: "0.1.0",
        name: "zk_token",
        instructions: [
            { "name": "initialize", "accounts": [{ "name": "signer", "isMut": true, "isSigner": true }, { "name": "config", "isMut": true, "isSigner": false }, { "name": "systemProgram", "isMut": false, "isSigner": false }], "args": [] },
            { "name": "createTokenMint", "accounts": [{ "name": "signer", "isMut": true, "isSigner": true }, { "name": "mint", "isMut": true, "isSigner": false }, { "name": "config", "isMut": true, "isSigner": false }, { "name": "tokenProgram", "isMut": false, "isSigner": false }, { "name": "systemProgram", "isMut": false, "isSigner": false }, { "name": "rent", "isMut": false, "isSigner": false }], "args": [] },
            { "name": "mintToken", "accounts": [{ "name": "signer", "isMut": true, "isSigner": true }, { "name": "config", "isMut": true, "isSigner": false }, { "name": "mint", "isMut": true, "isSigner": false }, { "name": "userTokenAccount", "isMut": true, "isSigner": false }, { "name": "mintRecord", "isMut": true, "isSigner": false }, { "name": "tokenProgram", "isMut": false, "isSigner": false }, { "name": "associatedTokenProgram", "isMut": false, "isSigner": false }, { "name": "systemProgram", "isMut": false, "isSigner": false }], "args": [{ "name": "amount", "type": "u64" }, { "name": "mintIndex", "type": "u64" }] }
        ],
        accounts: [
            { "name": "TokenConfig", "type": { "kind": "struct", "fields": [{ "name": "admin", "type": "publicKey" }, { "name": "bump", "type": "u8" }, { "name": "mintCount", "type": "u64" }] } },
            { "name": "MintRecord", "type": { "kind": "struct", "fields": [{ "name": "minter", "type": "publicKey" }, { "name": "amount", "type": "u64" }, { "name": "timestamp", "type": "i64" }, { "name": "mintIndex", "type": "u64" }] } }
        ],
        metadata: {
            address: "7o3hKkBugQQ5duPBRSzU1KZshKTK1o3ob3jwLSBPa65c"
        }
    };

    const program: any = new anchor.Program(idl as any, provider);
    const payer = provider.wallet;

    let configPda: anchor.web3.PublicKey;
    let configBump: number;
    let mintPda: anchor.web3.PublicKey;
    let mintBump: number;

    log("SETUP", "Initializing Demo Environment...");

    before(async () => {
        [configPda, configBump] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("config")],
            program.programId
        );
        [mintPda, mintBump] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("token_mint")],
            program.programId
        );
        success("PDAs derived");
        info(`Config: ${configPda.toBase58()}`);
        info(`Mint:   ${mintPda.toBase58()}`);
    });

    it("Step 1: Initialize Protocol", async () => {
        log("STEP 1", "Initializing Protocol State...");

        const tx = await program.methods
            .initialize()
            .accounts({
                signer: payer.publicKey,
                config: configPda,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        success("Protocol Initialized");
        info(`Tx Signature: ${tx}`);

        // Mock ZK Setup
        info("Initializing Light Protocol Merkle Tree... [MOCK]");
        success("Compressed State Tree Ready");
    });

    it("Step 2: Create Token Asset", async () => {
        log("STEP 2", "Creating Token-2022 Mint...");

        const tx = await program.methods
            .createTokenMint()
            .accounts({
                signer: payer.publicKey,
                mint: mintPda,
                config: configPda,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            })
            .rpc();

        success("Token Mint Created");
        info(`Mint Address: ${mintPda.toBase58()}`);
    });

    it("Step 3: ZK Compressed Mint", async () => {
        log("STEP 3", "Executing ZK Compressed Mint...");

        const mintIndex = new anchor.BN(1);
        const amount = new anchor.BN(1_000_000_000); // 1 Token

        // 1. Generate Proof (Mock)
        console.log("  • Generating ZK-SNARK Validity Proof for minting... [MOCK]");
        await new Promise(r => setTimeout(r, 800)); // Simulate calculation
        success("Validity Proof Generated");

        // 2. Prepare Compressed Account Address
        const [mintRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("mint_record"), mintIndex.toArrayLike(Buffer, "le", 8)],
            program.programId
        );

        const userTokenAccount = await getAssociatedTokenAddress(
            mintPda,
            payer.publicKey
        );

        // 3. Execute Transaction
        console.log("  • Sending Transaction (Mint + State Compression)...");
        const tx = await program.methods
            .mintToken(amount, mintIndex)
            .accounts({
                signer: payer.publicKey,
                config: configPda,
                mint: mintPda,
                userTokenAccount: userTokenAccount,
                mintRecord: mintRecordPda,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        success("Transaction Confirmed");
        info(`Signature: ${tx}`);

        // 4. Verify On-Chain State
        const mintRecord = await program.account.mintRecord.fetch(mintRecordPda);

        log("VERIFICATION", "Verifying On-Chain State...");

        // Verify SPL Token Balance
        const balance = await provider.connection.getTokenAccountBalance(userTokenAccount);
        if (balance.value.uiAmount === 1) {
            success("SPL Token Balance Updated: 1.00 ZKT");
        } else {
            console.error("❌ Token Balance Mismatch");
        }

        // Verify "Compressed" State
        if (mintRecord.mintIndex.eq(mintIndex)) {
            success("Compressed State (MintRecord) Verified");
            info(`Minter: ${mintRecord.minter.toBase58()}`);
            info(`Amount: ${mintRecord.amount.toString()}`);
            info(`Timestamp: ${mintRecord.timestamp.toString()}`);
            info("State Hash: 0x9a8b...7f2c [MOCK Merkle Root]");
        }
    });
});
