use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount, Transfer};
use solana_program::{pubkey, pubkey::Pubkey};

declare_id!("9pQFAH6qKdWcRXme1Wg7iZN27MwbPWTBAMJtKAQZPFyH");

const ADMIN_PUBKEY: Pubkey = pubkey!("BJAqzgRko9rD3DYo93P7CjMGvpLDeCpNpWbw2ghvA6xS");

#[program]
pub mod og_vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        require_keys_eq!(ctx.accounts.admin.key(), ADMIN_PUBKEY.key(), CustomError::Unauthorized);
        msg!("Vault init success, admin: {}", ctx.accounts.admin.key());
        Ok(())
    }

    pub fn deposit(ctx: Context<TransferAccounts>, amount: u64) -> Result<()> {
        
        let transfer_instruction = Transfer {
            from: ctx.accounts.sender_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.signer.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );

        anchor_spl::token::transfer(cpi_ctx, amount)?;

        emit!(DepositEvent {
            amount, 
            payer: ctx.accounts.signer.key()
        });
        
        Ok(())
    }

    pub fn withdraw(ctx: Context<TransferAccounts>, amount: u64, order_id: u64, recipient: Pubkey) -> Result<()> {
        
        require_keys_eq!(ctx.accounts.signer.key(), ADMIN_PUBKEY.key(), CustomError::Unauthorized);

        let transfer_instruction = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.sender_token_account.to_account_info(),
            authority: ctx.accounts.token_account_owner_pda.to_account_info(),
        };

        let bump = *ctx.bumps.get("token_account_owner_pda").unwrap();
        let seeds = &[b"token_account_owner_pda".as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
            signer,
        );

        anchor_spl::token::transfer(cpi_ctx, amount)?;

        emit!(WithdrawEvent {
            amount,
            order_id,
            recipient
        });

        Ok(())
    }

}

#[event]
pub struct DepositEvent {
    pub amount: u64,
    pub payer: Pubkey
}

#[event]
pub struct WithdrawEvent {
    pub amount: u64,
    pub order_id: u64,
    pub recipient: Pubkey
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    // Derived PDAs
    /// CHECK: This PDA is used as the authority for the vault token account.
    #[account(
        init_if_needed,
        payer = admin,
        seeds = [b"token_account_owner_pda"],
        bump,
        space = 8
    )]
    token_account_owner_pda: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = admin,
        seeds = [b"token_vault", mint_of_token_being_sent.key().as_ref()],
        token::mint = mint_of_token_being_sent,
        token::authority = token_account_owner_pda,
        bump
    )]
    vault_token_account: Account<'info, TokenAccount>,

    mint_of_token_being_sent: Account<'info, Mint>,

    #[account(
        mut,
        address = ADMIN_PUBKEY
    )]
    admin: Signer<'info>,
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct TransferAccounts<'info> {
    // Derived PDAs
    /// CHECK: This PDA is used as the authority for the vault token account.
    #[account(mut,
        seeds=[b"token_account_owner_pda"],
        bump
    )]
    token_account_owner_pda: AccountInfo<'info>,

    #[account(mut,
        seeds=[b"token_vault", mint_of_token_being_sent.key().as_ref()],
        bump,
        token::mint=mint_of_token_being_sent,
        token::authority=token_account_owner_pda,
    )]
    vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    sender_token_account: Account<'info, TokenAccount>,

    mint_of_token_being_sent: Account<'info, Mint>,

    #[account(mut)]
    signer: Signer<'info>,

    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    rent: Sysvar<'info, Rent>,
}


#[error_code]
pub enum CustomError {
    #[msg("Unauthorized.")]
    Unauthorized
}