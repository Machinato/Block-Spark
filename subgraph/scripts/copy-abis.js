const fs = require("fs");
const path = require("path");

const CONTRACTS = [
    "MasterCampaign",
    "CampaignFactory",
    "MasterBlockSparkToken"
]

const ARTIFACTS = path.join(__dirname, "../../contracts/artifacts/contracts");
const ABIS_OUT = path.join(__dirname, "../abis");

if (!fs.existsSync(ABIS_OUT)) fs.mkdirSync(ABIS_OUT, { recursive: true });

let errors = 0;

for (const contract of CONTRACTS) {
    const src = path.join(ARTIFACTS, `${contract}.sol`, `${contract}.json`);
    if (!fs.existsSync(src)) {
        console.error(`❌ Not found: ${src}`)
        console.error(`   → Run: cd contracts && npx hardhat compile`);

        errors++;
        continue;
    }

    const { abi } = JSON.parse(fs.readFileSync(src, "utf-8"));
    fs.writeFileSync(path.join(ABIS_OUT, `${contract}.json`), JSON.stringify(abi, null, 2));
    console.log(`✅ Copied: ${contract}.json`);
}

if (errors) process.exit(1);

console.log(`\n✅All ABIs ready in subgraph/abis/`)