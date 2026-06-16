from dotenv import load_dotenv
import os
from sqlalchemy import create_engine
# Load environment variables from .env file
load_dotenv()


DATABASE_URL = os.getenv("DATABASE_URL")

from sqlalchemy.orm import sessionmaker
# Create a SQLAlchemy engine
engine = create_engine(DATABASE_URL)
# print(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# add base
from sqlalchemy.orm import declarative_base
Base = declarative_base()