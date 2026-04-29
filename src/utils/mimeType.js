const MIME_BY_EXTENSION = {
  hwp: 'application/x-hwp',
  txt: 'text/plain',
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

const FALLBACK_MIME = 'application/octet-stream';

function getExtension(filename = '') {
  const lower = filename.toLowerCase();
  const idx = lower.lastIndexOf('.');
  return idx === -1 ? '' : lower.slice(idx + 1);
}

function getBaseName(filename = '') {
  const idx = filename.lastIndexOf('.');
  return idx === -1 ? filename : filename.slice(0, idx);
}

function sanitizeSegment(value = '') {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '');

  return normalized || 'file';
}

export function resolveMimeType(file) {
  const ext = getExtension(file?.name || '');
  const fromExt = MIME_BY_EXTENSION[ext] || FALLBACK_MIME;
  const fileType = (file?.type || '').trim().toLowerCase();

  if (!fileType || fileType === FALLBACK_MIME) {
    return fromExt;
  }

  return fileType;
}

export function buildStoragePath(folder, file) {
  const extension = getExtension(file?.name || '');
  const baseName = sanitizeSegment(getBaseName(file?.name || 'file'));
  const safeFilename = extension ? `${baseName}.${extension}` : baseName;

  return `${folder}/${Date.now()}-${safeFilename}`;
}
