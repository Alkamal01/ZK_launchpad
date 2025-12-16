use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Mint, Token, TokenAccount},
    associated_token::AssociatedToken,
};

declare_id!("7o3hKkBugQQ5duPBRSzU1KZshKTK1o3ob3jwLSBPa65c");

#[program]
pub mod zk_token {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.signer.key();
        config.bump = *ctx.bumps.get("config").unwrap();
        config.mint_count = 0;
        Ok(())
    }

    pub fn create_token_mint(_ctx: Context<CreateTokenMint>) -> Result<()> {
        Ok(())
    }

    pub fn mint_token(ctx: Context<MintToken>, amount: u64, mint_index: u64) -> Result<()> {
        let config = &mut ctx.accounts.config;
        
        require!(mint_index == config.mint_count + 1, ErrorCode::InvalidMintIndex);
        config.mint_count = mint_index;

        let bump = config.bump;
        let config_info = ctx.accounts.config.to_account_info();
        
        let seeds = &[&b"config"[..], &[bump][..]];
        let signer_seeds = &[&seeds[..]];

        anchor_spl::token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: config_info,
                },
                signer_seeds,
            ),
            amount,
        )?;

        let record = &mut ctx.accounts.mint_record;
        record.minter = ctx.accounts.signer.key();
        record.amount = amount;
        record.timestamp = Clock::get()?.unix_timestamp;
        record.mint_index = mint_index;

        Ok(())
    }
}

// TokenConfig: 32 (admin) + 1 (bump) + 8 (mint_count) = 41 bytes
const TOKEN_CONFIG_SIZE: usize = 8 + 32 + 1 + 8;
// MintRecord: 32 (minter) + 8 (amount) + 8 (timestamp) + 8 (mint_index) = 56 bytes
const MINT_RECORD_SIZE: usize = 8 + 32 + 8 + 8 + 8;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = TOKEN_CONFIG_SIZE,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, TokenConfig>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateTokenMint<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        mint::decimals = 9,
        mint::authority = config,
        seeds = [b"token_mint"],
        bump
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, TokenConfig>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(amount: u64, mint_index: u64)]
pub struct MintToken<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, TokenConfig>,

    #[account(
        mut,
        seeds = [b"token_mint"],
        bump
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = signer
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = signer,
        space = MINT_RECORD_SIZE,
        seeds = [b"mint_record", &mint_index.to_le_bytes()[..]],
        bump
    )]
    pub mint_record: Account<'info, MintRecord>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct TokenConfig {
    pub admin: Pubkey,
    pub bump: u8,
    pub mint_count: u64,
}

#[account]
pub struct MintRecord {
    pub minter: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
    pub mint_index: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid mint index. Must be config.mint_count + 1")]
    InvalidMintIndex,
}
