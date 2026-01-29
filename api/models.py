from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Auth Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    balance: int
    telegram_chat_id: Optional[str] = None

    class Config:
        from_attributes = True

class ConnectTelegramResponse(BaseModel):
    token: str
    bot_username: str

# Transaction Models
class TransactionCreate(BaseModel):
    recipient: str
    package_type: str
    count: int

class TransactionResponse(BaseModel):
    id: int
    recipient: str
    package_type: str
    count: int
    timestamp: datetime

    class Config:
        from_attributes = True

# Interaction Models
class InteractionCreate(BaseModel):
    lead_id: int
    contact_method: str
    content: str
    new_stage: Optional[str] = None
    next_contact_date: Optional[datetime] = None

class InteractionResponse(BaseModel):
    id: int
    timestamp: datetime
    contact_method: str
    content: str

    class Config:
        from_attributes = True

# Lead Models
class LeadBase(BaseModel):
    telegram_id: Optional[int] = None
    phone: Optional[str] = None
    full_name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    stage: str = "Первый контакт"
    manager_name: Optional[str] = None

class LeadCreate(LeadBase):
    pass

class LeadResponse(LeadBase):
    id: int
    created_at: datetime
    updated_at: datetime
    next_contact_date: Optional[datetime] = None
    is_archived: bool = False
    batch_id: Optional[int] = None
    interactions: List[InteractionResponse] = []

    class Config:
        from_attributes = True

# Lead Batch Models
class LeadBatchCreate(BaseModel):
    name: str
    description: Optional[str] = None

class LeadBatchResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    file_name: Optional[str] = None
    imported_at: datetime
    count: int

    class Config:
        from_attributes = True

# Stats
class StatsResponse(BaseModel):
    total_leads: int
    total_interactions: int
    leads_by_stage: dict
    user_balance: Optional[int] = None
    telegram_connected: bool = False
    recent_transactions: List[TransactionResponse] = []
    daily_outreach_count: int = 0
    daily_goal: int = 30
    daily_growth: str = "0%"
