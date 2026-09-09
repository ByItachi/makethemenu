import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    const value = rest.join('=');
    if (key && value !== undefined && key.trim() && !process.env[key.trim()]) {
      process.env[key.trim()] = value.trim();
    }
  });
}
