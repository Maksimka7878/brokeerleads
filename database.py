from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class Lead(Base):
    __tablename__ = 'leads'

    id = Column(Integer, primary_key=True)
    telegram_id = Column(Integer, unique=True, nullable=True)  # From 'ID'
    phone = Column(String, nullable=True)  # From 'Номер телефона'
    full_name = Column(String, nullable=True)  # From 'Полное имя'
    username = Column(String, nullable=True)  # From 'Юзернейм'
    bio = Column(Text, nullable=True)  # From 'Описание профиля'
    stage = Column(String, default="Первый контакт")  # Funnel Stage
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
    contact_method = Column(String)  # email, phone, messenger
    content = Column(Text)
    
    lead = relationship("Lead", back_populates="interactions")

# Database setup
DATABASE_URL = "sqlite:///crm.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
