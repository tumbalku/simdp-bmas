/* eslint-disable @typescript-eslint/no-explicit-any */
import { getClient, type PrismaClientOrTx } from "./common";

export async function findMasterDataMany(
  modelName: string,
  query: { where: any; include?: any; orderBy?: any; skip?: number; take?: number },
  tx?: PrismaClientOrTx
) {
  const client = getClient(tx) as any;
  const modelDelegate = client[modelName];
  if (!modelDelegate) throw new Error(`Entity type ${modelName} tidak didukung`);
  return modelDelegate.findMany(query);
}

export async function countMasterData(modelName: string, query: { where: any }, tx?: PrismaClientOrTx) {
  const client = getClient(tx) as any;
  const modelDelegate = client[modelName];
  if (!modelDelegate) throw new Error(`Entity type ${modelName} tidak didukung`);
  return modelDelegate.count(query);
}

export async function createMasterData(modelName: string, data: any, tx?: PrismaClientOrTx) {
  const client = getClient(tx) as any;
  const modelDelegate = client[modelName];
  if (!modelDelegate) throw new Error(`Entity type ${modelName} tidak didukung`);
  return modelDelegate.create({ data });
}

export async function updateMasterData(modelName: string, id: string, data: any, tx?: PrismaClientOrTx) {
  const client = getClient(tx) as any;
  const modelDelegate = client[modelName];
  if (!modelDelegate) throw new Error(`Entity type ${modelName} tidak didukung`);
  return modelDelegate.update({
    where: { id },
    data,
  });
}

export async function deleteMasterData(modelName: string, id: string, tx?: PrismaClientOrTx) {
  const client = getClient(tx) as any;
  const modelDelegate = client[modelName];
  if (!modelDelegate) throw new Error(`Entity type ${modelName} tidak didukung`);
  return modelDelegate.delete({
    where: { id },
  });
}
