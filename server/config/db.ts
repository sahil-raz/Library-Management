import mongoose from 'mongoose';
import dns from 'dns';
import { ENV, loadedEnvPath } from './env.js';

let isShuttingDown = false;
let reconnectTimer: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;

export function setShuttingDown(val: boolean): void {
  isShuttingDown = val;
}

export const mongoOptions: mongoose.ConnectOptions = {
  serverSelectionTimeoutMS: 10000,
  maxPoolSize: 20,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
};

export async function connectDB(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);

    // On Linux/Android (Termux), standard cellular/wifi DNS often fails SRV records for Atlas
    if (ENV.MONGODB_URI.startsWith('mongodb+srv://')) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
      } catch (dnsErr) {
        console.warn('⚠️ [Database] Unable to set custom DNS servers:', dnsErr);
      }
    }

    await mongoose.connect(ENV.MONGODB_URI, mongoOptions);
    console.log('✅ [Database] MongoDB successfully connected');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ [Database] Connection failed:', errorMsg);

    if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('querySrv')) {
      console.error('\n📌 [Tip] DNS could not resolve your MongoDB cluster hostname.');
      console.error('   Please double-check your cluster name in MONGODB_URI in your .env file,');
      console.error('   and ensure network access (0.0.0.0/0) is enabled in MongoDB Atlas Network Access.\n');
    } else if (errorMsg.includes('ECONNREFUSED')) {
      console.error('\n📌 [Tip] Connection refused on localhost:27017.');
      console.error('   If using local MongoDB, ensure `mongod` is running. If using Atlas, verify MONGODB_URI in .env.\n');
    }
    throw error;
  }
}

mongoose.connection.on('connected', () => {
  reconnectAttempts = 0;
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ [Database] MongoDB disconnected');
  if (isShuttingDown) return;

  if (!reconnectTimer) {
    const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 10000);
    reconnectAttempts++;

    reconnectTimer = setTimeout(async () => {
      reconnectTimer = null;
      if (mongoose.connection.readyState === 1 || isShuttingDown) return;
      try {
        console.log('🔄 [Database] Re-establishing MongoDB connection...');
        await mongoose.connect(ENV.MONGODB_URI, mongoOptions);
        console.log('✅ [Database] MongoDB reconnected successfully');
      } catch (err: any) {
        console.error('❌ [Database] Automatic reconnection attempt failed:', err.message);
      }
    }, delay);
  }
});

mongoose.connection.on('error', (err) => {
  console.error('❌ [Database] MongoDB runtime error:', err);
});
