import hre from "hardhat";
import { network } from "hardhat";

const REGISTRY_ADDRESS = "0x4D47d268F5BdBd8926efa86C5205185550b9178d";

async function main() {
  console.log("🔍 Checking staging mode status...\n");

  const networkName = hre.network.name;
  console.log(`📋 Network: ${networkName}`);
  console.log(`📋 Contract Address: ${REGISTRY_ADDRESS}\n`);

  // Connect to network using Viem
  const { viem } = await network.connect();
  
  // Load ABI from frontend
  const fs = await import("fs/promises");
  const path = await import("path");
  const abiPath = path.join(process.cwd(), "..", "frontend", "app", "abi", "NGORegistry.json");
  const ngoRegistryAbiFile = JSON.parse(await fs.readFile(abiPath, "utf-8"));
  const ngoRegistryAbi = Array.isArray(ngoRegistryAbiFile) ? ngoRegistryAbiFile : ngoRegistryAbiFile.abi || ngoRegistryAbiFile;

  const publicClient = await viem.getPublicClient();
  const walletClients = await viem.getWalletClients();
  const account = walletClients[0].account;

  try {
    // Check current staging mode
    const stagingMode = await publicClient.readContract({
      address: REGISTRY_ADDRESS as `0x${string}`,
      abi: ngoRegistryAbi,
      functionName: "stagingMode",
    });
    
    console.log(`📊 Current staging mode: ${stagingMode ? "✅ ENABLED" : "❌ DISABLED"}`);

    if (!stagingMode) {
      console.log("\n⚠️  Staging mode is DISABLED - attempting to enable it...\n");
      
      try {
        const walletClient = await viem.getWalletClient({ account });
        console.log("Using account:", account.address);
        
        // Try to enable staging mode
        const hash = await walletClient.writeContract({
          address: REGISTRY_ADDRESS as `0x${string}`,
          abi: ngoRegistryAbi,
          functionName: "updateStagingMode",
          args: [true],
          account: account,
        });
        
        console.log("📤 Transaction sent:", hash);
        console.log("⏳ Waiting for confirmation...");
        
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status === "success") {
          console.log("✅ Staging mode enabled successfully!");
          
          // Verify it's enabled
          const newStagingMode = await publicClient.readContract({
            address: REGISTRY_ADDRESS as `0x${string}`,
            abi: ngoRegistryAbi,
            functionName: "stagingMode",
          });
          console.log(`\n📊 New staging mode: ${newStagingMode ? "✅ ENABLED" : "❌ DISABLED"}`);
        } else {
          console.log("❌ Transaction failed");
        }
      } catch (error: any) {
        console.error("❌ Error enabling staging mode:", error.message);
        if (error.message?.includes("only admin") || error.message?.includes("Ownable")) {
          console.log("\n⚠️  You are not the admin. The contract needs to be redeployed with staging mode enabled.");
        } else if (error.message?.includes("updateStagingMode")) {
          console.log("\n⚠️  The updateStagingMode function may not exist on this contract version.");
          console.log("    You may need to redeploy the contract with staging mode enabled.");
        }
      }
    } else {
      console.log("\n✅ Staging mode is already enabled - no action needed!");
    }
  } catch (error: any) {
    console.error("❌ Error checking staging mode:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

