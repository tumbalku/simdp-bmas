CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "limitedLoggedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "idx_ratelimitbucket_category_reset" ON "RateLimitBucket"("category", "resetAt");
CREATE INDEX "idx_ratelimitbucket_reset" ON "RateLimitBucket"("resetAt");
