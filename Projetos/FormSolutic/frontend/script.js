// frontend/script.js

// URL base do back-end
const API_URL = 'http://localhost:5000';

// Variáveis para paginação
let currentPage = 1;
const resultsPerPage = 5;
let totalPages = 1;
let lastQuery = '';

// Aplicando máscaras nos campos de entrada
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente carregado e analisado.');

    // Adicionar event listener para o formulário de cadastro
    const formCadastro = document.getElementById('form-cadastro');
    if (formCadastro) {
        formCadastro.addEventListener('submit', handleCadastroSubmit);
        console.log('Event listener adicionado ao formulário de cadastro.');
    } else {
        console.log('Formulário de cadastro não encontrado.');
    }

    // Adicionar event listener para o formulário de consulta
    const formConsulta = document.getElementById('form-consulta');
    if (formConsulta) {
        formConsulta.addEventListener('submit', handleConsultaSubmit);
        console.log('Event listener adicionado ao formulário de consulta.');
    } else {
        console.log('Formulário de consulta não encontrado.');
    }
});

// Função para validar o formulário de cadastro
function validarFormularioCadastro() {
    const nome = document.getElementById('nome').value.trim();
    const endereco = document.getElementById('endereco').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const email = document.getElementById('email').value.trim();

    // Expressão regular para validar telefone no formato (XX) 99999-9999
    const telefonePattern = /^\(\d{2}\) \d{5}-\d{4}$/;
    // Expressão regular para validar e-mail
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let isValid = true;

    // Limpar mensagens de erro anteriores
    limparErrosCadastro();

    if (!nome) {
        exibirErro('nome', 'Por favor, preencha o campo nome.');
        isValid = false;
    }

    if (!endereco) {
        exibirErro('endereco', 'Por favor, preencha o campo endereço.');
        isValid = false;
    }

    if (!telefone) {
        exibirErro('telefone', 'Por favor, preencha o campo telefone.');
        isValid = false;
    } else if (!telefonePattern.test(telefone)) {
        exibirErro('telefone', 'Telefone inválido. Use o formato (XX) 99999-9999.');
        isValid = false;
    }

    if (!email) {
        exibirErro('email', 'Por favor, preencha o campo e-mail.');
        isValid = false;
    } else if (!emailPattern.test(email)) {
        exibirErro('email', 'E-mail inválido.');
        isValid = false;
    }

    return isValid;
}

// Função para exibir mensagens de erro
function exibirErro(campo, mensagem) {
    const erroSpan = document.getElementById(`error-${campo}`);
    if (erroSpan) {
        erroSpan.textContent = mensagem;
    }
}

// Função para limpar mensagens de erro no formulário de cadastro
function limparErrosCadastro() {
    ['nome', 'endereco', 'telefone', 'email'].forEach(campo => {
        const erroSpan = document.getElementById(`error-${campo}`);
        if (erroSpan) {
            erroSpan.textContent = '';
        }
    });
}

