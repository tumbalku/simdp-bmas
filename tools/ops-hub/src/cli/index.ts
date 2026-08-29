#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'node:path';
import { ProfileManager } from '../core/profile.js';
import { ProjectSync } from '../core/sync.js';
import { BackupPipeline } from '../core/backup.js';
import { RestorePipeline } from '../core/restore.js';
import { startServer } from '../server/index.js';

const program = new Command();
const profileManager = new ProfileManager();

program
  .name('ops')
  .description('SIMDP Agnostic Backup, Restore & Disaster Recovery Hub')
  .version('1.0.0');

// ops profile
const profileCmd = program.command('profile').description('Manage multi-environment database & storage profiles');

profileCmd
  .command('list')
  .description('List all available connection profiles')
  .action(() => {
    const data = profileManager.loadProfiles();
    console.log(chalk.bold('\n--- SIMDP Ops Hub Profiles ---'));
    for (const [key, prof] of Object.entries(data.profiles)) {
      const isActive = key === data.activeProfile;
      const indicator = isActive ? chalk.green('● (active)') : chalk.gray('○');
      console.log(`${indicator} ${chalk.cyan(prof.name)}: DB [${chalk.yellow(prof.db.type)}] | Storage [${chalk.yellow(prof.storage.type)}]`);
      if (prof.description) {
        console.log(`    ${chalk.gray(prof.description)}`);
      }
    }
    console.log('');
  });

profileCmd
  .command('use <name>')
  .description('Switch active profile')
  .action((name: string) => {
    const success = profileManager.setActiveProfile(name);
    if (success) {
      console.log(chalk.green(`\nActive profile switched to '${name}'.\n`));
    } else {
      console.log(chalk.red(`\nError: Profile '${name}' does not exist.\n`));
    }
  });

// ops sync
program
  .command('sync')
  .description('Validate target SIMDP repository, Prisma schema, and active .env')
  .option('-p, --project <path>', 'Custom path to SIMDP project root')
  .action((options) => {
    const spinner = ora('Validating project & sync status...').start();
    const sync = new ProjectSync(options.project);
    const res = sync.validateProject();

    if (!res.valid) {
      spinner.fail(chalk.red(`Sync validation failed: ${res.error}`));
      process.exit(1);
    }

    spinner.succeed(chalk.green('SIMDP project validated successfully!'));
    console.log(`\n  Project Root:   ${chalk.cyan(res.projectRoot)}`);
    console.log(`  Prisma Schema:  ${chalk.green('Found')} (Hash: ${chalk.gray(res.prismaSchemaHash?.slice(0, 12))}...)`);
    console.log(`  Environment:    ${chalk.green('Loaded')} (${res.envKeys.length} variables detected)`);
    console.log(`  Active Profile: ${chalk.yellow(res.activeProfileName)}\n`);
  });

// ops backup
program
  .command('backup')
  .description('Perform a full or partial backup bundle')
  .option('-p, --profile <name>', 'Target profile name')
  .option('-t, --type <type>', 'Backup type (full | db | storage)', 'full')
  .option('-o, --out <dir>', 'Output directory for backup archive')
  .action(async (options) => {
    const spinner = ora('Initializing backup pipeline...').start();
    const pipeline = new BackupPipeline();

    try {
      const result = await pipeline.execute({
        profileName: options.profile,
        type: options.type as any,
        outputDir: options.out,
        onProgress: (evt) => {
          spinner.text = `[${evt.stage.toUpperCase()}] ${evt.message}`;
        }
      });

      spinner.succeed(chalk.green(`Backup created successfully in ${(result.durationMs / 1000).toFixed(2)}s!`));
      console.log(`\n  Bundle Location: ${chalk.cyan(result.artifactPath)}`);
      console.log(`  Profile Source:  ${chalk.yellow(result.manifest.sourceProfile)}`);
      console.log(`  Bundle Type:     ${chalk.magenta(result.manifest.type)}`);
      if (result.manifest.database) {
        console.log(`  DB Rows Exported: ${chalk.green(result.manifest.database.totalRows)}`);
      }
      console.log('');
    } catch (err: any) {
      spinner.fail(chalk.red(`Backup failed: ${err.message}`));
      process.exit(1);
    }
  });

// ops restore
program
  .command('restore <artifactPath>')
  .description('Restore database and storage from a backup bundle')
  .option('-p, --profile <name>', 'Target profile name')
  .option('--dry-run', 'Simulate restore without modifying destination')
  .option('-t, --type <type>', 'Target restore component (full | db | storage)', 'full')
  .action(async (artifactPath: string, options) => {
    const isDryRun = Boolean(options.dryRun);
    const spinner = ora(`${isDryRun ? '[DRY-RUN] ' : ''}Initializing restore pipeline...`).start();
    const pipeline = new RestorePipeline();

    try {
      const result = await pipeline.execute(path.resolve(artifactPath), {
        profileName: options.profile,
        dryRun: isDryRun,
        targetType: options.type as any,
        onProgress: (evt) => {
          spinner.text = `[${evt.stage.toUpperCase()}] ${evt.message}`;
        }
      });

      spinner.succeed(chalk.green(`${isDryRun ? '[DRY-RUN] Simulation' : 'Restore'} completed successfully!`));
      if (result.dbRestored) {
        console.log(`\n  Tables Restored: ${chalk.green(result.dbRestored.tables.length)} (${result.dbRestored.totalRows} rows)`);
      }
      if (result.storageRestored) {
        for (const bucket of result.storageRestored) {
          console.log(`  Bucket '${bucket.bucket}': ${chalk.green(bucket.restoredCount)} items restored`);
        }
      }
      console.log('');
    } catch (err: any) {
      spinner.fail(chalk.red(`Restore failed: ${err.message}`));
      process.exit(1);
    }
  });

// ops gui
program
  .command('gui')
  .description('Launch the local Web GUI dashboard and API server')
  .option('-p, --port <port>', 'Server port', '4000')
  .action(async (options) => {
    const port = parseInt(options.port, 10) || 4000;
    await startServer(port);
  });

program.parse(process.argv);
