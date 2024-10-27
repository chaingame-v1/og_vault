// ✅ withdraw 测试通过
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { setProvider } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction} from '@solana/spl-token';
import * as anchor from '@project-serum/anchor';
import idl from "../target/idl/og_vault.json";
import { PROGRAM_ID, USDC_MINT_ADDRESS, RPC_URL, SEEDS} from '../utils/Constants';
import { SolanaUtil } from '../utils/SolanaUtil';
import * as path from 'path';

const admin_keypair_path = '/Users/neo/.config/solana/id.json';
const reciverAddress = new PublicKey('2Hd6Sq669dFSf4dnc7NKbt7t3gVtG3WUS63KV2C2rBbG');

async function withdraw() {
    // 连接到Solana网络
    const connection = SolanaUtil.getConnection(RPC_URL);

    const admin = SolanaUtil.loadWalletFromLocal(admin_keypair_path);
    const provider = SolanaUtil.getProvider(admin, RPC_URL);
    setProvider(provider);

    const program = SolanaUtil.getProgram(provider, PROGRAM_ID, idl as anchor.Idl);

    console.log('Admin:', admin.publicKey.toString());

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

    console.log("Client tokenAccountOwnerPda:", tokenAccountOwnerPda.toString());
    console.log("Client vaultTokenAccount:", vaultTokenAccount.toString());

    const instructions = [];

     // 获取用户的 USDC 代币账户 （ATA）
     const reciverTokenAccount = await getAssociatedTokenAddress(USDC_MINT_ADDRESS, reciverAddress);
     const reciverAtaInfo = await connection.getAccountInfo(reciverTokenAccount);
     if (!reciverAtaInfo) {
         instructions.push(
             createAssociatedTokenAccountInstruction(
                 admin.publicKey,  // 付款人
                 reciverTokenAccount, // ata 账户
                 reciverAddress,  // owner
                 USDC_MINT_ADDRESS // mint
             )
         )
     }
 
     // 检查合约 ATA 是否存在
     const vaultAtaInfo = await connection.getAccountInfo(vaultTokenAccount);
     if (!vaultAtaInfo) {
         console.log('Create contract ata account.')
         // 创建合约 ATA
         /**
          *  await createAssociatedTokenAccount(
             connection,
             admin_keypair, // 付款人
             USDC_MINT_ADDRESS, // 代币 mint 地址
             reciver // 用户地址
         );
          */
         createAssociatedTokenAccountInstruction(
             admin.publicKey,  // 付款人
             vaultTokenAccount, // ata 账户
             tokenAccountOwnerPda,  // owner
             USDC_MINT_ADDRESS // mint
         )
     }
 
     // 如果需要创建账户，先发送创建账户的交易
     if (instructions.length > 0) {
         const transaction = new anchor.web3.Transaction().add(...instructions);
         await provider.sendAndConfirm(transaction, [], { skipPreflight: false });
         console.log("必要的关联账户已创建");
     }
 
     console.log('reciverTokenAccount:', reciverTokenAccount.toString());

     // 提现金额
    const amount = new anchor.BN(100000); // 设置提现金额
    const order_id = new anchor.BN(241028000012);
    const recipient = reciverAddress;

    const transferOutTx = await program.methods
        .withdraw(amount, order_id, recipient)
        .accounts({
            tokenAccountOwnerPda: tokenAccountOwnerPda,
            vaultTokenAccount: vaultTokenAccount,
            senderTokenAccount: reciverTokenAccount,
            mintOfTokenBeingSent: USDC_MINT_ADDRESS,
            signer: admin.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([admin])
        .rpc();

    console.log("transferOut Transaction Signature:", transferOutTx);
}

withdraw();