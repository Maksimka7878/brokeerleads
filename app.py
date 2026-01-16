import streamlit as st
import pandas as pd
from database import get_db, init_db, Lead, Interaction
from sqlalchemy.orm import Session
import plotly.express as px
from datetime import datetime

# Initialize DB
init_db()

st.set_page_config(page_title="B2B Sales Tracker", layout="wide")

# Helper Functions
def load_data(db: Session):
    return db.query(Lead).all()

def save_interaction(db: Session, lead_id, method, content):
    interaction = Interaction(lead_id=lead_id, contact_method=method, content=content)
    db.add(interaction)
    
    # Update last contact date (optional logic)
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    lead.updated_at = datetime.now()
    
    db.commit()

# Sidebar
st.sidebar.title("Меню")
page = st.sidebar.radio("Перейти к", ["Дашборд", "Контакты", "Воронка продаж", "Импорт", "Настройки"])

# Database session
db = next(get_db())

if page == "Дашборд":
    st.title("Дашборд эффективности")
    
    leads = db.query(Lead).all()
    if not leads:
        st.info("Нет данных. Пожалуйста, импортируйте контакты.")
    else:
        col1, col2, col3 = st.columns(3)
        col1.metric("Всего лидов", len(leads))
        
        # Interactions count
        interaction_count = db.query(Interaction).count()
        col2.metric("Всего взаимодействий", interaction_count)
        
        # Leads by Stage
        df_leads = pd.DataFrame([l.__dict__ for l in leads])
        if 'stage' in df_leads.columns:
            stage_counts = df_leads['stage'].value_counts()
            col3.metric("Этапов воронки", len(stage_counts))
            
            st.subheader("Лиды по этапам")
            fig = px.bar(stage_counts, x=stage_counts.index, y=stage_counts.values, labels={'x': 'Этап', 'y': 'Количество'})
            st.plotly_chart(fig)

elif page == "Контакты":
    st.title("База контактов")
    
    # Filters
    search = st.text_input("Поиск (Имя, Телефон, Username)")
    stage_filter = st.multiselect("Фильтр по этапу", ["Первый контакт", "Презентация предложения", "Переговоры", "Заключение сделки"])
    
    query = db.query(Lead)
    if search:
        query = query.filter((Lead.full_name.contains(search)) | (Lead.phone.contains(search)) | (Lead.username.contains(search)))
    if stage_filter:
        query = query.filter(Lead.stage.in_(stage_filter))
        
    leads = query.all()
    
    # Display as dataframe
    data = []
    for l in leads:
        data.append({
            "ID": l.id,
            "Имя": l.full_name,
            "Телефон": l.phone,
            "Username": l.username,
            "Этап": l.stage,
            "Менеджер": l.manager_name,
            "Последнее обновление": l.updated_at
        })
    
    df = pd.DataFrame(data)
    st.dataframe(df, use_container_width=True)
    
    # Interaction Form
    st.subheader("Добавить взаимодействие")
    selected_lead_id = st.number_input("ID Лида", min_value=1, step=1)
    
    if selected_lead_id:
        lead = db.query(Lead).filter(Lead.id == selected_lead_id).first()
        if lead:
            st.write(f"Выбран лид: **{lead.full_name}**")
            with st.form("interaction_form"):
                method = st.selectbox("Способ связи", ["Телефон", "Email", "Мессенджер", "Встреча"])
                content = st.text_area("Содержание разговора")
                new_stage = st.selectbox("Обновить этап", ["Первый контакт", "Презентация предложения", "Переговоры", "Заключение сделки"], index=["Первый контакт", "Презентация предложения", "Переговоры", "Заключение сделки"].index(lead.stage) if lead.stage in ["Первый контакт", "Презентация предложения", "Переговоры", "Заключение сделки"] else 0)
                next_contact = st.date_input("Дата следующего контакта")
                
                submitted = st.form_submit_button("Сохранить")
                if submitted:
                    save_interaction(db, lead.id, method, content)
                    lead.stage = new_stage
                    lead.next_contact_date = datetime.combine(next_contact, datetime.min.time())
                    db.commit()
                    st.success("Взаимодействие сохранено!")
                    st.rerun()
        else:
            st.warning("Лид с таким ID не найден")

elif page == "Воронка продаж":
    st.title("Воронка продаж")
    
    leads = db.query(Lead).all()
    if leads:
        df = pd.DataFrame([l.__dict__ for l in leads])
        if 'stage' in df.columns:
            funnel_data = df['stage'].value_counts().reset_index()
            funnel_data.columns = ['stage', 'count']
            
            # Sort by custom order
            stage_order = ["Первый контакт", "Презентация предложения", "Переговоры", "Заключение сделки"]
            funnel_data['stage'] = pd.Categorical(funnel_data['stage'], categories=stage_order, ordered=True)
            funnel_data = funnel_data.sort_values('stage')
            
            fig = px.funnel(funnel_data, x='count', y='stage', title='Воронка продаж')
            st.plotly_chart(fig)
            
            # Show leads in each stage (Kanban-like simplified)
            st.subheader("Детализация по этапам")
            cols = st.columns(4)
            for i, stage in enumerate(stage_order):
                with cols[i]:
                    st.markdown(f"### {stage}")
                    stage_leads = [l for l in leads if l.stage == stage]
                    for l in stage_leads:
                        st.info(f"**{l.full_name}**\n\n{l.phone or 'Нет телефона'}")

elif page == "Импорт":
    st.title("Импорт данных")
    
    uploaded_file = st.file_uploader("Загрузите Excel файл", type=["xlsx"])
    
    if uploaded_file:
        df = pd.read_excel(uploaded_file)
        st.write("Предпросмотр данных:")
        st.dataframe(df.head())
        
        if st.button("Импортировать в базу"):
            count = 0
            for index, row in df.iterrows():
                # Check for existing
                existing = None
                if 'ID' in row and pd.notna(row['ID']):
                     existing = db.query(Lead).filter(Lead.telegram_id == row['ID']).first()
                
                if not existing:
                    lead = Lead(
                        telegram_id=row.get('ID'),
                        phone=str(row.get('Номер телефона')) if pd.notna(row.get('Номер телефона')) else None,
                        full_name=row.get('Полное имя'),
                        username=row.get('Юзернейм'),
                        bio=row.get('Описание профиля'),
                        stage="Первый контакт"
                    )
                    db.add(lead)
                    count += 1
            
            db.commit()
            st.success(f"Успешно импортировано {count} контактов!")

elif page == "Настройки":
    st.title("Настройки")
    st.info("Здесь будет конфигурация Telegram бота.")
    
    tg_token = st.text_input("Telegram Bot Token", type="password")
    chat_id = st.text_input("Ваш Chat ID для уведомлений")
    
    if st.button("Сохранить настройки"):
        # Save to a .env file or DB (mock for now)
        with open(".env", "a") as f:
            f.write(f"\nTG_TOKEN={tg_token}\nCHAT_ID={chat_id}")
        st.success("Настройки сохранены")

