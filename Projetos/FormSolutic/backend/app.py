# backend/app.py

from flask import Flask, request, jsonify, send_file # type: ignore
from flask_cors import CORS # type: ignore
from sqlalchemy.exc import SQLAlchemyError # type: ignore
from io import BytesIO
import pandas as pd # type: ignore
import re
import logging

from database import db  # Importa db do database.py

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Configuração de CORS

# Configuração do banco de dados
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///clientes.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configuração do logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

db.init_app(app)  # Inicializa db com a aplicação

# Importa o modelo após a inicialização do db
with app.app_context():
    from models import Cliente
    db.create_all()

# Funções de validação
def validar_email(email):
    email_regex = r'^[^@\s]+@[^@\s]+\.[^@\s]+$'
    return re.match(email_regex, email)

def validar_telefone(telefone):
    telefone_regex = r'^\(\d{2}\) \d{5}-\d{4}$'
    return re.match(telefone_regex, telefone)

# Rotas da aplicação
@app.route('/clientes', methods=['POST'])
def adicionar_cliente():
    data = request.get_json()

    logger.info(f'Requisição de adicionar cliente recebida: {data}')

    nome = data.get('nome', '').strip()
    endereco = data.get('endereco', '').strip()
    telefone = data.get('telefone', '').strip()
    email = data.get('email', '').strip()

    # Validações no back-end
    erros = {}
    if not nome:
        erros['nome'] = 'O campo nome é obrigatório.'
    if not endereco:
        erros['endereco'] = 'O campo endereço é obrigatório.'
    if not telefone:
        erros['telefone'] = 'O campo telefone é obrigatório.'
    elif not validar_telefone(telefone):
        erros['telefone'] = 'Telefone inválido. Use o formato (XX) 99999-9999.'
    if not email:
        erros['email'] = 'O campo e-mail é obrigatório.'
    elif not validar_email(email):
        erros['email'] = 'E-mail inválido.'

    if erros:
        logger.warning(f'Validação falhou: {erros}')
        return jsonify({'erros': erros}), 400

    novo_cliente = Cliente(
        nome=nome,
        endereco=endereco,
        telefone=telefone,
        email=email
    )
    try:
        db.session.add(novo_cliente)
        db.session.commit()
        logger.info('Cliente adicionado com sucesso.')
        return jsonify({'message': 'Cliente adicionado com sucesso'}), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f'Erro ao adicionar cliente: {e}')
        # Verificar se o erro foi devido ao e-mail duplicado
        if 'UNIQUE constraint failed: clientes.email' in str(e):
            return jsonify({'erros': {'email': 'E-mail já está cadastrado.'}}), 400
        return jsonify({'erros': {'database': 'Erro ao adicionar cliente.'}}), 500

@app.route('/clientes', methods=['GET'])
def consultar_clientes():
    nome = request.args.get('nome', '')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 5))

    query = Cliente.query.filter(Cliente.nome.ilike(f'%{nome}%'))

    # Paginação usando argumentos nomeados
    pagination = query.order_by(Cliente.nome).paginate(page=page, per_page=per_page, error_out=False)
    clientes = pagination.items
    total_pages = pagination.pages

    clientes_list = [cliente.to_dict() for cliente in clientes]

    return jsonify({'clientes': clientes_list, 'total_pages': total_pages}), 200

@app.route('/clientes/<int:cliente_id>', methods=['PUT'])
def atualizar_cliente(cliente_id):
    data = request.get_json()

    cliente = Cliente.query.get_or_404(cliente_id)

    nome = data.get('nome', '').strip()
    endereco = data.get('endereco', '').strip()
    telefone = data.get('telefone', '').strip()
    email = data.get('email', '').strip()

    logger.info(f'Requisição de atualização de cliente {cliente_id}: {data}')

    # Validações
    erros = {}
    if not nome:
        erros['nome'] = 'O campo nome é obrigatório.'
    if not endereco:
        erros['endereco'] = 'O campo endereço é obrigatório.'
    if not telefone:
        erros['telefone'] = 'O campo telefone é obrigatório.'
    elif not validar_telefone(telefone):
        erros['telefone'] = 'Telefone inválido. Use o formato (XX) 99999-9999.'
    if not email:
        erros['email'] = 'O campo e-mail é obrigatório.'
    elif not validar_email(email):
        erros['email'] = 'E-mail inválido.'

    if erros:
        logger.warning(f'Validação falhou na atualização: {erros}')
        return jsonify({'erros': erros}), 400

    # Atualiza os dados do cliente
    cliente.nome = nome
    cliente.endereco = endereco
    cliente.telefone = telefone
    cliente.email = email

    try:
        db.session.commit()
        logger.info(f'Cliente {cliente_id} atualizado com sucesso.')
        return jsonify({'message': 'Cliente atualizado com sucesso'}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f'Erro ao atualizar cliente {cliente_id}: {e}')
        # Verificar se o erro foi devido ao e-mail duplicado
        if 'UNIQUE constraint failed: clientes.email' in str(e):
            return jsonify({'erros': {'email': 'E-mail já está cadastrado.'}}), 400
        return jsonify({'erros': {'database': 'Erro ao atualizar cliente.'}}), 500

@app.route('/clientes/<int:cliente_id>', methods=['DELETE'])
def deletar_cliente(cliente_id):
    cliente = Cliente.query.get_or_404(cliente_id)

    try:
        db.session.delete(cliente)
        db.session.commit()
        logger.info(f'Cliente {cliente_id} deletado com sucesso.')
        return jsonify({'message': 'Cliente deletado com sucesso'}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f'Erro ao deletar cliente {cliente_id}: {e}')
        return jsonify({'erros': {'database': 'Erro ao deletar cliente.'}}), 500

@app.route('/clientes/exportar', methods=['GET'])
def exportar_clientes():
    nome = request.args.get('nome', '')
    clientes = Cliente.query.filter(Cliente.nome.ilike(f'%{nome}%')).order_by(Cliente.nome).all()
    data = [cliente.to_dict() for cliente in clientes]
    if not data:
        return jsonify({'erros': {'exportar': 'Nenhum cliente encontrado para exportação.'}}), 404
    df = pd.DataFrame(data)
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Clientes')
    output.seek(0)
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        download_name='clientes.xlsx',
        as_attachment=True
    )

if __name__ == '__main__':
    app.run(debug=True)