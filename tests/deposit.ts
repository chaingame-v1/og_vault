// ✅ Deposit 测试通过
import { Connection, PublicKey } from '@solana/web3.js';
import { setProvider } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction} from '@solana/spl-token';
import * as path from 'path';
import * as anchor from '@project-serum/anchor';
import idl from "../target/idl/og_vault.json";
import { PROGRAM_ID, USDC_MINT_ADDRESS, RPC_URL, SEEDS} from '../utils/Constants';
import { SolanaUtil } from '../utils/SolanaUtil';

const payer_keypair = SolanaUtil.loadWalletFromLocal(path.join(__dirname, './depositor-keypair.json'));
const payer = payer_keypair;

async function deposit() {
    const provider = SolanaUtil.getProvider(payer_keypair, RPC_URL);
    setProvider(provider);
    const connection = new Connection(RPC_URL, 'processed');

    const program = SolanaUtil.getProgram(provider, PROGRAM_ID, idl as anchor.Idl);
    console.log('Payer:', payer_keypair.publicKey);

    // 获取tokenAccountOwnerPda
    const [tokenAccountOwnerPda, _bump] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.TOKEN_ACCOUNT_OWNER_PDA)],
        program.programId
    );

    // 获取 vault 的 USDC 代币账户 (合约 USDC 的 ATA)
    const [vaultTokenAccount, _vaultTokenBump] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.VAULT), USDC_MINT_ADDRESS.toBuffer()],
        program.programId
    );


    console.log(`Client tokenAccountOwnerPda: ${tokenAccountOwnerPda}`);
    console.log(`Client vaultTokenAccount: ${vaultTokenAccount}`);

    const instructions = [];

    // 获取用户的 USDC 代币账户 （ATA）
    const userTokenAccount = await getAssociatedTokenAddress(USDC_MINT_ADDRESS, payer.publicKey);
    const userAtaInfo = await connection.getAccountInfo(userTokenAccount);
    if (!userAtaInfo) {
        console.log('create user token ata account.')
        instructions.push(
            createAssociatedTokenAccountInstruction(
                payer.publicKey,  // 付款人
                userTokenAccount, // ata 账户
                payer.publicKey,  // owner
                USDC_MINT_ADDRESS // mint
            )
        )
    }
    
     // 检查合约 ATA 是否存在
     const vaultAtaInfo = await connection.getAccountInfo(vaultTokenAccount);
     if (!vaultAtaInfo) {
         console.log('create vault token ata account.')
         instructions.push(
             createAssociatedTokenAccountInstruction(
                 payer.publicKey,    // 付款人
                 vaultTokenAccount,  // ata 账户
                 tokenAccountOwnerPda,// owner
                 USDC_MINT_ADDRESS   // mint
             )
         )
     }

    if(instructions.length > 0) {
        const transaction = new anchor.web3.Transaction().add(...instructions);
        await provider.sendAndConfirm(transaction, [], { skipPreflight: false });
        console.log("必要的关联账户已创建");
    }

    console.log('userTokenAccount:', userTokenAccount.toString());

    // 存款
    const depositAmount = new anchor.BN(1 * 10 ** 6); // 存款金额
    const transferInTx = await program.methods
        .deposit(depositAmount)
        .accounts({
            tokenAccountOwnerPda: tokenAccountOwnerPda,
            vaultTokenAccount: vaultTokenAccount,
            senderTokenAccount: userTokenAccount,
            mintOfTokenBeingSent: USDC_MINT_ADDRESS,
            signer: payer_keypair.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([])
        .rpc();

    console.log("deposit Transaction Signature:", transferInTx);
}

// 调用 deposit 函数
deposit().then(() => {
    console.log("deposit completed successfully.");
}).catch((err) => {
    console.error("deposit failed:", err);
});