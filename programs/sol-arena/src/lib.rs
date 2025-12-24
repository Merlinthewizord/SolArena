use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("SoLArenaTournament11111111111111111111111111");

#[program]
pub mod sol_arena {
    use super::*;

    pub fn create_tournament(
        ctx: Context<CreateTournament>,
        tournament_id: String,
        entry_fee: u64,
    ) -> Result<()> {
        let tournament = &mut ctx.accounts.tournament;
        tournament.authority = ctx.accounts.authority.key();
        tournament.tournament_id = tournament_id;
        tournament.entry_fee = entry_fee;
        tournament.total_pool = 0;
        tournament.participants = Vec::new();
        tournament.is_finalized = false;
        tournament.bump = ctx.bumps.tournament;
        Ok(())
    }

    pub fn register_for_tournament(
        ctx: Context<RegisterForTournament>,
        tournament_id: String,
    ) -> Result<()> {
        let tournament = &mut ctx.accounts.tournament;
        
        require!(!tournament.is_finalized, ErrorCode::TournamentFinalized);
        require!(
            !tournament.participants.contains(&ctx.accounts.player.key()),
            ErrorCode::AlreadyRegistered
        );

        // Transfer entry fee from player to tournament escrow
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.player.to_account_info(),
                    to: ctx.accounts.tournament_escrow.to_account_info(),
                },
            ),
            tournament.entry_fee,
        )?;

        tournament.participants.push(ctx.accounts.player.key());
        tournament.total_pool += tournament.entry_fee;

        emit!(PlayerRegistered {
            tournament_id,
            player: ctx.accounts.player.key(),
            entry_fee: tournament.entry_fee,
            total_pool: tournament.total_pool,
        });

        Ok(())
    }

    pub fn finalize_tournament(
        ctx: Context<FinalizeTournament>,
        first_place: Pubkey,
        second_place: Pubkey,
        third_place: Pubkey,
    ) -> Result<()> {
        let tournament = &mut ctx.accounts.tournament;
        
        require!(!tournament.is_finalized, ErrorCode::TournamentFinalized);
        require!(
            ctx.accounts.authority.key() == tournament.authority,
            ErrorCode::Unauthorized
        );

        let total_pool = tournament.total_pool;
        
        // Calculate payouts: 60%, 30%, 10%
        let first_payout = (total_pool * 60) / 100;
        let second_payout = (total_pool * 30) / 100;
        let third_payout = (total_pool * 10) / 100;

        tournament.is_finalized = true;

        emit!(TournamentFinalized {
            tournament_id: tournament.tournament_id.clone(),
            first_place,
            second_place,
            third_place,
            first_payout,
            second_payout,
            third_payout,
        });

        Ok(())
    }

    pub fn claim_prize(ctx: Context<ClaimPrize>, payout_amount: u64) -> Result<()> {
        let tournament = &ctx.accounts.tournament;
        
        require!(tournament.is_finalized, ErrorCode::TournamentNotFinalized);

        let tournament_id = tournament.tournament_id.clone();
        let bump = tournament.bump;

        // Transfer prize from escrow to winner
        **ctx.accounts.tournament_escrow.to_account_info().try_borrow_mut_lamports()? -= payout_amount;
        **ctx.accounts.winner.to_account_info().try_borrow_mut_lamports()? += payout_amount;

        emit!(PrizeClaimed {
            tournament_id,
            winner: ctx.accounts.winner.key(),
            amount: payout_amount,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(tournament_id: String)]
pub struct CreateTournament<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Tournament::INIT_SPACE,
        seeds = [b"tournament", tournament_id.as_bytes()],
        bump
    )]
    pub tournament: Account<'info, Tournament>,
    
    #[account(
        seeds = [b"escrow", tournament_id.as_bytes()],
        bump
    )]
    /// CHECK: This is the escrow account that holds tournament funds
    pub tournament_escrow: AccountInfo<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(tournament_id: String)]
pub struct RegisterForTournament<'info> {
    #[account(
        mut,
        seeds = [b"tournament", tournament_id.as_bytes()],
        bump = tournament.bump
    )]
    pub tournament: Account<'info, Tournament>,
    
    #[account(
        mut,
        seeds = [b"escrow", tournament_id.as_bytes()],
        bump
    )]
    /// CHECK: This is the escrow account that holds tournament funds
    pub tournament_escrow: AccountInfo<'info>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizeTournament<'info> {
    #[account(mut)]
    pub tournament: Account<'info, Tournament>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(mut)]
    pub tournament: Account<'info, Tournament>,
    
    #[account(mut)]
    /// CHECK: This is the escrow account that holds tournament funds
    pub tournament_escrow: AccountInfo<'info>,
    
    #[account(mut)]
    pub winner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Tournament {
    pub authority: Pubkey,
    #[max_len(50)]
    pub tournament_id: String,
    pub entry_fee: u64,
    pub total_pool: u64,
    #[max_len(64)]
    pub participants: Vec<Pubkey>,
    pub is_finalized: bool,
    pub bump: u8,
}

#[event]
pub struct PlayerRegistered {
    pub tournament_id: String,
    pub player: Pubkey,
    pub entry_fee: u64,
    pub total_pool: u64,
}

#[event]
pub struct TournamentFinalized {
    pub tournament_id: String,
    pub first_place: Pubkey,
    pub second_place: Pubkey,
    pub third_place: Pubkey,
    pub first_payout: u64,
    pub second_payout: u64,
    pub third_payout: u64,
}

#[event]
pub struct PrizeClaimed {
    pub tournament_id: String,
    pub winner: Pubkey,
    pub amount: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Tournament is already finalized")]
    TournamentFinalized,
    #[msg("Player is already registered")]
    AlreadyRegistered,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Tournament is not finalized yet")]
    TournamentNotFinalized,
}
