import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// CLOUDINARY_URL se auto-lee del entorno; no hace falta configurar explícitamente.

/**
 * Sube un Buffer a Cloudinary.
 * @param {Buffer} buffer
 * @param {object} options  - opciones de upload_stream (folder, tags, etc.)
 * @returns {Promise<object>} resultado de Cloudinary
 */
export function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'dj-party', resource_type: 'image', ...options },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    Readable.from(buffer).pipe(stream);
  });
}

/**
 * Borra un asset por su public_id.
 */
export function deleteAsset(publicId) {
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

/**
 * Borra todos los assets que tengan un tag dado.
 * Usado al terminar la fiesta.
 */
export function deleteByTag(tag) {
  return cloudinary.api.delete_resources_by_tag(tag, { resource_type: 'image' });
}
