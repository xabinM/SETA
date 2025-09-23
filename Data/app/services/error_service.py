import traceback
from datetime import datetime, timezone
from app.adapters.db import get_session
from app.models import ErrorLog

def save_error(trace_id: str, error_type: str, error: Exception):
    with get_session() as session:
        log = ErrorLog(
            trace_id=trace_id,
            error_type=error_type,
            error_message=str(error),
            stack_trace="".join(traceback.format_exception(type(error), error, error.__traceback__)),
            created_at=datetime.now(timezone.utc),
        )
        session.add(log)
        session.commit()
