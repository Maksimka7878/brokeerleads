from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean, BigInteger
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="manager") # admin, manager
    balance = Column(Integer, default=0) # Available leads balance
    telegram_chat_id = Column(String, nullable=True, unique=True)
    connect_token = Column(String, nullable=True, unique=True)
    
    transactions = relationship("LeadTransaction", back_populates="user")

class Lead(Base):
    __tablename__ = 'leads'

    id = Column(Integer, primary_key=True)
    telegram_id = Column(BigInteger, unique=True, nullable=True)
    phone = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    username = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    stage = Column(String, default="Первый контакт")
    manager_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    next_contact_date = Column(DateTime, nullable=True)

    interactions = relationship("Interaction", back_populates="lead")

class Interaction(Base):
    __tablename__ = 'interactions'

    id = Column(Integer, primary_key=True)
    lead_id = Column(Integer, ForeignKey('leads.id'))
    timestamp = Column(DateTime, default=datetime.now)
    contact_method = Column(String)
    content = Column(Text)
    
    lead = relationship("Lead", back_populates="interactions")

class LeadTransaction(Base):
    __tablename__ = 'lead_transactions'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    recipient = Column(String) # Who received the leads
    package_type = Column(String) # e.g. "Cold", "Warm", "Premium"
    count = Column(Integer)
    timestamp = Column(DateTime, default=datetime.now)
    
    user = relationship("User", back_populates="transactions")

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # On Vercel, use /tmp for SQLite (read-only file system elsewhere)
    if os.environ.get("VERCEL"):
         DATABASE_URL = "sqlite:////tmp/crm.db"
    else:
         DATABASE_URL = "sqlite:///./crm.db"

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
