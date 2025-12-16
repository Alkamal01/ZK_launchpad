use anchor_lang::prelude::*;

declare_id!("12wgpV3zD3UvkhKSCWZZr2Qup15y9qBfJ6iNyaeA4Zy2");

#[program]
pub mod zk_token_demo {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
