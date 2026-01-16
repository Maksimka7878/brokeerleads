from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from datetime import datetime, timedelta
import pandas as pd
import io
import os
import uuid
from telegram import Update, Bot, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

from .database import get_db, init_db, Lead, Interaction, User, LeadTransaction, SessionLocal
from .models import (
    LeadCreate, LeadResponse, InteractionCreate, StatsResponse, 
    UserCreate, UserResponse, Token, TransactionCreate, TransactionResponse,
    ConnectTelegramResponse
)
from .auth import verify_password, get_password_hash, create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Telegram Bot Setup
TG_TOKEN = os.getenv("TG_TOKEN")
bot = Bot(token=TG_TOKEN) if TG_TOKEN else None

@app.on_event("startup")
def on_startup():
    try:
        init_db()
        ensure_admin_exists()
    except Exception as e:
        print(f"Startup error: {e}")

@app.get("/api/fix_schema")
def fix_schema(db: Session = Depends(get_db)):
    """Helper to drop and recreate leads table if schema is corrupted."""
    try:
        # Drop the table to force recreation with correct types
        db.execute(text("DROP TABLE IF EXISTS leads CASCADE"))
        db.commit()
        
        # Recreate tables
        init_db()
        
        return {"status": "success", "message": "Leads table dropped and recreated. Please try importing again."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/migrate_stages")
def migrate_stages(db: Session = Depends(get_db)):
    """Migrate leads from 'Первый контакт' to 'Новый'."""
    try:
        # Update leads with old stage name
        result = db.query(Lead).filter(Lead.stage == "Первый контакт").update({"stage": "Новый"})
        db.commit()
        return {"status": "success", "updated_count": result, "message": f"Updated {result} leads from 'Первый контакт' to 'Новый'"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def ensure_admin_exists():
    """Helper to ensure admin exists. Call on startup and if login fails."""
    try:
        db = SessionLocal()
        if not db.query(User).filter(User.username == "admin").first():
            print("Creating default admin user...")
            admin = User(
                username="admin", 
                hashed_password=get_password_hash("admin"), 
                role="admin",
                balance=10000
            )
            db.add(admin)
            db.commit()
        db.close()
    except Exception as e:
        print(f"Error ensuring admin exists: {e}")

# --- Auth Endpoints ---

@app.post("/api/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    
    # Lazy admin creation: if admin not found, try to create him (handling Vercel cold starts)
    if not user and form_data.username == "admin":
        ensure_admin_exists()
        user = db.query(User).filter(User.username == "admin").first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/users/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/api/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = User(
        username=user.username,
        hashed_password=get_password_hash(user.password),
        balance=100 # Welcome bonus
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# --- Leads Endpoints ---

@app.get("/api/leads", response_model=List[LeadResponse])
def get_leads(
    skip: int = 0, 
    limit: int = 1000, 
    search: Optional[str] = None, 
    stage: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Lead)
    
    if search:
        query = query.filter(
            (Lead.full_name.contains(search)) | 
            (Lead.phone.contains(search)) | 
            (Lead.username.contains(search))
        )
    
    if stage:
        query = query.filter(Lead.stage == stage)
        
    leads = query.offset(skip).limit(limit).all()
    return leads

@app.get("/api/leads/{lead_id}", response_model=LeadResponse)
def get_lead_details(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

@app.post("/api/interactions")
def add_interaction(
    interaction: InteractionCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_lead = db.query(Lead).filter(Lead.id == interaction.lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    new_interaction = Interaction(
        lead_id=interaction.lead_id,
        contact_method=interaction.contact_method,
        content=interaction.content
    )
    db.add(new_interaction)
    
    if interaction.new_stage:
        db_lead.stage = interaction.new_stage
    
    if interaction.next_contact_date:
        db_lead.next_contact_date = interaction.next_contact_date
        
    db_lead.updated_at = datetime.now()
    
    db.commit()
    return {"status": "success"}

# --- B2B Analytics & Distribution ---

@app.get("/api/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_leads = db.query(Lead).count()
    total_interactions = db.query(Interaction).count()
    
    stages = db.query(Lead.stage).all()
    stage_counts = {}
    for (stage,) in stages:
        stage_counts[stage] = stage_counts.get(stage, 0) + 1
    
    # Recent transactions for this user
    transactions = db.query(LeadTransaction).filter(LeadTransaction.user_id == current_user.id).order_by(LeadTransaction.timestamp.desc()).limit(10).all()
        
    return StatsResponse(
        total_leads=total_leads,
        total_interactions=total_interactions,
        leads_by_stage=stage_counts,
        user_balance=current_user.balance,
        telegram_connected=bool(current_user.telegram_chat_id),
        recent_transactions=transactions
    )

@app.post("/api/distribute")
async def distribute_leads(
    transaction: TransactionCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check balance
    if current_user.balance < transaction.count:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # Deduct balance
    current_user.balance -= transaction.count
    
    # Record transaction
    new_tx = LeadTransaction(
        user_id=current_user.id,
        recipient=transaction.recipient,
        package_type=transaction.package_type,
        count=transaction.count
    )
    db.add(new_tx)
    db.commit()
    
    # TODO: Implement actual sending logic via Telegram if recipient is a TG ID
    if bot and transaction.recipient.isdigit():
        try:
            await bot.send_message(
                chat_id=transaction.recipient, 
                text=f"🎁 You have received {transaction.count} leads of type {transaction.package_type}!"
            )
        except Exception as e:
            print(f"Failed to send Telegram message: {e}")
            
    return {"status": "success", "remaining_balance": current_user.balance}

@app.post("/api/import")
async def import_leads(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contents = await file.read()
    try:
        df = pd.read_excel(io.BytesIO(contents))
        count = 0
        for index, row in df.iterrows():
            # Handle float/int ID correctly
            raw_id = row.get('ID')
            telegram_id = None
            if pd.notna(raw_id):
                try:
                    telegram_id = int(float(raw_id))
                except:
                    telegram_id = None

            if telegram_id:
                 existing = db.query(Lead).filter(Lead.telegram_id == telegram_id).first()
                 if existing:
                     continue
            
            # Handle phone
            phone_val = row.get('Номер телефона')
            phone = None
            if pd.notna(phone_val):
                # Handle float phone numbers (e.g. 79991234567.0 -> "79991234567")
                try:
                    # Clean up string first if it's a string
                    s_val = str(phone_val).strip()
                    
                    # If it looks like a float/int
                    if s_val.replace('.','',1).isdigit():
                        if isinstance(phone_val, float) or '.' in s_val:
                            phone = str(int(float(s_val)))
                        else:
                            phone = s_val
                    else:
                        # Just keep as string if it's text (e.g. "+7...")
                        phone = s_val
                        
                    # Remove .0 suffix if it persists
                    if phone and phone.endswith(".0"):
                        phone = phone[:-2]
                except:
                    phone = None # Ignore invalid phones

            lead = Lead(
                telegram_id=telegram_id,
                phone=str(phone) if phone else None,
                full_name=str(row.get('Полное имя')) if pd.notna(row.get('Полное имя')) else None,
                username=str(row.get('Юзернейм')) if pd.notna(row.get('Юзернейм')) else None,
                bio=str(row.get('Описание профиля')) if pd.notna(row.get('Описание профиля')) else None,
                stage="Новый"
            )
            db.add(lead)
            count += 1
            
        db.commit()
        return {"status": "success", "imported_count": count}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Telegram Webhook & Integration ---

@app.get("/api/telegram/set_webhook")
async def set_webhook(url: str):
    """Helper to set webhook URL. Call this once after deployment."""
    if not bot:
        return {"status": "error", "reason": "No token"}
    
    webhook_url = f"{url}/api/telegram/webhook"
    success = await bot.set_webhook(webhook_url)
    return {"status": "success" if success else "failed", "url": webhook_url}

@app.post("/api/telegram/connect", response_model=ConnectTelegramResponse)
def connect_telegram(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    token = str(uuid.uuid4())
    current_user.connect_token = token
    db.commit()
    
    # Try to get bot username if possible, otherwise hardcode or env
    bot_username = "YourBotName" # Ideally fetch from bot.get_me() but that is async
    
    return {"token": token, "bot_username": bot_username}

@app.post("/api/telegram/webhook")
async def telegram_webhook(request: Request):
    if not bot:
        return {"status": "ignored", "reason": "No token"}
    
    data = await request.json()
    try:
        update = Update.de_json(data, bot)
    except Exception as e:
        print(f"Error parsing update: {e}")
        return {"status": "error", "detail": str(e)}
    
    if not update.message and not update.callback_query:
        return {"status": "ok"}
        
    db = SessionLocal()
    try:
        if update.message and update.message.text:
            text = update.message.text.strip()
            chat_id = update.message.chat_id
            
            # /start <token>
            if text.startswith("/start"):
                parts = text.split()
                if len(parts) == 2:
                    token = parts[1]
                    user = db.query(User).filter(User.connect_token == token).first()
                    if user:
                        user.telegram_chat_id = str(chat_id)
                        user.connect_token = None # Clear token
                        db.commit()
                        await bot.send_message(chat_id=chat_id, text=f"✅ Account connected successfully! Hello, {user.username}.")
                    else:
                        await bot.send_message(chat_id=chat_id, text="❌ Invalid or expired token. Please generate a new one on the dashboard.")
                else:
                    # Check if already connected
                    user = db.query(User).filter(User.telegram_chat_id == str(chat_id)).first()
                    if user:
                        await bot.send_message(chat_id=chat_id, text=f"👋 Welcome back, {user.username}! Use /balance to check your leads.")
                    else:
                        await bot.send_message(chat_id=chat_id, text="👋 Welcome! Please link your account by sending /start <token> from your dashboard.")
            
            # /balance
            elif text == "/balance":
                user = db.query(User).filter(User.telegram_chat_id == str(chat_id)).first()
                if user:
                    await bot.send_message(chat_id=chat_id, text=f"💰 Your balance: {user.balance} leads")
                else:
                    await bot.send_message(chat_id=chat_id, text="⚠️ Account not linked. Please use /start <token>.")
            
            # /leads
            elif text == "/leads":
                user = db.query(User).filter(User.telegram_chat_id == str(chat_id)).first()
                if user:
                    # Logic to fetch leads assigned to this user (future feature)
                    # For now just show recent transactions
                    txs = db.query(LeadTransaction).filter(LeadTransaction.user_id == user.id).order_by(LeadTransaction.timestamp.desc()).limit(5).all()
                    if txs:
                        msg = "Recent Distributions:\n" + "\n".join([f"- {t.count} ({t.package_type}) to {t.recipient}" for t in txs])
                    else:
                        msg = "No recent lead distributions."
                    await bot.send_message(chat_id=chat_id, text=msg)
                else:
                    await bot.send_message(chat_id=chat_id, text="⚠️ Account not linked.")
            
            else:
                 # Echo or Help
                 await bot.send_message(chat_id=chat_id, text="Commands:\n/balance - Check balance\n/leads - Recent activity")

        # Handle Callbacks (Buttons) - Future implementation
        # if update.callback_query:
        #    ...

    except Exception as e:
        print(f"Webhook error: {e}")
    finally:
        db.close()
        
    return {"status": "ok"}
