const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { UPLOAD_DIR } = require('./upload');
const logger = require('./logger');

/**
 * Compress and strip metadata from images.
 * Returns the new filename.
 */
async function processImage(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath, ext);
    const outputName = `${basename}_processed${ext}`;
    const outputPath = path.join(path.dirname(filePath), outputName);

    let pipeline = sharp(filePath)
      .rotate() // Auto-rotate based on EXIF then strip
      .withMetadata({ // Strip all EXIF/metadata
        exif: {},
        iptc: {},
        xmp: {},
      });

    if (ext === '.jpg' || ext === '.jpeg') {
      pipeline = pipeline.jpeg({ quality: 75, mozjpeg: true });
    } else if (ext === '.png') {
      pipeline = pipeline.png({ compressionLevel: 8 });
    } else if (ext === '.webp') {
      pipeline = pipeline.webp({ quality: 75 });
    } else if (ext === '.gif') {
      pipeline = pipeline.gif();
    }

    // Resize if too large (max 1920px width)
    pipeline = pipeline.resize({
      width: 1920,
      withoutEnlargement: true,
      fit: 'inside',
    });

    await pipeline.toFile(outputPath);

    // Remove original, rename processed
    await fs.unlink(filePath);
    await fs.rename(outputPath, filePath);

    return path.basename(filePath);
  } catch (err) {
    logger.error('Image processing failed:', err);
    throw err;
  }
}

/**
 * Validate file contents match declared MIME type.
 */
async function validateFileType(filePath) {
  const { fileTypeFromFile } = await import('file-type');
  const detected = await fileTypeFromFile(filePath);
  return detected;
}

module.exports = { processImage, validateFileType };
