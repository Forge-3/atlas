// npx ts-node -P dev-scripts/migrationSetup/tsconfig.setup.json dev-scripts/migrationSetup/setup.ts

import 'dotenv/config';
import { HttpAgent } from "@dfinity/agent";
import { readFileSync } from "fs";
import { Secp256k1KeyIdentity } from "@dfinity/identity-secp256k1";
import { atlasMainActor, ckUsdcActor, atlasSpaceActor } from "./actors.ts";
import { createNewSpace, joinAtlasSpace, transferSpaceTo } from "./mainApi.ts";
import { execSync } from "child_process";
import { createSampleTasks, reviewSubtasks, submitSubtasks } from './tasks.ts';
import { setUserSpaceAllowanceIfNeeded } from './ckUsdcApi.ts';
import os from "os";
import path from "path";

const HOST = "http://127.0.0.1:4943";
const HOME = os.homedir();
const DEFAULT_IDENTITY_PATH = path.join(HOME, ".config", "dfx", "identity", "default", "identity.pem");

function depositCycles(canister: string, amount: number) {
  try {
    console.log(`Depositing ${amount} cycles to canister ${canister}...`);
    execSync(`dfx ledger fabricate-cycles --canister ${canister} --t ${amount}`, { stdio: "inherit" });
  } catch (err) {
    console.error("Failed to deposit cycles:", err);
  }
}

async function mint(agent: HttpAgent, defaultAgent: HttpAgent, amount: bigint) {
  const ledger = ckUsdcActor(defaultAgent);
  const principal = await agent.getPrincipal();
  const result = await ledger.icrc1_transfer({
    to: { owner: principal, subaccount: [] },
    amount,
    fee: [],
    memo: [],
    from_subaccount: [],
    created_at_time: []
  });

  console.log("Transfer result:", result);

  const balance = await ledger.icrc1_balance_of({
    owner: principal,
    subaccount: [],
  });

  console.log(
    `Stan konta ckUSDC (${principal.toText()}): ${balance}`
  );
}

async function makeAgentFromPem(pemPath: string) {
  const pem = readFileSync(pemPath, "utf-8");
  const identity = Secp256k1KeyIdentity.fromPem(pem);
  return HttpAgent.create({
    host: HOST,
    identity,
  });
}

async function makeAgentFromRandom() {
  const identity = Secp256k1KeyIdentity.generate();
  identity.getKeyPair()

  return HttpAgent.create({
    host: HOST,
    identity,
  });
}

async function main() {
  depositCycles("atlas_main", 1000);
  const defaultAgent = await makeAgentFromPem(DEFAULT_IDENTITY_PATH);
  await defaultAgent.fetchRootKey();

  const adminAgent = await makeAgentFromRandom();
  await adminAgent.fetchRootKey();

  const spaceLeadAgent1 = await makeAgentFromRandom();
  await spaceLeadAgent1.fetchRootKey();

  const spaceLeadAgent2 = await makeAgentFromRandom();
  await spaceLeadAgent2.fetchRootKey();

  const userAgent = await makeAgentFromRandom();
  await userAgent.fetchRootKey();

  const atlasMain = atlasMainActor(defaultAgent);

  // mint
  await mint(adminAgent, defaultAgent, 100_000_000_000_000_000n);
  await mint(spaceLeadAgent1, defaultAgent, 100_000_000_000_000_000n);
  await mint(spaceLeadAgent2, defaultAgent, 100_000_000_000_000_000n);

  // set rank
  const setAdminResult = await atlasMain.set_user_admin(await adminAgent.getPrincipal());
  console.log("User set to admin: ", (await adminAgent.getPrincipal()).toText(), "setResult: ", setAdminResult);

  const atlasMainAdmin = atlasMainActor(adminAgent);
  const setSpaceLeadResult = await atlasMainAdmin.set_user_space_lead(await spaceLeadAgent1.getPrincipal());
  const setSpaceLeadResult2 = await atlasMainAdmin.set_user_space_lead(await spaceLeadAgent2.getPrincipal());
  console.log("User set to space lead: ", (await spaceLeadAgent1.getPrincipal()).toText(), "setResult: ", setSpaceLeadResult);
  console.log("User set to space lead: ", (await spaceLeadAgent2.getPrincipal()).toText(), "setResult: ", setSpaceLeadResult2);

  // create spaces
  const atlasMainSpaceLead1 = atlasMainActor(spaceLeadAgent1);
  const atlasMainSpaceLead2 = atlasMainActor(spaceLeadAgent2);
  const space1 = await createNewSpace({
    authAtlasMain: atlasMainSpaceLead1,
    name: "First Space",
    description: "First Test Space",
    symbol: null,
    logo: null,
    background: null,
    externalLinks: {
      x: null,
      telegram: null,
      discord: null,
      linkedIn: null
    },
  });

  const space2 = await createNewSpace({
    authAtlasMain: atlasMainSpaceLead1,
    name: "Second Space",
    description: "Second Test Space",
    symbol: null,
    logo: null,
    background: null,
    externalLinks: {
      x: null,
      telegram: null,
      discord: null,
      linkedIn: null
    },
  });

    const space3 = await createNewSpace({
    authAtlasMain: atlasMainSpaceLead2,
    name: "Third Space",
    description: "Third Test Space",
    symbol: null,
    logo: null,
    background: null,
    externalLinks: {
      x: null,
      telegram: null,
      discord: null,
      linkedIn: null
    },
  });
  
  console.log("created Space1:", space1.id.toText());
  console.log("created Space2:", space2.id.toText());
  console.log("created Space3:", space3.id.toText());

  await transferSpaceTo({
    authAtlasMain: atlasMainAdmin,
    toUserId: await spaceLeadAgent2.getPrincipal(),
    spaceId: space2.id,
  });
  console.log(`Space ${space2.id.toText()} transferred to ${await spaceLeadAgent2.getPrincipal()}`);

  // create tasks
  await setUserSpaceAllowanceIfNeeded({
    unAuthCkUsd: ckUsdcActor(spaceLeadAgent1),
    authCkUsdc: ckUsdcActor(spaceLeadAgent1),
    spacePrincipal: space1.id,
    userPrincipal: await spaceLeadAgent1.getPrincipal(),
    amount: 20_000_000_000n,
  });

  await setUserSpaceAllowanceIfNeeded({
    unAuthCkUsd: ckUsdcActor(spaceLeadAgent2),
    authCkUsdc: ckUsdcActor(spaceLeadAgent2),
    spacePrincipal: space2.id,
    userPrincipal: await spaceLeadAgent2.getPrincipal(),
    amount: 20_000_000_000n,
  });

  await createSampleTasks(atlasSpaceActor(spaceLeadAgent2, space2.id));
  const { taskIds, subtasksList } = await createSampleTasks(atlasSpaceActor(spaceLeadAgent1, space1.id));
  
  await joinAtlasSpace({ authAtlasMain: atlasMainActor(userAgent), space: space1.id });
  await submitSubtasks(atlasSpaceActor(userAgent, space1.id), taskIds, subtasksList);
  await reviewSubtasks({ taskIds, subtasksList, spaceLeadActor: atlasSpaceActor(spaceLeadAgent1, space1.id), adminActor: atlasSpaceActor(adminAgent, space1.id), userPrincipal: await userAgent.getPrincipal() });
}

main().catch(console.error);
