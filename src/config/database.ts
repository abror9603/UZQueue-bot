/**
 * MongoDB connection configuration
 * Uses Mongoose for ODM
 */

import mongoose from 'mongoose';
import { log } from '../utils/logger';

class Database {
    private static instance: Database;
    private isConnected: boolean = false;

    private constructor() { }

    static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    /**
     * Connect to MongoDB
     */
    async connect(): Promise<void> {
        if (this.isConnected) {
            log.info('Database already connected');
            return;
        }

        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            throw new Error('MONGO_URI environment variable is not set');
        }

        try {
            // Mongoose connection options
            const options: mongoose.ConnectOptions = {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000
            };

            await mongoose.connect(mongoUri, options);

            this.isConnected = true;
            log.info('✅ MongoDB connected successfully', {
                host: mongoose.connection.host,
                name: mongoose.connection.name
            });

            // Handle connection events
            mongoose.connection.on('error', (error) => {
                log.error('MongoDB connection error', error);
                this.isConnected = false;
            });

            mongoose.connection.on('disconnected', () => {
                log.warn('MongoDB disconnected');
                this.isConnected = false;
            });

            mongoose.connection.on('reconnected', () => {
                log.info('MongoDB reconnected');
                this.isConnected = true;
            });

        } catch (error) {
            log.error('Failed to connect to MongoDB', error);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * Disconnect from MongoDB
     */
    async disconnect(): Promise<void> {
        if (!this.isConnected) {
            return;
        }

        try {
            await mongoose.disconnect();
            this.isConnected = false;
            log.info('MongoDB disconnected');
        } catch (error) {
            log.error('Error disconnecting from MongoDB', error);
            throw error;
        }
    }

    /**
     * Check if database is connected
     */
    isConnectionActive(): boolean {
        return this.isConnected && mongoose.connection.readyState === 1;
    }

    /**
     * Get connection status
     */
    getStatus(): {
        connected: boolean;
        readyState: number;
        host?: string;
        name?: string;
    } {
        return {
            connected: this.isConnected,
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            name: mongoose.connection.name
        };
    }
}

// Export singleton instance
export const database = Database.getInstance();

// Export mongoose for model definitions
export { mongoose };

