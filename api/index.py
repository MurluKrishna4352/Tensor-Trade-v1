"""
Vercel serverless entry point for FastAPI application.
"""
import sys
import os
import logging
from pathlib import Path

# Configure logging for Vercel
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add parent directory to path so we can import from main
sys.path.insert(0, str(Path(__file__).parent.parent))

# Log environment check
logger.info("=" * 50)
logger.info("VERCEL ENVIRONMENT CHECK")
logger.info("=" * 50)

required_vars = ["GROQ_API_KEY", "OPENROUTER_API_KEY", "MISTRAL_API_KEY"]
for var in required_vars:
    value = os.getenv(var)
    logger.info(f"{var}: {'✓ SET' if value else '✗ MISSING'}")

logger.info("=" * 50)

# Import FastAPI app
try:
    from main import app
    logger.info("✓ Successfully imported main app")
except Exception as e:
    logger.error(f"✗ Failed to import main app: {e}")
    raise

# Vercel will use this app variable
handler = app
