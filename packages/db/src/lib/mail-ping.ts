import { mailTransport } from './mail-client.ts';

async function ping() {
  try {
    await mailTransport.verify();
    console.log('✅ Mail server (MailHog) is reachable');
  } catch (err) {
    console.error('❌ Mail server is NOT reachable:', (err as Error).message);
    process.exitCode = 1;
  }
}

ping();