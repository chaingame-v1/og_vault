import * as anchor from "@project-serum/anchor";
import { Connection, PublicKey, Keypair, TransactionInstruction } from "@solana/web3.js";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import * as fs from 'fs';

export class SolanaUtil {
    static getProvider(keypair: Keypair, rpcUrl: string) {
        const connection = new Connection(rpcUrl, "processed");
        const wallet = new NodeWallet(keypair);
        return new anchor.AnchorProvider(connection, wallet, {});
    }

    static getProgram(provider: anchor.AnchorProvider, programId: PublicKey, idl:any) {
        return new anchor.Program(idl as anchor.Idl, programId, provider);
    }


    static getPublicKey(address: string) : PublicKey{
        return new PublicKey(address);
    }

    static loadWalletFromLocal(path: string): Keypair {
        const keypair_data = fs.readFileSync(path, 'utf-8');
        const keypair_array = JSON.parse(keypair_data);
        return Keypair.fromSecretKey(Uint8Array.from(keypair_array));
    }

    static getConnection(rpcUrl: string) {
        return new Connection(rpcUrl, 'processed');
    }



}