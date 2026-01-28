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
import re
from telegram import Update, Bot, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

from .database import get_db, init_db, Lead, Interaction, User, LeadTransaction, LeadBatch, SessionLocal
from .models import (
    LeadCreate, LeadResponse, InteractionCreate, StatsResponse, 
    UserCreate, UserResponse, Token, TransactionCreate, TransactionResponse,
    ConnectTelegramResponse, LeadBatchCreate, LeadBatchResponse
)
from .auth import verify_password, get_password_hash, create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES, validate_password

app = FastAPI()

# Configure CORS - restrict to frontend URLs only
allowed_origins = os.getenv("ALLOWED_ORIGINS", "localhost:3000,127.0.0.1:3000").split(",")
allowed_origins = [origin.strip() for origin in allowed_origins]
# Add https/http variants
cors_origins = []
for origin in allowed_origins:
    cors_origins.append(f"http://{origin}")
    cors_origins.append(f"https://{origin}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Telegram Bot Setup
TG_TOKEN = os.getenv("TG_TOKEN")
bot = Bot(token=TG_TOKEN) if TG_TOKEN else None

# Rate limiting - track login attempts per IP
login_attempts = {}
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION = 15 * 60  # 15 minutes in seconds

def is_rate_limited(ip_address: str) -> bool:
    """Check if IP is rate limited"""
    now = datetime.utcnow()
    if ip_address in login_attempts:
        attempts, timestamp = login_attempts[ip_address]
        elapsed = (now - timestamp).total_seconds()
        if elapsed < LOCKOUT_DURATION:
            if attempts >= MAX_LOGIN_ATTEMPTS:
                return True
        else:
            # Reset after lockout period
            del login_attempts[ip_address]
    return False

def record_login_attempt(ip_address: str, success: bool = False) -> None:
    """Record a login attempt"""
    if success:
        # Clear attempts on successful login
        if ip_address in login_attempts:
            del login_attempts[ip_address]
    else:
        now = datetime.utcnow()
        if ip_address not in login_attempts:
            login_attempts[ip_address] = (1, now)
        else:
            attempts, timestamp = login_attempts[ip_address]
            login_attempts[ip_address] = (attempts + 1, now)

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
        # Use environment variable for admin password, or generate a secure default
        admin_password = os.getenv("ADMIN_PASSWORD", "Admin@2024Secure!Password")

        # Debug logging
        has_env_password = "ADMIN_PASSWORD" in os.environ
        print(f"[DEBUG] ADMIN_PASSWORD env var present: {has_env_password}")
        print(f"[DEBUG] Using {'custom' if has_env_password else 'default'} password")

        user = db.query(User).filter(User.username == "admin").first()

        if not user:
            print("[DEBUG] Creating default admin user...")
            admin = User(
                username="admin",
                hashed_password=get_password_hash(admin_password),
                role="admin",
                balance=10000
            )
            db.add(admin)
            db.commit()
            print("[DEBUG] Admin user created successfully")
        else:
            print("[DEBUG] Admin user exists, checking password...")
            # Check if password needs update
            if not verify_password(admin_password, user.hashed_password):
                print("[DEBUG] Password mismatch - updating admin password from environment variable...")
                user.hashed_password = get_password_hash(admin_password)
                db.commit()
                print("[DEBUG] Admin password updated successfully")
            else:
                print("[DEBUG] Admin password matches environment variable")

        if admin_password == "Admin@2024Secure!Password":
            print("WARNING: Using default admin password. Set ADMIN_PASSWORD environment variable in production!")

        db.close()
    except Exception as e:
        print(f"Error ensuring admin exists: {e}")

# --- Auth Endpoints ---

@app.post("/api/token", response_model=Token)
async def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    print(f"[DEBUG] Login attempt for username: {form_data.username}")

    # Get client IP address
    client_ip = request.client.host if request.client else "unknown"

    # Check rate limiting
    if is_rate_limited(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many login attempts. Please try again after {LOCKOUT_DURATION // 60} minutes.",
        )

    user = db.query(User).filter(User.username == form_data.username).first()
    print(f"[DEBUG] User found in database: {user is not None}")

    # Lazy admin creation: if admin not found, try to create him (handling Vercel cold starts)
    if not user and form_data.username == "admin":
        print("[DEBUG] Admin not found, calling ensure_admin_exists...")
        ensure_admin_exists()
        user = db.query(User).filter(User.username == "admin").first()
        print(f"[DEBUG] Admin user after ensure: {user is not None}")

    if not user:
        print("[DEBUG] User not found after all attempts")
        record_login_attempt(client_ip, success=False)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    password_valid = verify_password(form_data.password, user.hashed_password)
    print(f"[DEBUG] Password verification result: {password_valid}")

    if not password_valid:
        record_login_attempt(client_ip, success=False)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Successful login - record attempt
    print(f"[DEBUG] Login successful for user: {user.username}")
    record_login_attempt(client_ip, success=True)

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
    # Validate username
    if not user.username or len(user.username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters long")
    if not re.match(r'^[a-zA-Z0-9_]+$', user.username):
        raise HTTPException(status_code=400, detail="Username can only contain letters, numbers, and underscores")

    # Check if username already exists
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")

    # Validate password
    is_valid, error_msg = validate_password(user.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    new_user = User(
        username=user.username,
        hashed_password=get_password_hash(user.password),
        balance=100  # Welcome bonus
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
    include_archived: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Lead)
    
    # Filter out archived leads by default
    if not include_archived:
        query = query.filter(Lead.is_archived == False)
    
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

@app.get("/api/leads/count")
def get_leads_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns total count of non-archived leads (client leads)."""
    try:
        count = db.query(Lead).filter(Lead.is_archived == False).count()
        return {"count": count}
    except Exception as e:
        print(f"[DEBUG] Error counting leads: {e}")
        # If table doesn't exist or other error, return 0
        return {"count": 0}

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

@app.post("/api/leads/{lead_id}/archive")
def archive_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Archive a lead (soft delete)"""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    lead.is_archived = True
    lead.updated_at = datetime.now()
    db.commit()
    return {"status": "success", "message": "Lead archived"}

@app.post("/api/leads/{lead_id}/restore")
def restore_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Restore an archived lead"""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    lead.is_archived = False
    lead.updated_at = datetime.now()
    db.commit()
    return {"status": "success", "message": "Lead restored"}

@app.delete("/api/leads/{lead_id}")
def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Permanently delete a lead"""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Delete interactions first
    db.query(Interaction).filter(Interaction.lead_id == lead_id).delete()
    db.delete(lead)
    db.commit()
    return {"status": "success", "message": "Lead deleted permanently"}

# --- B2B Analytics & Distribution ---

@app.get("/api/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        total_leads = db.query(Lead).count()
        active_leads = db.query(Lead).filter(Lead.is_archived == False).count()
        total_interactions = db.query(Interaction).count()

        stages = db.query(Lead.stage).filter(Lead.is_archived == False).all()
        stage_counts = {}
        for (stage,) in stages:
            stage_counts[stage] = stage_counts.get(stage, 0) + 1

        # Recent transactions for this user
        transactions = db.query(LeadTransaction).filter(LeadTransaction.user_id == current_user.id).order_by(LeadTransaction.timestamp.desc()).limit(10).all()
    except Exception as e:
        print(f"[DEBUG] Error fetching stats: {e}")
        # Return empty stats if tables don't exist
        active_leads = 0
        total_interactions = 0
        stage_counts = {}
        transactions = []

    return StatsResponse(
        total_leads=active_leads,
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
    # Validate input
    if not transaction.recipient or not transaction.recipient.strip():
        raise HTTPException(status_code=400, detail="Recipient is required")

    if transaction.count <= 0:
        raise HTTPException(status_code=400, detail="Count must be greater than 0")

    # Check balance
    if current_user.balance < transaction.count:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    # Deduct balance
    current_user.balance -= transaction.count

    # Record transaction
    new_tx = LeadTransaction(
        user_id=current_user.id,
        recipient=transaction.recipient.strip(),
        package_type=transaction.package_type,
        count=transaction.count
    )
    db.add(current_user)
    db.add(new_tx)
    db.commit()
    db.refresh(current_user)

    # Send Telegram message if recipient is a TG ID
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
    batch_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contents = await file.read()
    try:
        df = pd.read_excel(io.BytesIO(contents))
        
        # Create a LeadBatch record
        batch = LeadBatch(
            name=batch_name or f"Импорт {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            file_name=file.filename,
            imported_at=datetime.now(),
            count=0
        )
        db.add(batch)
        db.flush()  # Get the batch ID
        
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
                stage="Новый",
                batch_id=batch.id
            )
            db.add(lead)
            count += 1
        
        # Update batch count
        batch.count = count
        db.commit()
        return {"status": "success", "imported_count": count, "batch_id": batch.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Lead Batches Endpoints ---

@app.get("/api/batches", response_model=List[LeadBatchResponse])
def get_batches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all import batches"""
    batches = db.query(LeadBatch).order_by(LeadBatch.imported_at.desc()).all()
    return batches

@app.get("/api/batches/{batch_id}", response_model=LeadBatchResponse)
def get_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific batch"""
    batch = db.query(LeadBatch).filter(LeadBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch

@app.delete("/api/batches/{batch_id}")
def delete_batch(
    batch_id: int,
    delete_leads: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a batch. Optionally delete associated leads."""
    batch = db.query(LeadBatch).filter(LeadBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    if delete_leads:
        # Delete interactions first
        lead_ids = [l.id for l in batch.leads]
        db.query(Interaction).filter(Interaction.lead_id.in_(lead_ids)).delete(synchronize_session=False)
        db.query(Lead).filter(Lead.batch_id == batch_id).delete(synchronize_session=False)
    else:
        # Just unlink leads from batch
        db.query(Lead).filter(Lead.batch_id == batch_id).update({"batch_id": None})
    
    db.delete(batch)
    db.commit()
    return {"status": "success", "message": "Batch deleted"}

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
