// ✅ initialize 测试通过
import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "../target/idl/og_vault.json";
import { SolanaUtil } from "../utils/SolanaUtil";
import { PROGRAM_ID, USDC_MINT_ADDRESS, RPC_URL, SEEDS } from "../utils/Constants";


const ownerWalletPath = '/Users/neo/.config/solana/id.json';

async function initialize() {
    const admin = SolanaUtil.loadWalletFromLocal(ownerWalletPath);
    const provider = SolanaUtil.getProvider(admin, RPC_URL);
    anchor.setProvider(provider);

    const program = SolanaUtil.getProgram(provider, PROGRAM_ID, idl as anchor.Idl);

    const [tokenAccountOwnerPda, _bump] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.TOKEN_ACCOUNT_OWNER_PDA)],
        PROGRAM_ID
    );

    const [vaultTokenAccount, _vaultTokenBump] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.VAULT), USDC_MINT_ADDRESS.toBuffer()],
        PROGRAM_ID
    );

    console.log(`tokenAccountOwnerPda: ${tokenAccountOwnerPda}`);
    console.log(`vaultTokenAccount: ${vaultTokenAccount}`);
    console.log(`admin: ${admin.publicKey}`);

    try {
        const txSignature = await program.methods
          .initialize()
          .accounts({
            signer: admin.publicKey,
            mintOfTokenBeingSent: USDC_MINT_ADDRESS,
            tokenAccountOwnerPda: tokenAccountOwnerPda,
            vaultTokenAccount: vaultTokenAccount,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .signers([admin])
          .rpc();
        console.log("Transaction signature", txSignature);
    } catch (err) {
        console.error("Transaction failed:", err);
    }
}

initialize();