# backend/init_db.py

from app import app, db

with app.app_context():
    db.create_all()
    print("Banco de dados 'clientes.db' criado com sucesso na pasta instance")