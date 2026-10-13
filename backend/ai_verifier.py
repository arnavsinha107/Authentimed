import sys
import os

_ai_auth_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ai-auth"))
if _ai_auth_dir not in sys.path:
    sys.path.append(_ai_auth_dir)

from verify import verify_packaging
