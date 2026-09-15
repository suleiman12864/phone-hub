const fs = require('fs').promises;
const path = require('path');
const AppError = require('../utils/appError');

const DATA_DIR = path.join(__dirname, '../../../data');

/**
 * Ensures data directory exists
 */
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    // Ignore error if directory already exists
  }
}

/**
 * Safely read JSON from the data directory asynchronously
 */
async function readJSON(filename) {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw new AppError(`Failed to read data file: ${filename}`, 500);
  }
}

/**
 * Atomically write JSON data to avoid file corruption
 */
async function writeJSON(filename, data) {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  const tempPath = `${filePath}.tmp`;

  try {
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(tempPath, content, 'utf8');
    await fs.rename(tempPath, filePath);
    return true;
  } catch (err) {
    try {
      await fs.unlink(tempPath);
    } catch {}
    throw new AppError(`Failed to write data file: ${filename}`, 500);
  }
}

module.exports = {
  readJSON,
  writeJSON,
  DATA_DIR
};
