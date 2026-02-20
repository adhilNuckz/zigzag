/**
 * Random alias generator for anonymous users.
 * Produces names like: ShadowFox_42, NeonGhost_7, etc.
 */

const adjectives = [
  'Shadow', 'Neon', 'Phantom', 'Ghost', 'Cipher', 'Stealth', 'Dark',
  'Silent', 'Rogue', 'Void', 'Mystic', 'Crypto', 'Zero', 'Null',
  'Binary', 'Hex', 'Pixel', 'Glitch', 'Flux', 'Onyx', 'Cobalt',
  'Nova', 'Spectre', 'Vector', 'Nebula', 'Vortex', 'Pulse', 'Echo',
  'Drift', 'Storm', 'Blaze', 'Frost', 'Ember', 'Raven', 'Apex',
];

const nouns = [
  'Fox', 'Wolf', 'Hawk', 'Viper', 'Cobra', 'Lynx', 'Panther',
  'Falcon', 'Tiger', 'Bear', 'Shark', 'Eagle', 'Mantis', 'Spider',
  'Owl', 'Jaguar', 'Raven', 'Phoenix', 'Dragon', 'Hydra', 'Kraken',
  'Wraith', 'Specter', 'Daemon', 'Sentinel', 'Agent', 'Runner',
  'Hacker', 'Coder', 'Node', 'Root', 'Proxy', 'Socket', 'Kernel',
];

function generateAlias() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${adj}${noun}_${num}`;
}

module.exports = { generateAlias };
