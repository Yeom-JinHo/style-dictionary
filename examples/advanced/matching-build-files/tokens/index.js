import { readdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const tokensDir = dirname(fileURLToPath(import.meta.url));

const dirs = (p) =>
  readdirSync(p, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

export default dirs(tokensDir);
