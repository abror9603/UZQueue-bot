/**
 * UZQueue Bot v2.0 - Main Entry Point
 * Citizen-to-Government Communication Platform
 */

import 'dotenv/config';
import { validateEnv } from './config/env';
import { initializeBot } from './bot';
import { log } from './utils/logger';

/**
 * Main application entry point
 */
async function main() {
  try {
    // Validate environment variables
    log.info('Starting UZQueue Bot v2.0...');
    validateEnv();
    log.info('✅ Environment variables validated');

    // Initialize and launch bot
    await initializeBot();
    
    log.info('🚀 UZQueue Bot is running!');
    log.info('Press Ctrl+C to stop');
    
  } catch (error) {
    log.error('Failed to start application', error);
    process.exit(1);
  }
}

// Start application
main();

