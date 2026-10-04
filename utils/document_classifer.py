import mimetypes
from logs.logging import logger

SCANNABLE_MIMES = {
    'image/jpeg', 'image/png', 'image/tiff', 'image/bmp', 'image/gif',
    'application/pdf'
}

def guess_mime_from_bytes(file_path: str) -> str:
    try:
        with open(file_path, 'rb') as f:
            header = f.read(16)
        if header.startswith(b'%PDF'):
            return 'application/pdf'
        elif header.startswith(b'\xff\xd8\xff'):
            return 'image/jpeg'
        elif header.startswith(b'\x89PNG\r\n\x1a\n'):
            return 'image/png'
    except Exception as e:
        logger.error(f"Error reading magic bytes: {e}")
    return None