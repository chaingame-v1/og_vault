### 部署合约

- rm -rf target
- anchor build
- solana address -k target/deploy/og_vault-keypair.json 将获取到的地址替换到合约的 declare_id 处
- anchor clean
- anchor build
- anchor deploy

### 查看合约信息

- solana program show 4vDCnxn3hMvNsKbRNMapuktpHYjka9Jv49Vzoq1uNMV2 #替换为程序ID
  
### Solana-cli

#### solana

- solana config get # 查看本地配置
- solana address # 查看本地地址
- solana address -k keypair.json # 查看keypair.json的地址
- solana balance # 查看本地地址SOL余额
- solana balance BJAqzgRko9rD3DYo93P7CjMGvpLDeCpNpWbw2ghvA6xS # 查看BJAqzgRko9rD3DYo93P7CjMGvpLDeCpNpWbw2ghvA6xS 地址SOL余额
- solana-keygen new --outfile ./test-keypair.json # 生成一个新的test-keypair.json 公私钥对
  
#### spl-token

- spl-token balance Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr --owner 2Hd6Sq669dFSf4dnc7NKbt7t3gVtG3WUS63KV2C2rBbG # 查看2Hd6Sq669dFSf4dnc7NKbt7t3gVtG3WUS63KV2C2rBbG 拥有 Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr 的余额