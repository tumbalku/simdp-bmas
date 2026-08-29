import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { 
  ConnectionTestResult, 
  DatabaseType, 
  DBDumpResult, 
  IDatabaseConfig, 
  IDatabaseDriver 
} from '../../types/index.js';

const { Pool } = pg;

export class PostgresDriver implements IDatabaseDriver {
  public type: DatabaseType;
  private pool: pg.Pool;
  private config: IDatabaseConfig;

  constructor(config: IDatabaseConfig) {
    this.config = config;
    this.type = config.type || 'postgres';
    this.pool = new Pool({
      connectionString: config.url,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 10000
    });
  }

  public async testConnection(): Promise<ConnectionTestResult> {
    const start = Date.now();
    try {
      const client = await this.pool.connect();
      try {
        const res = await client.query('SELECT version(), current_database(), current_user;');
        const latency = Date.now() - start;
        return {
          success: true,
          message: `Connected successfully to PostgreSQL database '${res.rows[0].current_database}'`,
          latencyMs: latency,
          details: {
            version: res.rows[0].version,
            database: res.rows[0].current_database,
            user: res.rows[0].current_user
          }
        };
      } finally {
        client.release();
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Connection failed: ${err.message}`,
        latencyMs: Date.now() - start,
        details: { error: String(err) }
      };
    }
  }

  public async getTables(): Promise<string[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT LIKE '_prisma_migrations'
        ORDER BY table_name;
      `;
      const res = await client.query(query);
      return res.rows.map(r => r.table_name);
    } finally {
      client.release();
    }
  }

  public async dumpDatabase(outputDir: string, onProgress?: (msg: string) => void): Promise<DBDumpResult> {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const tables = await this.getTables();
    onProgress?.(`Found ${tables.length} tables to export.`);

    const client = await this.pool.connect();
    const tableRowCounts: Record<string, number> = {};
    let totalRows = 0;

    try {
      for (const table of tables) {
        onProgress?.(`Dumping table data: ${table}...`);
        const query = `SELECT * FROM public."${table}";`;
        const res = await client.query(query);
        
        tableRowCounts[table] = res.rowCount || 0;
        totalRows += res.rowCount || 0;

        const tableFilePath = path.join(outputDir, `${table}.json`);
        fs.writeFileSync(tableFilePath, JSON.stringify(res.rows, null, 2), 'utf-8');
      }

      onProgress?.(`Database dump completed. Total ${totalRows} rows across ${tables.length} tables.`);
      return {
        tables: tableRowCounts,
        totalRows,
        dataDir: outputDir
      };
    } finally {
      client.release();
    }
  }

  public async restoreDatabase(
    dataDir: string,
    options?: { dryRun?: boolean; onProgress?: (msg: string) => void }
  ): Promise<{ restoredTables: string[]; totalRows: number }> {
    const { dryRun = false, onProgress } = options || {};

    if (!fs.existsSync(dataDir)) {
      throw new Error(`Data directory not found: ${dataDir}`);
    }

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    const tables = files.map(f => path.basename(f, '.json'));

    onProgress?.(`Found ${files.length} tables to restore from ${dataDir}.`);
    if (dryRun) {
      onProgress?.(`[DRY-RUN] Simulating restore for ${tables.length} tables.`);
      let estimatedRows = 0;
      for (const file of files) {
        const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
        const rows = JSON.parse(content);
        estimatedRows += Array.isArray(rows) ? rows.length : 0;
      }
      return {
        restoredTables: tables,
        totalRows: estimatedRows
      };
    }

    const client = await this.pool.connect();
    let totalRestoredRows = 0;

    try {
      await client.query('BEGIN');
      onProgress?.('Disabling foreign key checks / truncating existing tables...');

      // Truncate tables cascade
      for (const table of tables) {
        await client.query(`TRUNCATE TABLE public."${table}" CASCADE;`);
      }

      for (const table of tables) {
        const filePath = path.join(dataDir, `${table}.json`);
        const content = fs.readFileSync(filePath, 'utf-8');
        const rows: Record<string, any>[] = JSON.parse(content);

        if (rows.length === 0) {
          onProgress?.(`Restoring table ${table}: 0 rows (skipped).`);
          continue;
        }

        onProgress?.(`Restoring table ${table} (${rows.length} rows)...`);
        const columns = Object.keys(rows[0]);
        const quotedCols = columns.map(c => `"${c}"`).join(', ');

        for (const row of rows) {
          const values = columns.map(c => row[c]);
          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
          const insertQuery = `INSERT INTO public."${table}" (${quotedCols}) VALUES (${placeholders});`;
          await client.query(insertQuery, values);
        }

        totalRestoredRows += rows.length;
      }

      await client.query('COMMIT');
      onProgress?.(`Database restored successfully. Total rows: ${totalRestoredRows}`);
      return {
        restoredTables: tables,
        totalRows: totalRestoredRows
      };
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw new Error(`Restore failed and transaction rolled back: ${err.message}`);
    } finally {
      client.release();
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}
