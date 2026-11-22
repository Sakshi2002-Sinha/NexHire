from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

_engine_options = {"pool_pre_ping": True}
if settings.database_url.startswith("sqlite"):
    _engine_options["connect_args"] = {"check_same_thread": False}
else:
    # Small pool: managed free-tier Postgres has a low connection limit.
    _engine_options.update(pool_size=5, max_overflow=5, pool_timeout=10, pool_recycle=1800)

engine = create_engine(settings.database_url, **_engine_options)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
