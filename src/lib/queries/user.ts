import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type UserQueryClient = typeof prisma | Prisma.TransactionClient;

export function findUserWithEmployeeById(userId: string, client: UserQueryClient = prisma) {
  return client.user.findFirst({
    where: { id: userId },
    include: { employee: true },
  });
}
