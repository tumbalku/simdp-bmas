import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ProfileManager } from '../core/profile.js';
import { ConfigManager } from '../core/config.js';
import { BackupPipeline } from '../core/backup.js';
import { RestorePipeline } from '../core/restore.js';
import { PostgresDriver } from '../drivers/database/postgres.js';
import { SupabaseStorageDriver } from '../drivers/storage/supabase.js';
import { S3StorageDriver } from '../drivers/storage/s3.js';
import { LocalStorageDriver } from '../drivers/storage/local.js';
import { EventBus } from './events.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createServer() {
  const app = Fastify({ logger: false });
  const eventBus = EventBus.getInstance();
  const configManager = new ConfigManager();
  const profileManager = new ProfileManager();

  await app.register(cors, { origin: '*' });

  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  await app.register(fastifyStatic, {
    root: publicDir,
    prefix: '/'
  });

  // SSE Logs stream
  app.get('/api/events', async (request, reply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.flushHeaders();

    const listener = (event: any) => {
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    eventBus.on('event', listener);

    // Initial ping
    reply.raw.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE Stream Connected' })}\n\n`);

    request.raw.on('close', () => {
      eventBus.off('event', listener);
    });
  });

  // Profiles API
  app.get('/api/profiles', async () => {
    return profileManager.loadProfiles();
  });

  app.post('/api/profiles', async (request, reply) => {
    const profile = request.body as any;
    if (!profile || !profile.name) {
      return reply.status(400).send({ error: 'Invalid profile data' });
    }
    profileManager.addProfile(profile);
    return { success: true, profile };
  });

  app.post('/api/profiles/active', async (request, reply) => {
    const { name } = request.body as { name: string };
    if (!name || !profileManager.setActiveProfile(name)) {
      return reply.status(400).send({ error: `Profile '${name}' not found` });
    }
    return { success: true, activeProfile: name };
  });

  // Connection status
  app.get('/api/status', async () => {
    const active = profileManager.getActiveProfile();
    const results: Record<string, any> = {
      profile: active.name,
      db: { success: false, message: 'Not tested' },
      storage: { success: false, message: 'Not tested' }
    };

    // Test DB
    try {
      const dbDriver = new PostgresDriver(active.db);
      results.db = await dbDriver.testConnection();
      await dbDriver.close();
    } catch (err: any) {
      results.db = { success: false, message: err.message };
    }

    // Test Storage
    try {
      let storageDriver;
      if (active.storage.type === 'supabase') {
        storageDriver = new SupabaseStorageDriver(active.storage);
      } else if (active.storage.type === 's3') {
        storageDriver = new S3StorageDriver(active.storage);
      } else {
        storageDriver = new LocalStorageDriver(active.storage);
      }
      results.storage = await storageDriver.testConnection();
    } catch (err: any) {
      results.storage = { success: false, message: err.message };
    }

    return results;
  });

  // Backups list
  app.get('/api/backups', async () => {
    const backupDir = path.join(configManager.getProjectRoot(), 'backups');
    if (!fs.existsSync(backupDir)) {
      return [];
    }

    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.tar.gz'));
    return files.map(file => {
      const stat = fs.statSync(path.join(backupDir, file));
      return {
        filename: file,
        fullPath: path.join(backupDir, file),
        size: stat.size,
        createdAt: stat.mtime
      };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  });

  // Trigger Backup
  app.post('/api/backup', async (request, reply) => {
    const body = (request.body || {}) as any;
    const type = body.type || 'full';
    const profileName = body.profileName;

    eventBus.emitLog('backup', `Received backup request: Type=${type}, Profile=${profileName || 'active'}`);

    const pipeline = new BackupPipeline();

    // Async execution
    (async () => {
      try {
        const res = await pipeline.execute({
          type,
          profileName,
          onProgress: (evt) => {
            eventBus.emitLog(evt.stage, evt.message);
          }
        });
        eventBus.emitSuccess('backup', `Backup generated successfully! File: ${path.basename(res.artifactPath)}`, res);
      } catch (err: any) {
        eventBus.emitError('backup', `Backup failed: ${err.message}`, err);
      }
    })();

    return { success: true, message: 'Backup started in background' };
  });

  // Trigger Restore
  app.post('/api/restore', async (request, reply) => {
    const body = (request.body || {}) as any;
    const { artifactPath, profileName, dryRun, targetType } = body;

    if (!artifactPath) {
      return reply.status(400).send({ error: 'artifactPath is required' });
    }

    eventBus.emitLog('restore', `Received restore request: File=${path.basename(artifactPath)}, DryRun=${Boolean(dryRun)}`);

    const pipeline = new RestorePipeline();

    // Async execution
    (async () => {
      try {
        const res = await pipeline.execute(artifactPath, {
          profileName,
          dryRun: Boolean(dryRun),
          targetType,
          onProgress: (evt) => {
            eventBus.emitLog(evt.stage, evt.message);
          }
        });
        eventBus.emitSuccess('restore', `Restore process completed!`, res);
      } catch (err: any) {
        eventBus.emitError('restore', `Restore failed: ${err.message}`, err);
      }
    })();

    return { success: true, message: 'Restore started in background' };
  });

  return app;
}

export async function startServer(port = 4000) {
  const app = await createServer();
  try {
    const address = await app.listen({ port, host: '0.0.0.0' });
    console.log(`\n🚀 SIMDP Ops Hub Web GUI running at: ${address}\n`);
  } catch (err) {
    console.error('Error starting Ops Hub server:', err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('server\\index.js') || process.argv[1]?.endsWith('server/index.js') || process.argv[1]?.endsWith('server\\index.ts') || process.argv[1]?.endsWith('server/index.ts')) {
  startServer(4000);
}

