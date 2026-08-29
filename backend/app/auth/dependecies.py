# Re-export for backward compatibility with previous typo
from app.auth.dependencies import get_current_user, require_role, security

__all__ = ["get_current_user", "require_role", "security"]