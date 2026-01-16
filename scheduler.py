import time
import schedule
import telebot
import os
from database import get_db, Lead
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

TG_TOKEN = os.getenv("TG_TOKEN")
CHAT_ID = os.getenv("CHAT_ID")

def send_daily_reminders():
    print("Checking for reminders...")
    if not TG_TOKEN or not CHAT_ID:
        print("Telegram settings not found. Please configure in the Web UI.")
        return

    bot = telebot.TeleBot(TG_TOKEN)
    db = next(get_db())
    
    try:
        today = datetime.now().date()
        leads = db.query(Lead).filter(Lead.next_contact_date != None).all()
        
        count = 0
        for lead in leads:
            if lead.next_contact_date.date() == today:
                message = (
                    f"🔔 **Напоминание о контакте!**\n\n"
                    f"👤 Клиент: {lead.full_name}\n"
                    f"📱 Телефон: {lead.phone}\n"
                    f"📊 Этап: {lead.stage}\n"
                    f"📝 Последний раз: {lead.updated_at.strftime('%Y-%m-%d')}"
                )
                try:
                    bot.send_message(CHAT_ID, message, parse_mode="Markdown")
                    count += 1
                except Exception as e:
                    print(f"Failed to send message: {e}")
        
        print(f"Sent {count} reminders.")
        
    finally:
        db.close()

# Schedule the job every day at 09:00 (or every minute for demo)
schedule.every(1).minutes.do(send_daily_reminders)

if __name__ == "__main__":
    print("Scheduler started. Press Ctrl+C to stop.")
    while True:
        schedule.run_pending()
        time.sleep(1)
