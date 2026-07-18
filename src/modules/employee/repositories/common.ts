import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type PrismaClientOrTx = Prisma.TransactionClient | typeof prisma;

export function getClient(tx?: PrismaClientOrTx): PrismaClientOrTx {
  return tx || prisma;
}
