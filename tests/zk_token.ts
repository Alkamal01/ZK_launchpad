import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ZkToken } from "../target/types/zk_token";
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress
} from "@solana/spl-token";
import { expect } from "chai";

describe("zk_token", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.ZkToken as Program<ZkToken>;
    const payer = provider.wallet;

    let configPda: anchor.web3.PublicKey;
    let configBump: number;
    let mintPda: anchor.web3.PublicKey;
    let mintBump: number;

    before(async () => {
        [configPda, configBump] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("config")],
            program.programId
        );

        [mintPda, mintBump] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("token_mint")],
            program.programId
        );
    });

    it("Initializes the config", async () => {
        const tx = await program.methods
            .initialize()
            .accounts({
                signer: payer.publicKey,
                config: configPda,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        console.log("Initialize tx:", tx);

        const config = await program.account.tokenConfig.fetch(configPda);
        expect(config.admin.toString()).to.equal(payer.publicKey.toString());
        expect(config.mintCount.toNumber()).to.equal(0);
    });

    it("Creates the token mint", async () => {
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

        console.log("Create token mint tx:", tx);
    });

    it("Mints tokens and creates mint record", async () => {
        const mintIndex = new anchor.BN(1);
        const amount = new anchor.BN(1_000_000_000);

        const [mintRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("mint_record"), mintIndex.toArrayLike(Buffer, "le", 8)],
            program.programId
        );

        const userTokenAccount = await getAssociatedTokenAddress(
            mintPda,
            payer.publicKey
        );

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

        console.log("Mint token tx:", tx);

        const mintRecord = await program.account.mintRecord.fetch(mintRecordPda);
        expect(mintRecord.minter.toString()).to.equal(payer.publicKey.toString());
        expect(mintRecord.amount.toNumber()).to.equal(1_000_000_000);
        expect(mintRecord.mintIndex.toNumber()).to.equal(1);

        const config = await program.account.tokenConfig.fetch(configPda);
        expect(config.mintCount.toNumber()).to.equal(1);
    });

    it("Mints more tokens with incremented index", async () => {
        const mintIndex = new anchor.BN(2);
        const amount = new anchor.BN(500_000_000);

        const [mintRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("mint_record"), mintIndex.toArrayLike(Buffer, "le", 8)],
            program.programId
        );

        const userTokenAccount = await getAssociatedTokenAddress(
            mintPda,
            payer.publicKey
        );

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

        console.log("Second mint tx:", tx);

        const config = await program.account.tokenConfig.fetch(configPda);
        expect(config.mintCount.toNumber()).to.equal(2);
    });
});