// Função para cadastrar um novo cliente
async function handleCadastroSubmit(event) {
    event.preventDefault();
    console.log('Formulário de cadastro submetido.');

    if (!validarFormularioCadastro()) {
        console.log('Validação falhou.');
        return;
    }

    const nome = document.getElementById('nome').value.trim();
    const endereco = document.getElementById('endereco').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const email = document.getElementById('email').value.trim();

    console.log('Dados do cliente:', { nome, endereco, telefone, email });

    const cliente = {
        nome: nome,
        endereco: endereco,
        telefone: telefone,
        email: email
    };

    try {
        const response = await fetch(`${API_URL}/clientes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cliente)
        });

        console.log('Resposta da requisição:', response);

        const responseData = await response.json();

        if (response.ok) {
            alert('Cliente cadastrado com sucesso!');
            document.getElementById('form-cadastro').reset();
            console.log('Formulário resetado.');
        } else {
            // Se houver erros de validação no backend, exibi-los
            if (responseData.erros) {
                Object.keys(responseData.erros).forEach(campo => {
                    exibirErro(campo, responseData.erros[campo]);
                });
            } else {
                alert('Erro ao cadastrar cliente.');
            }
            console.log('Erro no cadastro:', responseData);
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

// Função para lidar com o submit do formulário de consulta
function handleConsultaSubmit(event) {
    event.preventDefault();

    lastQuery = document.getElementById('consulta-nome').value.trim();
    currentPage = 1;
    consultarClientes();
}

// Função para consultar clientes com paginação
async function consultarClientes() {
    try {
        const response = await fetch(`${API_URL}/clientes?nome=${encodeURIComponent(lastQuery)}&page=${currentPage}&per_page=${resultsPerPage}`);
        if (response.ok) {
            const data = await response.json();
            exibirClientes(data.clientes);
            totalPages = data.total_pages;
            atualizarPaginacao();
        } else {
            alert('Erro ao consultar clientes.');
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

// Função para exibir os clientes em uma tabela
function exibirClientes(clientes) {
    const resultadoDiv = document.getElementById('resultado-consulta');
    resultadoDiv.innerHTML = '';

    if (clientes.length === 0) {
        resultadoDiv.textContent = 'Nenhum cliente encontrado.';
        return;
    }

    const table = document.createElement('table');

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Nome', 'Endereço', 'Telefone', 'E-mail', 'Ações'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        th.setAttribute('data-label', text);
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    const tbody = document.createElement('tbody');
    clientes.forEach(cliente => {
        const row = document.createElement('tr');
        ['nome', 'endereco', 'telefone', 'email'].forEach(key => {
            const td = document.createElement('td');
            td.textContent = cliente[key];
            td.setAttribute('data-label', key.charAt(0).toUpperCase() + key.slice(1));
            row.appendChild(td);
        });

        // Coluna de ações
        const actionsTd = document.createElement('td');
        actionsTd.setAttribute('data-label', 'Ações');

        // Botão Editar
        const editButton = document.createElement('button');
        editButton.textContent = 'Editar';
        editButton.classList.add('editar');
        editButton.addEventListener('click', () => {
            editarCliente(cliente, row);
        });
        actionsTd.appendChild(editButton);

        // Botão Deletar
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Deletar';
        deleteButton.classList.add('deletar');
        deleteButton.addEventListener('click', () => {
            deletarCliente(cliente.id);
        });
        actionsTd.appendChild(deleteButton);

        row.appendChild(actionsTd);
        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    resultadoDiv.appendChild(table);

    // Botão para exportar em Excel
    const exportButton = document.createElement('button');
    exportButton.textContent = 'Exportar para Excel';
    exportButton.classList.add('secondary-button');
    exportButton.style.marginTop = '15px';
    exportButton.addEventListener('click', function() {
        window.location.href = `${API_URL}/clientes/exportar?nome=${encodeURIComponent(lastQuery)}`;
    });
    resultadoDiv.appendChild(exportButton);
}

// Função para editar um cliente
function editarCliente(cliente, row) {
    // Transformar células em campos editáveis
    const cells = row.querySelectorAll('td');
    const keys = ['nome', 'endereco', 'telefone', 'email'];

    keys.forEach((key, index) => {
        const cell = cells[index];
        const input = document.createElement('input');
        input.type = (key === 'email') ? 'email' : 'text';
        input.value = cliente[key];
        input.setAttribute('required', 'required');
        if (key === 'telefone') {
            input.setAttribute('pattern', '\\(\\d{2}\\) \\d{5}-\\d{4}');
            input.setAttribute('title', 'Use o formato (XX) 99999-9999');
        }
        cell.innerHTML = '';
        cell.appendChild(input);
    });

    // Atualizar os botões de ação
    const actionsTd = cells[cells.length -1];
    actionsTd.innerHTML = '';

    // Botão Salvar
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Salvar';
    saveButton.classList.add('editar');
    saveButton.addEventListener('click', () => {
        salvarCliente(cliente.id, row);
    });
    actionsTd.appendChild(saveButton);

    // Botão Cancelar
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancelar';
    cancelButton.classList.add('deletar');
    cancelButton.style.marginLeft = '5px';
    cancelButton.addEventListener('click', () => {
        consultarClientes(); // Recarrega a lista de clientes
    });
    actionsTd.appendChild(cancelButton);
}

// Função para salvar as alterações do cliente
async function salvarCliente(clienteId, row) {
    const cells = row.querySelectorAll('td');
    const keys = ['nome', 'endereco', 'telefone', 'email'];
    const updatedData = {};

    let valid = true;

    // Limpar mensagens de erro anteriores, se houver
    limparErrosEdicao(row);

    keys.forEach((key, index) => {
        const input = cells[index].querySelector('input');
        const value = input.value.trim();
        if (!value) {
            exibirErroEdicao(row, key, `O campo ${key} não pode estar vazio.`);
            valid = false;
        }
        updatedData[key] = value;
    });

    if (!valid) {
        return;
    }

    // Validações adicionais
    const telefonePattern = /^\(\d{2}\) \d{5}-\d{4}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!telefonePattern.test(updatedData.telefone)) {
        exibirErroEdicao(row, 'telefone', 'Telefone inválido. Use o formato (XX) 99999-9999.');
        return;
    }

    if (!emailPattern.test(updatedData.email)) {
        exibirErroEdicao(row, 'email', 'E-mail inválido.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/clientes/${clienteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });

        const responseData = await response.json();

        if (response.ok) {
            alert('Cliente atualizado com sucesso!');
            consultarClientes();
        } else {
            // Se houver erros de validação no backend, exibi-los
            if (responseData.erros) {
                Object.keys(responseData.erros).forEach(campo => {
                    exibirErroEdicao(row, campo, responseData.erros[campo]);
                });
            } else {
                alert('Erro ao atualizar cliente.');
            }
            console.log('Erro na atualização:', responseData);
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

// Função para deletar um cliente
async function deletarCliente(clienteId) {
    if (!confirm('Tem certeza que deseja deletar este cliente?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/clientes/${clienteId}`, {
            method: 'DELETE'
        });

        const responseData = await response.json();

        if (response.ok) {
            alert('Cliente deletado com sucesso!');
            consultarClientes();
        } else {
            // Exibir erros retornados pelo backend
            if (responseData.erros) {
                alert(`Erro ao deletar cliente: ${responseData.erros.database || 'Erro desconhecido.'}`);
            } else {
                alert('Erro ao deletar cliente.');
            }
            console.log('Erro na deleção:', responseData);
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

// Função para atualizar os botões de paginação
function atualizarPaginacao() {
    const resultadoDiv = document.getElementById('resultado-consulta');

    // Remover a paginação existente, se houver
    const existingPagination = resultadoDiv.querySelector('.pagination');
    if (existingPagination) {
        existingPagination.remove();
    }

    const paginationDiv = document.createElement('div');
    paginationDiv.classList.add('pagination');

    // Botão para página anterior
    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Anterior';
        prevButton.addEventListener('click', function() {
            currentPage--;
            consultarClientes();
        });
        paginationDiv.appendChild(prevButton);
    }

    // Exibir número da página atual
    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    pageInfo.style.margin = '0 10px';
    paginationDiv.appendChild(pageInfo);

    // Botão para próxima página
    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Próxima';
        nextButton.addEventListener('click', function() {
            currentPage++;
            consultarClientes();
        });
        paginationDiv.appendChild(nextButton);
    }

    resultadoDiv.appendChild(paginationDiv);
}

// Funções para lidar com erros na edição
function exibirErroEdicao(row, campo, mensagem) {
    const errorSpanId = `error-edicao-${campo}-${row.rowIndex}`;
    let erroSpan = row.querySelector(`#${errorSpanId}`);
    if (!erroSpan) {
        erroSpan = document.createElement('span');
        erroSpan.classList.add('error-message');
        erroSpan.id = errorSpanId;
        row.cells[getIndexByKey(campo)].appendChild(erroSpan);
    }
    erroSpan.textContent = mensagem;
}

function limparErrosEdicao(row) {
    const erroSpans = row.querySelectorAll('.error-message');
    erroSpans.forEach(span => {
        span.textContent = '';
    });
}

// Helper para obter o índice da coluna com base na chave
function getIndexByKey(key) {
    const headers = ['nome', 'endereco', 'telefone', 'email'];
    return headers.indexOf(key);
}