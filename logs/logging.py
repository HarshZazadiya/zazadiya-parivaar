import os
import sys
import logging

os.makedirs("logs", exist_ok=True)

logger = logging.getLogger("ZazadiyaParivaar")

formatter = logging.Formatter(
    fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

stream_handler = logging.StreamHandler(sys.stdout)
file_handler = logging.FileHandler(filename="logs/logs.log", encoding="utf-8")

stream_handler.setFormatter(formatter)
file_handler.setFormatter(formatter)

logger.handlers = [stream_handler, file_handler]
logger.setLevel(logging.INFO)