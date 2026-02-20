/**
 * Security Tools Plugin Architecture
 *
 * Each tool is a self-contained module with a standard interface:
 *   { name, description, execute(input) -> { result, safe: boolean } }
 *
 * New tools can be added by dropping a file into /plugins/ and
 * registering it in the registry.
 */

const virusScanner = require('./plugins/virusScanner');
const phishingChecker = require('./plugins/phishingChecker');
const leakChecker = require('./plugins/leakChecker');
const exposureChecker = require('./plugins/exposureChecker');

const registry = new Map();

function registerTool(tool) {
  registry.set(tool.name, tool);
}

function getTool(name) {
  return registry.get(name);
}

function listTools() {
  return Array.from(registry.values()).map(t => ({
    name: t.name,
    description: t.description,
    inputType: t.inputType,
  }));
}

// Register built-in tools
registerTool(virusScanner);
registerTool(phishingChecker);
registerTool(leakChecker);
registerTool(exposureChecker);

module.exports = { registerTool, getTool, listTools };
