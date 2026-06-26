import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

// --- DADOS MOCKADOS DE BACKUP PARA GARANTIR PREENCHIMENTO COMPLETO IGUAL AO FIGMA ---
const MOCK_COLABORADORES = [
  { id: 'm1', nome: 'Thomas Fabio', cargo: 'Social Media', setor: 'Marketing', remuneracao: 5000.00 },
  { id: 'm2', nome: 'Luana Campos', cargo: 'Assistente de Marketing', setor: 'Marketing', remuneracao: 5000.00 },
  { id: 'm3', nome: 'Marcos Almeida', cargo: 'Designer Gráfico', setor: 'Marketing', remuneracao: 5000.00 },
  { id: 'm4', nome: 'Bruno Monteiro', cargo: 'Assistente de Vendas', setor: 'Vendas', remuneracao: 5000.00 },
  { id: 'm5', nome: 'Luiza Amarante', cargo: 'Vendedora', setor: 'Vendas', remuneracao: 5000.00 },
  { id: 'm6', nome: 'Marina Ferreira', cargo: 'Vendedora', setor: 'Vendas', remuneracao: 5000.00 },
  { id: 'm7', nome: 'Pedro Martins', cargo: 'Product Designer', setor: 'Produto', remuneracao: 5000.00 },
  { id: 'm8', nome: 'Amanda Vieira', cargo: 'UI Designer', setor: 'Produto', remuneracao: 5000.00 },
  { id: 'm9', nome: 'Emanoel Viana', cargo: 'UX Research', setor: 'Produto', remuneracao: 5000.00 }
];

const MOCK_DESPESAS = [
  { id: 'd1', categoria: 'Financeiras', titulo: 'Tarifas bancárias', valor: 250.00 },
  { id: 'd2', categoria: 'Financeiras', titulo: 'Aluguel e tarifas operadora cartão', valor: 1200.00 },
  { id: 'd3', categoria: 'Administrativas', titulo: 'Internet & Banda Larga', valor: 350.00 },
  { id: 'd4', categoria: 'Administrativas', titulo: 'Energia elétrica', valor: 850.00 },
  { id: 'd5', categoria: 'Administrativas', titulo: 'Limpeza & Higiene', valor: 450.00 },
  { id: 'd6', categoria: 'Pessoal', titulo: 'Salário de funcionários', valor: 10000.00 },
  { id: 'd7', categoria: 'Terceirização', titulo: 'Assessoria de Marketing', valor: 3000.00 },
  { id: 'd8', categoria: 'Materiais e equipamentos', titulo: 'Assinaturas de Software', valor: 1500.00 }
];

const MOCK_INVESTIMENTOS = [
  { id: 'i1', categoria: 'Marketing', titulo: 'Papelaria & Folders', valor: 5000.00 },
  { id: 'i2', categoria: 'Marketing', titulo: 'Site & SEO', valor: 5000.00 },
  { id: 'i3', categoria: 'Marketing', titulo: 'Mídia Paga (Ads)', valor: 5000.00 },
  { id: 'i4', categoria: 'Marketing', titulo: 'Campanha de Propaganda', valor: 5000.00 },
  { id: 'i5', categoria: 'Bens Materiais', titulo: 'Equipamentos de Informática', valor: 5000.00 },
  { id: 'i6', categoria: 'Bens Materiais', titulo: 'Reformas de estrutura', valor: 5000.00 },
  { id: 'i7', categoria: 'Bens Materiais', titulo: 'Mobiliário corporativo', valor: 5000.00 },
  { id: 'i8', categoria: 'Gestão empresarial', titulo: 'Consultoria Financeira', valor: 5000.00 },
  { id: 'i9', categoria: 'Gestão empresarial', titulo: 'Treinamento de Equipe', valor: 5000.00 }
];

// --- FUNÇÕES DE FORMATAÇÃO E VALIDAÇÃO DE DADOS ---

function capitalizeWords(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function isUUID(str) {
  if (!str) return false;
  const strVal = str.toString();
  const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return regex.test(strVal);
}

function validarNome(nome) {
  if (!nome) return false;
  // Apenas letras e espaços, aceitando acentuação comum
  const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
  if (!regex.test(nome)) return false;
  const partes = nome.trim().split(/\s+/);
  // Pelo menos nome e sobrenome
  if (partes.length < 2) return false;
  // Cada parte deve ter pelo menos 2 caracteres
  return partes.every(part => part.length >= 2);
}

function formatarCPF(value) {
  const limpo = value.replace(/\D/g, '').slice(0, 11);
  let formatted = limpo;
  if (limpo.length > 9) {
    formatted = `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-${limpo.slice(9)}`;
  } else if (limpo.length > 6) {
    formatted = `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6)}`;
  } else if (limpo.length > 3) {
    formatted = `${limpo.slice(0, 3)}.${limpo.slice(3)}`;
  }
  return formatted;
}

function validarCPF(cpf) {
  const limpo = cpf.replace(/\D/g, '');
  if (limpo.length !== 11) return false;
  if (/^(\d)\1+$/.test(limpo)) return false;
  
  let soma = 0;
  let resto;
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(limpo.substring(i - 1, i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.substring(9, 10))) return false;
  
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(limpo.substring(i - 1, i)) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.substring(10, 11))) return false;
  
  return true;
}

function formatarCNPJ(value) {
  const limpo = value.replace(/\D/g, '').slice(0, 14);
  let formatted = limpo;
  if (limpo.length > 12) {
    formatted = `${limpo.slice(0, 2)}.${limpo.slice(2, 5)}.${limpo.slice(5, 8)}/${limpo.slice(8, 12)}-${limpo.slice(12)}`;
  } else if (limpo.length > 8) {
    formatted = `${limpo.slice(0, 2)}.${limpo.slice(2, 5)}.${limpo.slice(5, 8)}/${limpo.slice(8)}`;
  } else if (limpo.length > 5) {
    formatted = `${limpo.slice(0, 2)}.${limpo.slice(2, 5)}.${limpo.slice(5)}`;
  } else if (limpo.length > 2) {
    formatted = `${limpo.slice(0, 2)}.${limpo.slice(2)}`;
  }
  return formatted;
}

function validarCNPJ(cnpj) {
  const limpo = cnpj.replace(/\D/g, '');
  if (limpo.length !== 14) return false;
  if (/^(\d)\1+$/.test(limpo)) return false;
  
  let tamanho = limpo.length - 2;
  let numeros = limpo.substring(0, tamanho);
  let digitos = limpo.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;
  
  tamanho = tamanho + 1;
  numeros = limpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;
  
  return true;
}

function validarEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!re.test(email)) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const local = parts[0];
  const domain = parts[1];
  
  if (local.length < 3) return false;
  if (/^([a-zA-Z0-9])\1+$/.test(local)) return false;
  if (/^([a-zA-Z0-9])\1+$/.test(domain.split('.')[0])) return false;
  
  const invalidDomains = ['teste.com', 'test.com', 'email.com', 'example.com', 'asdf.com', '123.com', 'abc.com'];
  if (invalidDomains.includes(domain.toLowerCase())) return false;
  
  return true;
}

function formatarTelefone(value) {
  const limpo = value.replace(/\D/g, '').slice(0, 11);
  let formatted = limpo;
  if (limpo.length > 10) {
    formatted = `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
  } else if (limpo.length > 6) {
    formatted = `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`;
  } else if (limpo.length > 2) {
    formatted = `(${limpo.slice(0, 2)}) ${limpo.slice(2)}`;
  } else if (limpo.length > 0) {
    formatted = `(${limpo}`;
  }
  return formatted;
}

function validarTelefone(tel) {
  const limpo = tel.replace(/\D/g, '');
  if (limpo.length < 2) return false;
  const ddd = parseInt(limpo.slice(0, 2));
  if (isNaN(ddd) || ddd < 11 || ddd > 99) return false;
  return limpo.length === 10 || limpo.length === 11;
}

function formatarCEP(value) {
  const limpo = value.replace(/\D/g, '').slice(0, 8);
  if (limpo.length > 5) {
    return `${limpo.slice(0, 5)}-${limpo.slice(5)}`;
  }
  return limpo;
}

function validarCEP(cep) {
  const limpo = cep.replace(/\D/g, '');
  return limpo.length === 8;
}

export default function App() {
  // Controle de Telas (Landing, Login, Onboardings, Hub)
  const [currentScreen, setCurrentScreen] = useState('tela_1_landing'); 

  // Referências para foco automático
  const cnpjInputRef = useRef(null);
  const cpfEmpresaInputRef = useRef(null);

  // Fale Conosco
  const [faleConoscoForm, setFaleConoscoForm] = useState({ nome: '', email: '', telefone: '', mensagem: '' });
  const [faleConoscoEnviado, setFaleConoscoEnviado] = useState(false);

  // Autenticação & Sessão do Supabase
  const [session, setSession] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  
  // Controle de Tabs no Hub Principal
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'orcamentos', 'investimentos', 'minha_empresa', 'configuracoes'
  const [subTabEmpresa, setSubTabEmpresa] = useState('menu'); // 'menu', 'despesas', 'colaboradores'
  const [calcTab, setCalcTab] = useState('servico'); // 'servico', 'produto' (para orçamentos)

  // Estados de Validação adicionais
  const [validationError, setValidationError] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [faleConoscoError, setFaleConoscoError] = useState('');

  // Scroll para o topo ao trocar de tela, aba principal ou subaba do dashboard
  useEffect(() => {
    window.scrollTo(0, 0);
    const scrollableElements = document.querySelectorAll('.overflow-y-auto');
    scrollableElements.forEach(el => {
      el.scrollTop = 0;
    });
    setValidationError('');
    setConfirmarSenha('');
    setFaleConoscoError('');
  }, [currentScreen, activeTab, subTabEmpresa]);

  // Estados dos Dados Cadastrais & Perfil
  const [userProfile, setUserProfile] = useState({ nome: 'Mariane Soares', cargo: 'Administrador', cpf: '', email: '', senha: '' });
  const [empresaTipo, setEmpresaTipo] = useState('Sim'); // 'Sim' ou 'Não'
  const [empresaInfo, setEmpresaInfo] = useState({
    cnpj: '', razaoSocial: '', nomeFantasia: '', setor: 'Tecnologia & Software',
    cep: '', rua: '', numero: '', cidade: '', estado: '', responsavel: 'Mariane Soares'
  });

  // Estados dos Orçamentos (Edição/Exclusão)
  const [orcamentoSendoEditado, setOrcamentoSendoEditado] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Controlar o foco automático nos inputs de CNPJ ou CPF ao abrir a tela de cadastro de empresa
  useEffect(() => {
    if (currentScreen === 'tela_12_cadastro_empresa') {
      const timer = setTimeout(() => {
        if (empresaTipo === 'Sim' && cnpjInputRef.current) {
          cnpjInputRef.current.focus();
        } else if (empresaTipo === 'Não' && cpfEmpresaInputRef.current) {
          cpfEmpresaInputRef.current.focus();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, empresaTipo]);

  // Estados Financeiros / Supabase + Fallback
  const [despesasEstoque, setDespesasEstoque] = useState(MOCK_DESPESAS);
  const [investimentosEstoque, setInvestimentosEstoque] = useState(MOCK_INVESTIMENTOS);
  const [colaboradoresEstoque, setColaboradoresEstoque] = useState(MOCK_COLABORADORES);

  // Formulário de Novo Colaborador (Tela 14/15)
  const [novoColab, setNovoColab] = useState({ nome: '', cargo: '', setor: 'Marketing', remuneracao: '', horasDia: '8', diasSemana: '5' });

  // Orçamentos
  const [orcamentos, setOrcamentos] = useState([
    { id: 1, titulo: 'Business Events', valor: 5000.00, vendedor: 'Marcus Coelho', status: 'Aprovado' },
    { id: 2, titulo: 'Working abc', valor: 5000.00, vendedor: 'Marcus Coelho', status: 'Aprovado' },
    { id: 3, titulo: 'Business Events', valor: 5000.00, vendedor: 'Marcus Coelho', status: 'Rejeitado' },
    { id: 4, titulo: 'Working abc', valor: 5000.00, vendedor: 'Marcus Coelho', status: 'Rejeitado' },
    { id: 5, titulo: 'Business Events', valor: 5000.00, vendedor: 'Marcus Coelho', status: 'Pendente' },
    { id: 6, titulo: 'Working abc', valor: 5000.00, vendedor: 'Marcus Coelho', status: 'Pendente' }
  ]);
  const [novoOrcamentoForm, setNovoOrcamentoForm] = useState({
    vendedor: 'Marcus Coelho', empresa: '', titulo: '', descricao: '', faturamentoReal: 80000, valorProduto: 80000
  });
  const [emailCliente, setEmailCliente] = useState('');
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState(null);

  // Sliders da Calculadora de Orçamento
  const [imposto, setImposto] = useState(50);
  const [comissao, setComissao] = useState(50);
  const [taxaCartao, setTaxaCartao] = useState(50);
  const [capacidade, setCapacidade] = useState(50);
  const [lucro, setLucro] = useState(50);

  // Passos de Onboarding de Despesas Fixas (5 Etapas)
  const [stepDespesas, setStepDespesas] = useState(0); // 0: Financeiro, 1: Administrativas, 2: Pessoal, 3: Terceirização, 4: Materiais e Equipamentos
  const [despesasWizardList, setDespesasWizardList] = useState({
    Financeiro: [
      { id: 'f1', titulo: 'Tarifas bancárias', selecionado: false, valor: 250 },
      { id: 'f2', titulo: 'Aluguel e tarifas operadora cartão', selecionado: false, valor: 1200 },
      { id: 'f3', titulo: 'DOC/ TED', selecionado: false, valor: 100 }
    ],
    Administrativas: [
      { id: 'a1', titulo: 'Telefone e celular', selecionado: false, valor: 150 },
      { id: 'a2', titulo: 'Internet', selecionado: false, valor: 200 },
      { id: 'a3', titulo: 'Energia elétrica', selecionado: false, valor: 600 },
      { id: 'a4', titulo: 'Aluguel e condomínio', selecionado: false, valor: 4500 },
      { id: 'a5', titulo: 'Água', selecionado: false, valor: 120 },
      { id: 'a6', titulo: 'Limpeza', selecionado: false, valor: 300 }
    ],
    Pessoal: [
      { id: 'p1', titulo: 'Salário de funcionários', selecionado: false, valor: 10000 },
      { id: 'p2', titulo: 'Férias e 13°', selecionado: false, valor: 2000 },
      { id: 'p3', stroke: 'currentColor', titulo: 'FGTS', selecionado: false, valor: 800 },
      { id: 'p4', titulo: 'FGTS multa', selecionado: false, valor: 400 },
      { id: 'p5', titulo: 'VT e VR', selecionado: false, valor: 1500 },
      { id: 'p6', titulo: 'INSS Empresa', selecionado: false, valor: 2200 }
    ],
    Terceirização: [
      { id: 't1', titulo: 'Contabilidade', selecionado: false, valor: 800 },
      { id: 't2', titulo: 'TI', selecionado: false, valor: 1200 },
      { id: 't3', titulo: 'Advogado', selecionado: false, valor: 1500 },
      { id: 't4', titulo: 'Marketing', selecionado: false, valor: 2500 }
    ],
    Materiais: [
      { id: 'mt1', titulo: 'Informática', selecionado: false, valor: 1000 },
      { id: 'mt2', titulo: 'Software', selecionado: false, valor: 600 },
      { id: 'mt3', titulo: 'Papelaria', selecionado: false, valor: 200 },
      { id: 'mt4', titulo: 'Manutenção de veículo', selecionado: false, valor: 1200 }
    ]
  });

  // Passos de Onboarding de Investimentos (4 Etapas)
  const [stepInvestimentos, setStepInvestimentos] = useState(0); // 0: Gestão, 1: Bens Materiais, 2: Parcelados, 3: Marketing
  const [investimentosWizardList, setInvestimentosWizardList] = useState({
    Gestao: [
      { id: 'g1', titulo: 'Consultoria', selecionado: false, valor: 5000 },
      { id: 'g2', titulo: 'Treinamentos', selecionado: false, valor: 1000 }
    ],
    BensMateriais: [
      { id: 'b1', titulo: 'Equipamentos de informática', selecionado: false, valor: 10000 },
      { id: 'b2', titulo: 'Reformas/ estrutura', selecionado: false, valor: 15000 },
      { id: 'b3', titulo: 'Mobiliário', selecionado: false, valor: 200000 }
    ],
    Parcelados: [
      { id: 'pc1', titulo: 'Automóveis', selecionado: false, valor: 85000 },
      { id: 'pc2', titulo: 'Máquinas e equipamentos', selecionado: false, valor: 45000 }
    ],
    Marketing: [
      { id: 'mk1', titulo: 'Papelaria', selecionado: false, valor: 1500 },
      { id: 'mk2', titulo: 'Site', selecionado: false, valor: 3000 },
      { id: 'mk3', titulo: 'Mídias pagas', selecionado: false, valor: 200 },
      { id: 'mk4', titulo: 'Eventos', selecionado: false, valor: 5000 }
    ]
  });

  // Estado para adicionar despesa/investimento customizado no meio do Onboarding
  const [customWizardInput, setCustomWizardInput] = useState({ titulo: '', valor: '' });
  const [showCustomWizardForm, setShowCustomWizardForm] = useState(false);

  // Inputs temporários para adicionar itens nos modais de lista
  const [newInvestimentoInput, setNewInvestimentoInput] = useState({ marketing: { title: '', value: '' }, bens: { title: '', value: '' }, gestao: { title: '', value: '' } });
  const [newDespesaInput, setNewDespesaInput] = useState({ financeiras: { title: '', value: '' }, administrativas: { title: '', value: '' }, pessoal: { title: '', value: '' } });

  // Helpers de Estilo do Tema Empreasy
  const buttonStyle = "bg-[#00a896] hover:bg-[#008f7f] text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md active:scale-[0.98] w-full text-center flex justify-center items-center gap-2";
  const buttonOutlineStyle = "bg-white border border-[#00a896] text-[#00a896] hover:bg-teal-50 font-bold py-3.5 px-6 rounded-2xl transition-all shadow-sm active:scale-[0.98] w-full text-center flex justify-center items-center gap-2";
  const textInputStyle = "w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#00a896] focus:ring-4 focus:ring-teal-100 transition-all font-medium text-slate-800 placeholder-slate-400 text-sm";

  // Busca inicial & Ouvinte de Autenticação Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        carregarDadosUsuario(session.user.id);
        setCurrentScreen(prev => {
          if (prev === 'tela_1_landing' || prev === 'tela_3_login') {
            return 'tela_2_dashboard_hub';
          }
          return prev;
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        carregarDadosUsuario(session.user.id);
        setCurrentScreen(prev => {
          if (prev === 'tela_1_landing' || prev === 'tela_3_login') {
            return 'tela_2_dashboard_hub';
          }
          return prev;
        });
      } else {
        // Deslogado - Resetar dados para o padrão do Figma
        setCurrentScreen('tela_1_landing');
        setDespesasEstoque(MOCK_DESPESAS);
        setInvestimentosEstoque(MOCK_INVESTIMENTOS);
        setColaboradoresEstoque(MOCK_COLABORADORES);
        setOrcamentos([
          { id: 1, titulo: 'Business Events', valor: 5000.00, vendedor: 'Marcus Coelho', status: 'Aprovado' },
          { id: 2, titulo: 'Working abc', valor: 5000.00, vendedor: 'Marcus Coelho', status: 'Aprovado' },
          { id: 3, titulo: 'Business Events', valor: 5000.00, vendedor: 'Marcus Coelho', status: 'Rejeitado' },
          { id: 4, titulo: 'Working abc', valor: 5000.00, vendedor: 'Marcus Coelho', status: 'Rejeitado' },
          { id: 5, titulo: 'Business Events', valor: 5000.00, vendedor: 'Marcus Coelho', status: 'Pendente' },
          { id: 6, titulo: 'Working abc', valor: 5000.00, vendedor: 'Marcus Coelho', status: 'Pendente' }
        ]);
        setUserProfile({ nome: 'Mariane Soares', cargo: 'Administrador', cpf: '', email: '', senha: '' });
        setEmpresaInfo({
          cnpj: '', razaoSocial: '', nomeFantasia: '', setor: 'Tecnologia & Software',
          cep: '', rua: '', numero: '', cidade: '', estado: '', responsavel: 'Mariane Soares'
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function carregarDadosUsuario(userId) {
    try {
      // 1. Carregar Perfil do Usuário
      const { data: profile } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (profile) {
        setUserProfile({
          nome: profile.nome || '',
          cargo: profile.cargo || 'Administrador',
          cpf: profile.cpf || '',
          email: session?.user?.email || '',
          senha: ''
        });
        setEmpresaTipo(profile.empresa_tipo || 'Não');
        setEmpresaInfo({
          cnpj: profile.cnpj || '',
          razaoSocial: profile.razao_social || '',
          nomeFantasia: profile.nome_fantasia || '',
          setor: profile.setor || 'Tecnologia & Software',
          cep: profile.cep || '',
          rua: profile.rua || '',
          numero: profile.numero || '',
          cidade: profile.cidade || '',
          estado: profile.estado || '',
          responsavel: profile.responsavel || profile.nome || 'Mariane Soares'
        });
      } else {
        // Se o perfil não existir por falha da trigger, tenta criar agora
        const newProfile = {
          id: userId,
          nome: userProfile.nome || 'Usuário',
          cargo: userProfile.cargo || 'Administrador',
          cpf: userProfile.cpf || '',
          empresa_tipo: empresaTipo
        };
        try {
          await supabase.from('perfis').insert([newProfile]);
        } catch (dbErr) {
          console.error("Erro ao criar perfil em tempo de carregamento:", dbErr);
        }
      }

      // 2. Carregar Colaboradores
      const { data: colabs } = await supabase
        .from('colaboradores')
        .select('*')
        .eq('user_id', userId);
      if (colabs && colabs.length > 0) setColaboradoresEstoque(colabs);
      
      // 3. Carregar Despesas
      const { data: desp } = await supabase
        .from('despesas')
        .select('*')
        .eq('user_id', userId);
      if (desp && desp.length > 0) setDespesasEstoque(desp);

      // 4. Carregar Investimentos
      const { data: invs } = await supabase
        .from('investimentos')
        .select('*')
        .eq('user_id', userId);
      if (invs && invs.length > 0) setInvestimentosEstoque(invs);

      // 5. Carregar Orçamentos
      const { data: orcs } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('user_id', userId);
      if (orcs && orcs.length > 0) setOrcamentos(orcs);
    } catch (e) {
      console.error("Erro ao carregar dados do Supabase:", e);
    }
  }

  // Cadastro de Novo Usuário (Onboarding)
  async function handleRegistrarUsuario() {
    if (!userProfile.email || !userProfile.senha) {
      alert('E-mail e senha são obrigatórios.');
      return;
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userProfile.email,
        password: userProfile.senha,
        options: {
          data: {
            nome: userProfile.nome,
            cargo: userProfile.cargo || 'Administrador',
            cpf: userProfile.cpf,
            empresa_tipo: empresaTipo
          }
        }
      });
      if (error) throw error;
      if (data && data.user) {
        // Fallback: Tentar inserção direta no perfil caso a trigger do banco não tenha rodado
        try {
          await supabase.from('perfis').insert([{
            id: data.user.id,
            nome: userProfile.nome,
            cargo: userProfile.cargo || 'Administrador',
            cpf: userProfile.cpf,
            empresa_tipo: empresaTipo
          }]);
        } catch (dbErr) {
          console.warn("Direct profile insert fallback error:", dbErr.message);
        }
        
        alert('Cadastro realizado com sucesso!');
        setCurrentScreen('tela_8_welcome_next');
      }
    } catch (err) {
      alert('Erro no cadastro: ' + err.message);
    }
  }

  // Login de Usuário
  async function handleLogarUsuario(e) {
    e.preventDefault();
    if (!loginEmail || !loginSenha) {
      alert('Preencha o e-mail e a senha.');
      return;
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginSenha
      });
      if (error) throw error;
      if (data && data.user) {
        alert('Login efetuado com sucesso!');
        setCurrentScreen('tela_2_dashboard_hub');
      }
    } catch (err) {
      alert('Erro no login: ' + err.message);
    }
  }

  // Login Social (Google, Facebook)
  async function handleSocialLogin(provider) {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider
      });
      if (error) throw error;
    } catch (err) {
      alert(`Erro no login com ${provider}: ` + err.message);
    }
  }

  // Função para buscar endereço pelo CEP usando ViaCEP
  async function buscarCEP(cepLimpo) {
    if (cepLimpo.length !== 8) return;
    try {
      setValidationError('Buscando endereço pelo CEP...');
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      if (data.erro) {
        setValidationError('CEP não encontrado. Digite o endereço manualmente.');
        return;
      }
      setValidationError('');
      setEmpresaInfo(prev => ({
        ...prev,
        rua: data.logradouro || '',
        cidade: data.localidade || '',
        estado: data.uf || ''
      }));
    } catch (err) {
      console.error("Erro ao buscar CEP:", err);
      setValidationError('Erro ao buscar o CEP. Digite o endereço manualmente.');
    }
  }

  // Salvar Empresa no Onboarding
  async function handleSalvarEmpresaOnboarding(e) {
    e.preventDefault();
    setValidationError('');
    
    // Validar CEP
    if (!validarCEP(empresaInfo.cep)) {
      setValidationError('CEP inválido. O CEP deve conter 8 dígitos.');
      return;
    }
    
    // Validar endereço básico
    if (!empresaInfo.rua.trim() || !empresaInfo.numero.trim() || !empresaInfo.cidade.trim() || !empresaInfo.estado.trim()) {
      setValidationError('Por favor, preencha todos os campos do endereço.');
      return;
    }
    
    if (empresaTipo === 'Sim') {
      // Validar CNPJ
      if (!validarCNPJ(empresaInfo.cnpj)) {
        setValidationError('CNPJ inválido. Digite um CNPJ correto.');
        return;
      }
      // Validar Razão Social e Nome Fantasia
      if (empresaInfo.razaoSocial.trim().length < 3) {
        setValidationError('A Razão Social deve ter pelo menos 3 caracteres.');
        return;
      }
      if (empresaInfo.nomeFantasia.trim().length < 3) {
        setValidationError('O Nome Fantasia deve ter pelo menos 3 caracteres.');
        return;
      }
      // Validar Responsável
      const respCapitalizado = capitalizeWords(empresaInfo.responsavel);
      if (!validarNome(respCapitalizado)) {
        setValidationError('Por favor, digite o nome completo do responsável (nome e sobrenome).');
        return;
      }
    } else {
      // Validar CPF
      if (!validarCPF(userProfile.cpf)) {
        setValidationError('CPF inválido. Digite um CPF correto.');
        return;
      }
      // Validar Nome completo
      const nomeCapitalizado = capitalizeWords(userProfile.nome);
      if (!validarNome(nomeCapitalizado)) {
        setValidationError('Por favor, digite o seu nome completo (nome e sobrenome).');
        return;
      }
      // Validar Telefone (salvo no campo cnpj do estado empresaInfo)
      if (!validarTelefone(empresaInfo.cnpj)) {
        setValidationError('Telefone inválido. Insira um número de telefone com DDD válido.');
        return;
      }
    }
    
    const userId = session?.user?.id;
    if (!userId) {
      setCurrentScreen('tela_onboard_despesas_wizard');
      return;
    }
    
    try {
      const respVal = empresaTipo === 'Sim' ? capitalizeWords(empresaInfo.responsavel) : capitalizeWords(userProfile.nome);
      const nomeVal = capitalizeWords(userProfile.nome);
      
      const { error } = await supabase.from('perfis').update({
        cnpj: empresaInfo.cnpj,
        razao_social: empresaTipo === 'Sim' ? empresaInfo.razaoSocial : null,
        nome_fantasia: empresaTipo === 'Sim' ? empresaInfo.nomeFantasia : null,
        setor: empresaInfo.setor,
        cep: empresaInfo.cep,
        rua: empresaInfo.rua,
        numero: empresaInfo.numero,
        cidade: empresaInfo.cidade,
        estado: empresaInfo.estado,
        responsavel: respVal,
        empresa_tipo: empresaTipo,
        nome: nomeVal,
        cpf: userProfile.cpf
      }).eq('id', userId);
      
      if (error) throw error;
      setValidationError('');
      setCurrentScreen('tela_onboard_despesas_wizard');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar dados da empresa: ' + err.message);
      setCurrentScreen('tela_onboard_despesas_wizard');
    }
  }

  // Ações de Escrita no Banco
  async function handleSalvarColaborador() {
    if (!novoColab.nome || !novoColab.cargo || !novoColab.remuneracao) {
      alert('Por favor, preencha o nome, cargo e remuneração.');
      return;
    }

    const colabObj = {
      nome: novoColab.nome,
      cargo: novoColab.cargo,
      setor: novoColab.setor,
      remuneracao: parseFloat(novoColab.remuneracao),
      user_id: session?.user?.id || null
    };

    try {
      if (session?.user?.id) {
        const { data, error } = await supabase.from('colaboradores').insert([colabObj]).select();
        if (error) throw error;
        if (data) {
          setColaboradoresEstoque([...colaboradoresEstoque.filter(c => c.id !== data[0].id), data[0]]);
        }
      } else {
        setColaboradoresEstoque([...colaboradoresEstoque, { id: Date.now().toString(), ...colabObj }]);
      }
      alert('Colaborador adicionado com sucesso!');
    } catch (err) {
      console.error(err);
      setColaboradoresEstoque([...colaboradoresEstoque, { id: Date.now().toString(), ...colabObj }]);
      alert('Adicionado localmente (banco de dados offline).');
    }

    setNovoColab({ nome: '', cargo: '', setor: 'Marketing', remuneracao: '', horasDia: '8', diasSemana: '5' });
  }

  async function handleSalvarDespesa(categoria, titulo, valor, clearInputCallback) {
    const despObj = {
      categoria,
      titulo,
      valor: parseFloat(valor),
      user_id: session?.user?.id || null
    };

    try {
      if (session?.user?.id) {
        const { data, error } = await supabase.from('despesas').insert([despObj]).select();
        if (error) throw error;
        if (data) {
          setDespesasEstoque([...despesasEstoque, data[0]]);
        }
      } else {
        setDespesasEstoque([...despesasEstoque, { id: Date.now().toString(), ...despObj }]);
      }
      clearInputCallback();
    } catch (err) {
      console.error(err);
      setDespesasEstoque([...despesasEstoque, { id: Date.now().toString(), ...despObj }]);
      clearInputCallback();
    }
  }

  async function handleSalvarInvestimento(categoria, titulo, valor, clearInputCallback) {
    const invObj = {
      categoria,
      titulo,
      valor: parseFloat(valor),
      user_id: session?.user?.id || null
    };

    try {
      if (session?.user?.id) {
        const { data, error } = await supabase.from('investimentos').insert([invObj]).select();
        if (error) throw error;
        if (data) {
          setInvestimentosEstoque([...investimentosEstoque, data[0]]);
        }
      } else {
        setInvestimentosEstoque([...investimentosEstoque, { id: Date.now().toString(), ...invObj }]);
      }
      clearInputCallback();
    } catch (err) {
      console.error(err);
      setInvestimentosEstoque([...investimentosEstoque, { id: Date.now().toString(), ...invObj }]);
      clearInputCallback();
    }
  }

  async function handleSalvarOrcamento() {
    if (!novoOrcamentoForm.titulo) {
      alert('Insira o título do projeto.');
      return;
    }
    const val = calcTab === 'servico' ? 200000 : Number(novoOrcamentoForm.valorProduto) * Number(calcMarkup());
    const orcObj = {
      titulo: novoOrcamentoForm.titulo,
      valor: val,
      vendedor: novoOrcamentoForm.vendedor,
      status: 'Pendente',
      user_id: session?.user?.id || null,
      empresa: novoOrcamentoForm.empresa || '',
      descricao: novoOrcamentoForm.descricao || '',
      faturamento_real: novoOrcamentoForm.faturamentoReal || 0,
      valor_produto: novoOrcamentoForm.valorProduto || 0,
      email_cliente: emailCliente || ''
    };

    try {
      if (session?.user?.id) {
        const { data, error } = await supabase.from('orcamentos').insert([orcObj]).select();
        if (error) throw error;
        if (data) {
          setOrcamentos([...orcamentos, data[0]]);
        }
      } else {
        setOrcamentos([...orcamentos, { id: Date.now().toString(), ...orcObj }]);
      }
      alert('Orçamento gravado com sucesso!');
      setActiveTab('orcamentos');
    } catch (err) {
      console.error(err);
      setOrcamentos([...orcamentos, { id: Date.now().toString(), ...orcObj }]);
      alert('Gravado localmente (banco de dados offline).');
      setActiveTab('orcamentos');
    }
  }

  // Excluir Orçamento com confirmação
  async function handleExcluirOrcamento(orcId) {
    if (!window.confirm("Deseja mesmo excluir este orçamento? A informação será perdida permanentemente.")) {
      return;
    }
    try {
      // Apenas tentamos deletar do banco se for um UUID válido do Supabase
      if (session?.user?.id && isUUID(orcId)) {
        const { error } = await supabase
          .from('orcamentos')
          .delete()
          .eq('id', orcId);
        if (error) throw error;
      }
      setOrcamentos(prev => prev.filter(o => o.id.toString() !== orcId.toString()));
      alert("Orçamento excluído com sucesso!");
    } catch (err) {
      console.error("Erro ao excluir orçamento:", err);
      alert("Erro ao excluir orçamento: " + err.message);
    }
  }

  // Iniciar edição de Orçamento
  function handleEditarOrcamentoClick(orc) {
    setOrcamentoSendoEditado({ ...orc });
    setIsEditModalOpen(true);
  }

  // Salvar Edição de Orçamento
  async function handleSalvarEdicaoOrcamento(e) {
    e.preventDefault();
    if (!orcamentoSendoEditado.titulo) {
      alert("O título do projeto é obrigatório.");
      return;
    }
    try {
      const orcId = orcamentoSendoEditado.id;
      const updatedObj = {
        titulo: orcamentoSendoEditado.titulo,
        valor: Number(orcamentoSendoEditado.valor) || 0,
        vendedor: orcamentoSendoEditado.vendedor,
        status: orcamentoSendoEditado.status,
        empresa: orcamentoSendoEditado.empresa || '',
        descricao: orcamentoSendoEditado.descricao || '',
        faturamento_real: Number(orcamentoSendoEditado.faturamento_real) || 0,
        valor_produto: Number(orcamentoSendoEditado.valor_produto) || 0,
        email_cliente: orcamentoSendoEditado.email_cliente || ''
      };

      // Apenas tentamos atualizar no banco se for um UUID válido do Supabase
      if (session?.user?.id && isUUID(orcId)) {
        const { error } = await supabase
          .from('orcamentos')
          .update(updatedObj)
          .eq('id', orcId);
        if (error) throw error;
      }
      
      setOrcamentos(prev => prev.map(o => o.id.toString() === orcId.toString() ? { ...o, ...updatedObj } : o));
      setIsEditModalOpen(false);
      setOrcamentoSendoEditado(null);
      alert("Orçamento atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar edição de orçamento:", err);
      alert("Erro ao salvar orçamento: " + err.message);
    }
  }

  // Cálculos
  const calcMarkup = () => {
    const somaPercentuais = (Number(imposto) + Number(comissao) + Number(taxaCartao) + Number(lucro)) / 100;
    if (somaPercentuais >= 1) return 9.99; 
    return (1 / (1 - somaPercentuais)).toFixed(2);
  };

  const calcTotalOrcamento = () => {
    if (calcTab === 'servico') {
      const percentualExtra = (Number(imposto) + Number(comissao) + Number(taxaCartao) + Number(lucro)) / 100;
      return (200000 * (1 + percentualExtra)).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    } else {
      const total = Number(novoOrcamentoForm.valorProduto) * Number(calcMarkup());
      return total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    }
  };

  const handleEnviarOrcamento = (e) => {
    e.preventDefault();
    if (!emailCliente) {
      alert('Insira um e-mail válido.');
      return;
    }
    alert(`Orçamento "${orcamentoSelecionado?.titulo || 'Business Events'}" enviado com sucesso para ${emailCliente}!`);
    setEmailCliente('');
    setActiveTab('orcamentos');
  };

  const handleNextDespesasWizard = async () => {
    if (stepDespesas < 4) {
      setStepDespesas(stepDespesas + 1);
      setShowCustomWizardForm(false);
      setCustomWizardInput({ titulo: '', valor: '' });
    } else {
      const selecionadas = [];
      Object.keys(despesasWizardList).forEach(cat => {
        despesasWizardList[cat].forEach(item => {
          if (item.selecionado) {
            selecionadas.push({ categoria: cat, titulo: item.titulo, valor: item.valor });
          }
        });
      });
      if (selecionadas.length > 0) {
        if (session?.user) {
          const despesasToSave = selecionadas.map(d => ({ ...d, user_id: session.user.id }));
          try {
            const { data, error } = await supabase.from('despesas').insert(despesasToSave).select();
            if (error) throw error;
            if (data) {
              setDespesasEstoque(data);
            } else {
              setDespesasEstoque(selecionadas.map((s, idx) => ({ id: idx.toString(), ...s })));
            }
          } catch (err) {
            console.error('Erro ao salvar despesas onboarding:', err);
            setDespesasEstoque(selecionadas.map((s, idx) => ({ id: idx.toString(), ...s })));
          }
        } else {
          setDespesasEstoque(selecionadas.map((s, idx) => ({ id: idx.toString(), ...s })));
        }
      }
      setCurrentScreen('tela_onboard_investimentos_wizard');
    }
  };

  const handleAddCustomDespesaWizard = () => {
    if (!customWizardInput.titulo || !customWizardInput.valor) return;
    const categoriasKeys = ['Financeiro', 'Administrativas', 'Pessoal', 'Terceirização', 'Materiais'];
    const currentCatKey = categoriasKeys[stepDespesas];
    const newItems = [...despesasWizardList[currentCatKey], {
      id: 'cst_d_' + Date.now(),
      titulo: customWizardInput.titulo,
      selecionado: true,
      valor: parseFloat(customWizardInput.valor)
    }];
    setDespesasWizardList({ ...despesasWizardList, [currentCatKey]: newItems });
    setCustomWizardInput({ titulo: '', valor: '' });
    setShowCustomWizardForm(false);
  };

  const handleNextInvestimentosWizard = async () => {
    if (stepInvestimentos < 3) {
      setStepInvestimentos(stepInvestimentos + 1);
      setShowCustomWizardForm(false);
      setCustomWizardInput({ titulo: '', valor: '' });
    } else {
      const selecionadas = [];
      Object.keys(investimentosWizardList).forEach(cat => {
        investimentosWizardList[cat].forEach(item => {
          if (item.selecionado) {
            selecionadas.push({ categoria: cat, titulo: item.titulo, valor: item.valor });
          }
        });
      });
      if (selecionadas.length > 0) {
        if (session?.user) {
          const invsToSave = selecionadas.map(i => ({ ...i, user_id: session.user.id }));
          try {
            const { data, error } = await supabase.from('investimentos').insert(invsToSave).select();
            if (error) throw error;
            if (data) {
              setInvestimentosEstoque(data);
            } else {
              setInvestimentosEstoque(selecionadas.map((s, idx) => ({ id: idx.toString(), ...s })));
            }
          } catch (err) {
            console.error('Erro ao salvar investimentos onboarding:', err);
            setInvestimentosEstoque(selecionadas.map((s, idx) => ({ id: idx.toString(), ...s })));
          }
        } else {
          setInvestimentosEstoque(selecionadas.map((s, idx) => ({ id: idx.toString(), ...s })));
        }
      }
      setCurrentScreen('tela_14_add_colaborador');
    }
  };

  const handleAddCustomInvestimentoWizard = () => {
    if (!customWizardInput.titulo || !customWizardInput.valor) return;
    const categoriasKeys = ['Gestao', 'BensMateriais', 'Parcelados', 'Marketing'];
    const currentCatKey = categoriasKeys[stepInvestimentos];
    const newItems = [...investimentosWizardList[currentCatKey], {
      id: 'cst_i_' + Date.now(),
      titulo: customWizardInput.titulo,
      selecionado: true,
      valor: parseFloat(customWizardInput.valor)
    }];
    setInvestimentosWizardList({ ...investimentosWizardList, [currentCatKey]: newItems });
    setCustomWizardInput({ titulo: '', valor: '' });
    setShowCustomWizardForm(false);
  };

  const getSelectedDespesasTotal = () => {
    const categoriasKeys = ['Financeiro', 'Administrativas', 'Pessoal', 'Terceirização', 'Materiais'];
    const currentCatKey = categoriasKeys[stepDespesas];
    return despesasWizardList[currentCatKey]
      .filter(i => i.selecionado)
      .reduce((sum, item) => sum + item.valor, 0);
  };

  // SVGs EXCLUSIVOS E ULTRA PREMIUM PARA ILUSTRAÇÕES DO ONBOARDING
  const renderIllustrationMagnifyingGlass = () => (
    <svg className="w-48 h-48 mx-auto text-teal-100" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="80" fill="white" fillOpacity="0.15" />
      <circle cx="95" cy="85" r="45" stroke="white" strokeWidth="6" fill="#00a896" />
      <line x1="127" y1="117" x2="167" y2="157" stroke="white" strokeWidth="8" strokeLinecap="round" />
      <path d="M70 85C70 70 80 60 95 60" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <circle cx="95" cy="85" r="5" fill="white" />
    </svg>
  );

  const renderIllustrationBottle = () => (
    <svg className="w-48 h-48 mx-auto text-teal-100" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="80" fill="white" fillOpacity="0.15" />
      <path d="M50 140C80 140 80 130 110 130C140 130 140 140 170 140" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <path d="M40 155C70 155 70 145 100 145C130 145 130 155 160 155" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <rect x="70" y="80" width="70" height="32" rx="16" transform="rotate(-20 70 80)" stroke="white" strokeWidth="5" fill="#00a896" />
      <rect x="135" y="55" width="12" height="15" rx="3" transform="rotate(-20 135 55)" fill="white" />
    </svg>
  );

  const renderIllustrationMailman = () => (
    <svg className="w-48 h-48 mx-auto text-teal-100" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="80" fill="white" fillOpacity="0.15" />
      <rect x="50" y="70" width="100" height="65" rx="10" stroke="white" strokeWidth="5" fill="#00a896" />
      <path d="M50 72L100 105L150 72" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const renderIllustrationSafe = () => (
    <svg className="w-48 h-48 mx-auto text-teal-100" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="80" fill="white" fillOpacity="0.15" />
      <rect x="60" y="50" width="80" height="100" rx="12" stroke="white" strokeWidth="6" fill="#00a896" />
      <circle cx="100" cy="100" r="22" stroke="white" strokeWidth="5" fill="#00a896" />
      <circle cx="100" cy="100" r="5" fill="white" />
    </svg>
  );

  const scrollToSection = (sectionId) => {
    if (currentScreen !== 'tela_1_landing') {
      setCurrentScreen('tela_1_landing');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased flex flex-col justify-between selection:bg-teal-100 selection:text-teal-900">
      
      {/* =========================================================================
          TELA 1: LANDING PAGE (EXATAMENTE COMO O LAYOUT DA PRIMEIRA PÁGINA DO PDF)
         ========================================================================= */}
      {currentScreen === 'tela_1_landing' && (
        <div className="flex-1 flex flex-col">
          {/* Header exatamente idêntico ao Figma */}
          <header className="bg-white sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
              {/* Logo com o Ícone Empreasy */}
              <div className="flex items-center gap-2 w-[212px] h-[46px] cursor-pointer" onClick={() => setCurrentScreen('tela_1_landing')}>
                <img src="/Vector.png" alt="Empreasy Logo" className="w-8 h-8 object-contain" />
                <span className="text-3xl font-extrabold tracking-tight flex items-center">
                  <span className="text-[#004650]">Empr</span>
                  <span className="text-[#00B3C9]">easy</span>
                </span>
              </div>
              
              {/* Menu Central */}
              <nav className="hidden md:flex space-x-12 font-semibold text-[#004750] font-['Nunito'] text-[20px]">
                <span onClick={() => scrollToSection('secao-produto')} className="hover:text-[#00b3c8] cursor-pointer transition-colors">Produto</span>
                <span onClick={() => setCurrentScreen('tela_9_planos')} className="hover:text-[#00b3c8] cursor-pointer transition-colors">Preços</span>
                <span onClick={() => setCurrentScreen('tela_fale_conosco')} className="hover:text-[#00b3c8] cursor-pointer transition-colors">Fale conosco</span>
              </nav>
              
              {/* Botão Login Direito (Retângulo Arredondado conforme Figma) */}
              <button 
                onClick={() => setCurrentScreen('tela_3_login')} 
                className="bg-[#00B3C9] hover:bg-[#009eb2] text-white font-['Montserrat'] font-semibold text-[16px] w-[168px] h-[48px] flex items-center justify-center rounded-[12px] transition-all shadow-sm active:scale-95"
              >
                Login
              </button>
            </div>
          </header>
          
          {/* Sessão Principal - Hero Section (Página 1 do PDF) */}
          <main className="flex-1 flex flex-col justify-between items-center text-center max-w-7xl mx-auto px-6 pt-16 relative overflow-visible">
            {/* Título Principal */}
            <h1 className="text-[32px] md:text-[40px] font-semibold text-[#004750] font-['Nunito'] max-w-5xl leading-[1.22] tracking-tight">
              Um sistema que cuida da sua empresa por <br className="hidden md:inline" /> você. Tenha na sua mão todos os <br className="hidden md:inline" /> resultados
            </h1>
            
            {/* Subtítulo */}
            <p className="text-[18px] md:text-[20px] text-[#808080] font-['Nunito'] font-normal mt-6 max-w-3xl leading-relaxed">
              Cadastre todos os seus gastos, emita orçamentos e precifique o seu produto <br className="hidden md:inline" /> ou serviço de forma ágil e rápida em um só lugar
            </p>

            {/* Imagem de Alta Fidelidade do Figma (Telas Sobrepostas com Glow) */}
            <div className="relative w-full max-w-5xl mt-12 pb-10 flex justify-center items-center overflow-visible">
              {/* Elipse Azul Suave do Figma */}
              <div className="absolute w-[600px] h-[350px] md:w-[850px] md:h-[500px] bg-[#e4f6f9] rounded-full blur-[80px] opacity-80 -z-10 bottom-4 left-1/2 -translate-x-1/2"></div>
              <img 
                src="/Group_850.png" 
                alt="Telas do Empreasy" 
                className="w-full h-auto select-none pointer-events-none relative z-10"
              />
            </div>
          </main>

          {/* =========================================================================
              SEÇÃO ADICIONAL: PAGINA 3 DO PDF (CONVITE / CADASTRO)
             ========================================================================= */}
          <section id="secao-produto" className="bg-white border-t border-slate-100 py-24 w-full relative overflow-hidden">
            {/* Elipse superior direito do Figma */}
            <div className="absolute w-[600px] h-[350px] md:w-[850px] md:h-[500px] bg-[#e4f6f9] rounded-full blur-[80px] opacity-70 -z-10 -top-40 -right-40"></div>
            
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
              
              {/* Lado Esquerdo (Textos e Botões do PDF Página 3) */}
              <div className="text-left space-y-8 lg:max-w-xl">
                <h2 className="text-[32px] md:text-[40px] font-semibold text-[#004750] font-['Nunito'] leading-[1.22] tracking-tight">
                  Venha conhecer uma nova <br className="hidden md:inline" /> forma de gerir os gastos da <br className="hidden md:inline" /> sua empresa
                </h2>
                
                <p className="text-[18px] md:text-[20px] text-[#808080] font-['Nunito'] font-normal leading-relaxed max-w-lg">
                  Ainda não conhece a Empreasy? Que tal dar uma <br className="hidden md:inline" /> olhada no nosso produto?
                </p>
                
                {/* Botões Retângulo Arredondado conforme Figma */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4 max-w-md">
                  <button 
                    onClick={() => setCurrentScreen('tela_4_onboarding_nome')} 
                    className="bg-[#00b3c8] hover:bg-[#009cb0] text-white font-bold py-3.5 px-8 rounded-[12px] transition-all shadow-md text-base active:scale-95 text-center flex-1"
                  >
                    Cadastrar agora
                  </button>
                  <button 
                    onClick={() => setCurrentScreen('tela_9_planos')} 
                    className="bg-white border-2 border-[#00b3c8] text-[#00b3c8] hover:bg-slate-50 font-bold py-3.5 px-8 rounded-[12px] transition-all text-base active:scale-95 text-center flex-1"
                  >
                    Conhecer planos
                  </button>
                </div>
              </div>

              {/* Lado Direito (Mockup Oficial do Dashboard - Figma Group 851) */}
              <div className="flex-1 w-full flex justify-center items-center">
                <img 
                  src="/Group_851.png" 
                  alt="Painel de Controle Oficial Empreasy" 
                  className="w-full max-w-xl h-auto select-none pointer-events-none rounded-[20px] shadow-xl border border-slate-100"
                />
              </div>

            </div>
          </section>
        </div>
      )}

      {/* =========================================================================
          TELA 3: LOGIN (Split Layout)
         ========================================================================= */}
      {currentScreen === 'tela_3_login' && (
        <div className="flex-1 flex flex-col md:flex-row min-h-screen justify-center items-center bg-slate-50 py-8">
          {/* Lado Esquerdo - Ilustração Oficial do Figma */}
          <div className="hidden md:flex w-[804px] h-[900px] bg-[#004750] relative flex-col justify-center items-center rounded-l-[28px] shadow-2xl z-20 overflow-hidden">
            {/* Ilustração vetorial centralizada */}
            <div className="w-[400px] h-[400px] flex items-center justify-center">
              <img 
                src="/Sign In.svg" 
                alt="Controle dos gastos e orçamentos na palma da sua mão" 
                className="w-full h-full object-contain select-none pointer-events-none"
              />
            </div>
            {/* Texto sobreposto com Nunito semibold 40 */}
            <div className="mt-8 text-center px-16 max-w-2xl">
              <h2 className="text-[40px] font-semibold text-white font-['Nunito'] leading-[1.2] tracking-tight">
                Controle dos gastos e orçamentos <br /> na palma da sua mão
              </h2>
            </div>
          </div>
          
          {/* Lado Direito - Formulário */}
          <div className="w-full md:w-[636px] h-[900px] bg-white flex flex-col justify-between overflow-hidden rounded-r-[28px] md:rounded-l-none relative">
            <div className="p-12 md:p-16 flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-center gap-3 w-[358px] h-[58px] mx-auto cursor-pointer" onClick={() => setCurrentScreen('tela_1_landing')}>
                <img src="/Vector.png" alt="Empreasy Logo" className="w-10 h-10 object-contain" />
                <span className="text-4xl font-extrabold tracking-tight flex items-center">
                  <span className="text-[#004750]">Empr</span>
                  <span className="text-[#00B3C9]">easy</span>
                </span>
              </div>
              
              <div className="my-auto py-6 max-w-[360px] w-full mx-auto text-left">
                <h3 className="text-3xl font-black text-[#004750] mb-2 font-['Nunito']">Entrar na sua conta</h3>
                <p className="text-[#808080] text-sm mb-8 font-medium font-['Nunito']">Insira seus dados para acessar o painel administrativo</p>
                
                <form onSubmit={handleLogarUsuario} className="space-y-4">
                  {/* Input Email com ícone */}
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#808080]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                      </svg>
                    </span>
                    <input 
                      type="email" 
                      placeholder="E-mail" 
                      required 
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="pl-12 w-full h-[60px] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#00B3C9] focus:ring-4 focus:ring-[#E5F7F9] transition-all font-medium text-slate-800 placeholder-[#808080] text-sm font-['Nunito']" 
                    />
                  </div>
                  
                  {/* Input Senha com ícone */}
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#808080]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                      </svg>
                    </span>
                    <input 
                      type="password" 
                      placeholder="Senha" 
                      required 
                      value={loginSenha}
                      onChange={e => setLoginSenha(e.target.value)}
                      className="pl-12 w-full h-[60px] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#00B3C9] focus:ring-4 focus:ring-[#E5F7F9] transition-all font-medium text-slate-800 placeholder-[#808080] text-sm font-['Nunito']" 
                    />
                  </div>
                  
                  {/* Termos de serviço centralizados */}
                  <p className="text-[12px] text-slate-400 leading-relaxed font-normal text-center py-2 max-w-sm mx-auto font-['Nunito']">
                    Ao criar uma conta você estará de acordo com os <span className="text-[#00B3C9] font-bold hover:underline cursor-pointer">Termos de serviço</span> e <span className="text-[#00B3C9] font-bold hover:underline cursor-pointer">Políticas de privacidade</span>.
                  </p>
                  
                  <button type="submit" className="bg-[#00B3C9] hover:bg-[#009eb2] text-white font-bold h-[60px] px-6 rounded-xl transition-all shadow-md active:scale-[0.98] w-full text-center flex justify-center items-center gap-2 mt-4 font-['Nunito']">
                    Entrar
                  </button>
                </form>
                
                <div className="relative my-6 text-center">
                  <hr className="border-slate-100" />
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-4 text-xs font-bold text-[#808080] font-['Nunito']">ou</span>
                </div>
                
                <div className="space-y-3">
                  <button onClick={() => handleSocialLogin('google')} className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-[#808080] font-bold h-[60px] rounded-xl flex items-center justify-center gap-3 transition-all text-sm shadow-sm font-['Nunito']">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Fazer login com Google
                  </button>
                  <button onClick={() => handleSocialLogin('facebook')} className="w-full bg-[#3B5998] hover:bg-[#2d4373] text-white font-bold h-[60px] rounded-xl flex items-center justify-center gap-3 transition-all text-sm shadow-sm font-['Nunito']">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Fazer login com Facebook
                  </button>
                </div>
              </div>
            </div>
            
            {/* Barra inferior de rodapé azul-claro suave */}
            <div className="bg-[#E5F7F9] h-[70px] flex items-center justify-center border-t border-[#d1edf1]">
              <button 
                onClick={() => setCurrentScreen('tela_4_onboarding_nome')} 
                className="text-sm text-slate-500 font-semibold font-['Nunito']"
              >
                Não possui cadastro? <span className="text-[#00B3C9] font-bold hover:underline">Clique aqui!</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TELAS 4, 5, 6, 7: ONBOARDING DE IDENTIFICAÇÃO (Split Screen)
         ========================================================================= */}
      {['tela_4_onboarding_nome', 'tela_5_onboarding_cpf', 'tela_6_onboarding_email', 'tela_7_onboarding_senha'].includes(currentScreen) && (
        <div className="flex-1 flex flex-col md:flex-row min-h-screen">
          {/* Lado Esquerdo - Painel Informativo com Ilustrações Dinâmicas */}
          <div className="w-full md:flex-1 bg-[#00a896] p-8 md:p-16 flex flex-col justify-between text-white relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-widest bg-teal-800 bg-opacity-40 px-4 py-1.5 rounded-full border border-teal-600/30">
                1. Identificação
              </span>
              <h2 className="text-4xl md:text-5xl font-black mt-8 mb-4 tracking-tight">Bem vindo ao Empreasy! 😊</h2>
              <p className="text-teal-50 text-base md:text-lg max-w-md font-medium leading-relaxed">
                Estamos aqui para ajudá-lo! Então, que tal nos conhecermos um pouco mais?
              </p>
            </div>
            
            <div className="my-10">
              {currentScreen === 'tela_4_onboarding_nome' && renderIllustrationMagnifyingGlass()}
              {currentScreen === 'tela_5_onboarding_cpf' && renderIllustrationBottle()}
              {currentScreen === 'tela_6_onboarding_email' && renderIllustrationMailman()}
              {currentScreen === 'tela_7_onboarding_senha' && renderIllustrationSafe()}
            </div>
            
            {/* Indicador de Progresso (Bottom) */}
            <div className="flex items-center gap-3">
              <div className={`h-2.5 rounded-full transition-all duration-300 ${currentScreen === 'tela_4_onboarding_nome' ? 'w-12 bg-white' : 'w-6 bg-teal-700/50'}`}></div>
              <div className={`h-2.5 rounded-full transition-all duration-300 ${currentScreen === 'tela_5_onboarding_cpf' ? 'w-12 bg-white' : 'w-6 bg-teal-700/50'}`}></div>
              <div className={`h-2.5 rounded-full transition-all duration-300 ${currentScreen === 'tela_6_onboarding_email' ? 'w-12 bg-white' : 'w-6 bg-teal-700/50'}`}></div>
              <div className={`h-2.5 rounded-full transition-all duration-300 ${currentScreen === 'tela_7_onboarding_senha' ? 'w-12 bg-white' : 'w-6 bg-teal-700/50'}`}></div>
            </div>
          </div>
          
          {/* Lado Direito - Pergunta do Fluxo */}
          <div className="w-full md:w-[500px] bg-white p-8 md:p-12 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-slate-400">PASSO {currentScreen === 'tela_4_onboarding_nome' ? '1' : currentScreen === 'tela_5_onboarding_cpf' ? '2' : currentScreen === 'tela_6_onboarding_email' ? '3' : '4'} DE 4</span>
              <button onClick={() => setCurrentScreen('tela_1_landing')} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-all">Cancelar</button>
            </div>
            
            <div className="my-auto py-10 max-w-sm w-full mx-auto">
              {currentScreen === 'tela_4_onboarding_nome' && (
                <div className="space-y-6">
                  <h3 className="text-3xl font-black text-slate-800">Qual o seu nome?</h3>
                  <input 
                    type="text" 
                    placeholder="Nome e Sobrenome" 
                    value={userProfile.nome} 
                    onChange={(e) => { setValidationError(''); setUserProfile({...userProfile, nome: e.target.value}); }} 
                    className={textInputStyle} 
                  />
                  {validationError && (
                    <p className="text-red-500 text-sm font-semibold mt-1">{validationError}</p>
                  )}
                  <button 
                    onClick={() => {
                      const nomeCap = capitalizeWords(userProfile.nome);
                      if (!validarNome(nomeCap)) {
                        setValidationError('Por favor, digite seu nome e sobrenome completo (apenas letras).');
                        return;
                      }
                      setUserProfile({...userProfile, nome: nomeCap});
                      setValidationError('');
                      setCurrentScreen('tela_5_onboarding_cpf');
                    }} 
                    className={buttonStyle}
                  >
                    Ok
                  </button>
                </div>
              )}

              {currentScreen === 'tela_5_onboarding_cpf' && (
                <div className="space-y-6">
                  <h3 className="text-3xl font-black text-slate-800">Seu CPF?</h3>
                  <input 
                    type="text" 
                    placeholder="CPF (apenas números)" 
                    value={userProfile.cpf} 
                    onChange={(e) => { setValidationError(''); setUserProfile({...userProfile, cpf: formatarCPF(e.target.value)}); }} 
                    className={textInputStyle} 
                  />
                  {validationError && (
                    <p className="text-red-500 text-sm font-semibold mt-1">{validationError}</p>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => { setValidationError(''); setCurrentScreen('tela_4_onboarding_nome'); }} className={buttonOutlineStyle}>Voltar</button>
                    <button 
                      onClick={() => {
                        if (!validarCPF(userProfile.cpf)) {
                          setValidationError('Por favor, insira um CPF válido e com todos os dígitos corretos.');
                          return;
                        }
                        setValidationError('');
                        setCurrentScreen('tela_6_onboarding_email');
                      }} 
                      className={buttonStyle}
                    >
                      Ok
                    </button>
                  </div>
                </div>
              )}

              {currentScreen === 'tela_6_onboarding_email' && (
                <div className="space-y-6">
                  <h3 className="text-3xl font-black text-slate-800">E seu e-mail?</h3>
                  <input 
                    type="email" 
                    placeholder="E-mail" 
                    value={userProfile.email} 
                    onChange={(e) => { setValidationError(''); setUserProfile({...userProfile, email: e.target.value}); }} 
                    className={textInputStyle} 
                  />
                  {validationError && (
                    <p className="text-red-500 text-sm font-semibold mt-1">{validationError}</p>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => { setValidationError(''); setCurrentScreen('tela_5_onboarding_cpf'); }} className={buttonOutlineStyle}>Voltar</button>
                    <button 
                      onClick={() => {
                        if (!validarEmail(userProfile.email)) {
                          setValidationError('Por favor, insira um e-mail válido para evitar cadastros incorretos.');
                          return;
                        }
                        setValidationError('');
                        setCurrentScreen('tela_7_onboarding_senha');
                      }} 
                      className={buttonStyle}
                    >
                      Ok
                    </button>
                  </div>
                </div>
              )}

              {currentScreen === 'tela_7_onboarding_senha' && (
                <div className="space-y-6">
                  <h3 className="text-3xl font-black text-slate-800">Crie uma senha</h3>
                  <div className="space-y-4">
                    <div>
                      <input 
                        type="password" 
                        placeholder="Senha (mínimo 6 caracteres)" 
                        value={userProfile.senha} 
                        onChange={(e) => { setValidationError(''); setUserProfile({...userProfile, senha: e.target.value}); }} 
                        className={textInputStyle} 
                      />
                    </div>
                    <div>
                      <input 
                        type="password" 
                        placeholder="Redigite a senha" 
                        value={confirmarSenha} 
                        onChange={(e) => { setValidationError(''); setConfirmarSenha(e.target.value); }} 
                        className={textInputStyle} 
                      />
                    </div>
                  </div>
                  {validationError && (
                    <p className="text-red-500 text-sm font-semibold mt-1">{validationError}</p>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => { setValidationError(''); setCurrentScreen('tela_6_onboarding_email'); }} className={buttonOutlineStyle}>Voltar</button>
                    <button 
                      onClick={() => {
                        if (!userProfile.senha || userProfile.senha.length < 6) {
                          setValidationError('A senha precisa conter no mínimo 6 caracteres.');
                          return;
                        }
                        if (userProfile.senha !== confirmarSenha) {
                          setValidationError('As senhas não coincidem. Digite a mesma senha nos dois campos.');
                          return;
                        }
                        setValidationError('');
                        handleRegistrarUsuario();
                      }} 
                      className={buttonStyle}
                    >
                      Ok
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center text-xs font-semibold text-slate-400 hover:text-[#00a896] cursor-pointer hover:underline">
              Precisa de ajuda? Entre em contato
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TELA 8: WELCOME (Transição Pós-Cadastro)
         ========================================================================= */}
      {currentScreen === 'tela_8_welcome_next' && (
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
          <div className="bg-white p-10 rounded-[32px] shadow-xl max-w-md w-full border border-slate-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#00a896] to-teal-500"></div>
            
            <div className="w-32 h-32 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-20 h-20 text-[#00a896]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="35" r="18" stroke="currentColor" strokeWidth="5" />
                <path d="M25 80C25 65 35 58 50 58C65 58 75 65 75 80" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                <path d="M72 30C78 28 85 32 85 40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-black mb-3 text-slate-800">Olá, {userProfile.nome || 'Mariane Soares'}!</h2>
            <p className="text-slate-500 mb-8 font-medium leading-relaxed">
              Você pode começar cadastrando agora a sua empresa ou depois, se assim preferir!
            </p>
            
            <div className="space-y-3">
              <button onClick={() => setCurrentScreen('tela_9_planos')} className={buttonStyle}>
                Conhecer Planos
              </button>
              <button 
                onClick={() => setCurrentScreen('tela_12_cadastro_empresa')} 
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl transition-all text-sm active:scale-[0.98]"
              >
                Cadastrar empresa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TELA 9: VITRINE DE PLANOS
         ========================================================================= */}
      {currentScreen === 'tela_9_planos' && (
        <div className="flex-1 flex flex-col justify-between">
          <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
              <div className="flex items-center gap-2 w-[212px] h-[46px] cursor-pointer" onClick={() => setCurrentScreen('tela_1_landing')}>
                <img src="/Vector.png" alt="Empreasy Logo" className="w-8 h-8 object-contain" />
                <span className="text-3xl font-extrabold tracking-tight flex items-center">
                  <span className="text-[#004750]">Empr</span>
                  <span className="text-[#00B3C9]">easy</span>
                </span>
              </div>
              <nav className="hidden md:flex space-x-12 font-semibold text-[#004750] font-['Nunito'] text-[20px]">
                <span onClick={() => scrollToSection('secao-produto')} className="hover:text-[#00b3c8] cursor-pointer transition-colors">Produto</span>
                <span onClick={() => setCurrentScreen('tela_9_planos')} className="hover:text-[#00b3c8] cursor-pointer transition-colors">Preços</span>
                <span onClick={() => setCurrentScreen('tela_fale_conosco')} className="hover:text-[#00b3c8] cursor-pointer transition-colors">Fale conosco</span>
              </nav>
              <button 
                onClick={() => setCurrentScreen('tela_3_login')} 
                className="bg-[#00B3C9] hover:bg-[#009eb2] text-white font-['Montserrat'] font-semibold text-[16px] w-[168px] h-[48px] flex items-center justify-center rounded-[12px] transition-all shadow-sm active:scale-95"
              >
                Login
              </button>
            </div>
          </header>
          
          <main className="max-w-6xl mx-auto px-6 py-16 w-full flex-1 flex flex-col justify-center">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold text-[#004750] font-['Nunito']">Conheça nossos planos</h2>
              <p className="text-[#808080] mt-3 font-medium text-lg font-['Nunito']">Escolha a capacidade ideal para sua gestão empresarial</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 items-stretch">
              
              {/* Plano Free */}
              <div className="bg-white p-8 rounded-[32px] border border-slate-150 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                <div>
                  <h3 className="text-xl font-bold text-[#004750] mb-2 font-['Nunito']">Plano Free</h3>
                  <div className="text-3xl font-black text-[#004750] my-4 font-['Nunito']">Acesso limitado</div>
                  
                  {/* Ilustração do Plano Free */}
                  <div className="h-[210px] w-full flex items-center justify-center mb-8">
                    <img 
                      src="/Sign out.svg" 
                      alt="Plano Free" 
                      className="h-full object-contain select-none pointer-events-none"
                    />
                  </div>
                  
                  <ul className="space-y-4 text-sm font-semibold text-slate-600 mb-8 font-['Nunito']">
                    <li className="flex items-center gap-3"><span className="text-[#00B3C9] font-bold text-lg">✓</span> 5 Orçamentos</li>
                    <li className="flex items-center gap-3"><span className="text-[#00B3C9] font-bold text-lg">✓</span> 5 Despesas Fixas</li>
                    <li className="flex items-center gap-3"><span className="text-[#00B3C9] font-bold text-lg">✓</span> 5 Investimentos</li>
                    <li className="flex items-center gap-3"><span className="text-[#00B3C9] font-bold text-lg">✓</span> 5 Colaboradores</li>
                  </ul>
                </div>
                <button 
                  onClick={() => setCurrentScreen('tela_2_dashboard_hub')} 
                  className="w-full border-2 border-[#00B3C9] hover:bg-[#E5F7F9] text-[#00B3C9] font-['Montserrat'] font-bold h-[48px] flex items-center justify-center rounded-[12px] transition-all text-center"
                >
                  Assinar
                </button>
              </div>
              
              {/* Plano Médio */}
              <div className="bg-white p-8 rounded-[32px] border-2 border-[#00B3C9] flex flex-col justify-between shadow-lg relative transform md:scale-105">
                <div>
                  <h3 className="text-xl font-bold text-[#004750] mb-2 font-['Nunito']">Plano médio</h3>
                  <div className="text-3xl font-black text-[#004750] my-4 font-['Nunito']">R$ 200,00</div>
                  
                  {/* Ilustração do Plano Médio */}
                  <div className="h-[210px] w-full flex items-center justify-center mb-8">
                    <img 
                      src="/Sign Up.svg" 
                      alt="Plano Médio" 
                      className="h-full object-contain select-none pointer-events-none"
                    />
                  </div>
                  
                  <ul className="space-y-4 text-sm font-semibold text-slate-600 mb-8 font-['Nunito']">
                    <li className="flex items-center gap-3"><span className="text-[#00B3C9] font-bold text-lg">✓</span> 50 Orçamentos</li>
                    <li className="flex items-center gap-3"><span className="text-[#00B3C9] font-bold text-lg">✓</span> 50 Despesas Fixas</li>
                    <li className="flex items-center gap-3"><span className="text-[#00B3C9] font-bold text-lg">✓</span> 50 Investimentos</li>
                    <li className="flex items-center gap-3"><span className="text-[#00B3C9] font-bold text-lg">✓</span> 50 Colaboradores</li>
                  </ul>
                </div>
                <button 
                  onClick={() => setCurrentScreen('tela_10_checkout')} 
                  className="w-full bg-[#00B3C9] hover:bg-[#009eb2] text-white font-['Montserrat'] font-bold h-[48px] flex items-center justify-center rounded-[12px] transition-all shadow-md active:scale-95 text-center"
                >
                  Assinar
                </button>
              </div>
              
              {/* Plano Full */}
              <div className="bg-white p-8 rounded-[32px] border border-slate-150 flex flex-col justify-between shadow-sm hover:shadow-md transition-all font-['Nunito']">
                <div>
                  <h3 className="text-xl font-bold text-[#004750] mb-2 font-['Nunito']">Plano Full - Ilimitado</h3>
                  <div className="text-3xl font-black text-[#004750] my-4 font-['Nunito']">R$ 400,00</div>
                  
                  {/* Ilustração do Plano Full */}
                  <div className="h-[210px] w-full flex items-center justify-center mb-8">
                    <img 
                      src="/Sign In.svg" 
                      alt="Plano Full" 
                      className="h-full object-contain select-none pointer-events-none"
                    />
                  </div>
                  
                  <ul className="space-y-4 text-sm font-semibold text-slate-600 mb-8 font-['Nunito']">
                    <li className="flex items-center gap-3"><span className="text-[#00B3C9] font-bold text-lg">✓</span> Orçamentos Ilimitados</li>
                    <li className="flex items-center gap-3"><span className="text-[#00B3C9] font-bold text-lg">✓</span> Despesas Fixas Ilimitadas</li>
                    <li className="flex items-center gap-3"><span className="text-[#00B3C9] font-bold text-lg">✓</span> Investimentos Ilimitados</li>
                    <li className="flex items-center gap-3"><span className="text-[#00B3C9] font-bold text-lg">✓</span> Colaboradores Ilimitados</li>
                  </ul>
                </div>
                <button 
                  onClick={() => setCurrentScreen('tela_10_checkout')} 
                  className="w-full border-2 border-[#00B3C9] hover:bg-[#E5F7F9] text-[#00B3C9] font-['Montserrat'] font-bold h-[48px] flex items-center justify-center rounded-[12px] transition-all text-center"
                >
                  Assinar
                </button>
              </div>
              
            </div>
          </main>
        </div>
      )}

      {/* =========================================================================
          TELA: FALE CONOSCO (WhatsApp e Formulário de Contato)
         ========================================================================= */}
      {currentScreen === 'tela_fale_conosco' && (
        <div className="flex-1 flex flex-col justify-between">
          <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
              <div className="flex items-center gap-2 w-[212px] h-[46px] cursor-pointer" onClick={() => setCurrentScreen('tela_1_landing')}>
                <img src="/Vector.png" alt="Empreasy Logo" className="w-8 h-8 object-contain" />
                <span className="text-3xl font-extrabold tracking-tight flex items-center">
                  <span className="text-[#004650]">Empr</span>
                  <span className="text-[#00B3C9]">easy</span>
                </span>
              </div>
              <nav className="hidden md:flex space-x-12 font-semibold text-[#004750] font-['Nunito'] text-[20px]">
                <span onClick={() => scrollToSection('secao-produto')} className="hover:text-[#00b3c8] cursor-pointer transition-colors">Produto</span>
                <span onClick={() => setCurrentScreen('tela_9_planos')} className="hover:text-[#00b3c8] cursor-pointer transition-colors">Preços</span>
                <span onClick={() => setCurrentScreen('tela_fale_conosco')} className="hover:text-[#00b3c8] cursor-pointer text-[#00b3c8] transition-colors">Fale conosco</span>
              </nav>
              <button 
                onClick={() => setCurrentScreen('tela_3_login')} 
                className="bg-[#00B3C9] hover:bg-[#009eb2] text-white font-['Montserrat'] font-semibold text-[16px] w-[168px] h-[48px] flex items-center justify-center rounded-[12px] transition-all shadow-sm active:scale-95"
              >
                Login
              </button>
            </div>
          </header>

          <main className="max-w-6xl mx-auto px-6 py-16 w-full flex-1 flex flex-col justify-center relative">
            {/* Elipse decorativa no fundo */}
            <div className="absolute w-[500px] h-[300px] bg-[#e4f6f9] rounded-full blur-[80px] opacity-70 -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="text-center mb-12">
              <h2 className="text-[40px] font-semibold text-[#004750] font-['Nunito']">Fale Conosco</h2>
              <p className="text-[20px] text-[#808080] font-['Nunito'] mt-3 font-normal">
                Escolha o canal de sua preferência e fale com a nossa equipe
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-stretch max-w-4xl mx-auto w-full">
              
              {/* WhatsApp Card */}
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 flex flex-col justify-between shadow-lg hover:shadow-xl transition-all relative overflow-hidden text-left">
                <div className="space-y-6">
                  {/* WhatsApp Icon */}
                  <div className="w-16 h-16 bg-[#E8F8F5] text-[#25D366] rounded-2xl flex items-center justify-center mb-4">
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97-1.861-1.868-4.339-2.897-6.97-2.898-5.441 0-9.87 4.37-9.875 9.8-.001 1.706.46 3.372 1.332 4.832L1.87 21.053l4.777-1.899zm11.954-5.385c-.3-.15-1.771-.875-2.046-.975-.276-.102-.476-.15-.676.15-.2.3-.776.975-.95 1.175-.175.2-.35.225-.65.075-.3-.15-1.265-.467-2.41-1.485-.89-.795-1.49-1.77-1.665-2.07-.175-.3-.019-.462.13-.611.135-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.628-.926-2.228-.244-.588-.491-.508-.676-.518-.174-.01-.374-.012-.574-.012-.2 0-.526.075-.801.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.11 3.22 5.11 4.52.714.31 1.272.496 1.707.635.715.227 1.365.195 1.88.117.574-.087 1.771-.724 2.021-1.424.25-.7.25-1.3.175-1.425-.075-.125-.275-.2-.575-.35z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 font-['Nunito']">Fale pelo WhatsApp</h3>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed font-['Nunito']">
                    Nossa equipe de suporte está de plantão para ajudar você em tempo real. Tire dúvidas ou solicite demonstrações práticas!
                  </p>
                  
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-['Nunito']">Número Oficial</p>
                      <p className="text-slate-800 font-bold font-['Nunito'] text-base mt-1">+55 (11) 99999-9999</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-['Nunito']">Online</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
                  className="w-full bg-[#25D366] hover:bg-[#20ba56] text-white font-bold py-4 rounded-2xl transition-all shadow-md text-sm active:scale-[0.98] text-center flex items-center justify-center gap-2 mt-8 font-['Nunito']"
                >
                  Conversar no WhatsApp
                </button>
              </div>

              {/* Formulário de Contato Card */}
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 flex flex-col justify-between shadow-lg hover:shadow-xl transition-all relative overflow-hidden text-left">
                {faleConoscoEnviado ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-12">
                    <div className="w-20 h-20 bg-teal-50 text-[#00a896] rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 font-['Nunito']">Mensagem enviada!</h3>
                    <p className="text-slate-500 font-medium text-sm max-w-xs leading-relaxed font-['Nunito'] mx-auto">
                      Agradecemos seu contato. Entraremos em contato com você o mais breve possível no e-mail fornecido.
                    </p>
                    <button 
                      onClick={() => {
                        setFaleConoscoForm({ nome: '', email: '', telefone: '', mensagem: '' });
                        setFaleConoscoEnviado(false);
                      }} 
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl transition-all text-xs font-['Nunito']"
                    >
                      Enviar outra mensagem
                    </button>
                  </div>
                ) : (
                  <form 
                    onSubmit={(e) => { 
                      e.preventDefault(); 
                      setFaleConoscoEnviado(true); 
                    }} 
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block font-['Nunito']">Nome Completo</label>
                      <input 
                        type="text" 
                        placeholder="Ex: João Silva" 
                        required 
                        value={faleConoscoForm.nome}
                        onChange={e => { setFaleConoscoError(''); setFaleConoscoForm({...faleConoscoForm, nome: e.target.value}); }}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#00B3C9] focus:ring-4 focus:ring-teal-100 transition-all font-medium text-slate-800 placeholder-slate-400 text-sm font-['Nunito']"
                      />
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block font-['Nunito']">E-mail Corporativo</label>
                      <input 
                        type="email" 
                        placeholder="Ex: joao@empresa.com" 
                        required 
                        value={faleConoscoForm.email}
                        onChange={e => { setFaleConoscoError(''); setFaleConoscoForm({...faleConoscoForm, email: e.target.value}); }}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#00B3C9] focus:ring-4 focus:ring-teal-100 transition-all font-medium text-slate-800 placeholder-slate-400 text-sm font-['Nunito']"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block font-['Nunito']">Telefone / WhatsApp</label>
                      <input 
                        type="tel" 
                        placeholder="Ex: (11) 99999-9999" 
                        required 
                        value={faleConoscoForm.telefone}
                        onChange={e => { setFaleConoscoError(''); setFaleConoscoForm({...faleConoscoForm, telefone: formatarTelefone(e.target.value)}); }}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#00B3C9] focus:ring-4 focus:ring-teal-100 transition-all font-medium text-slate-800 placeholder-slate-400 text-sm font-['Nunito']"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block font-['Nunito']">Mensagem</label>
                      <textarea 
                        placeholder="Como podemos ajudar a sua empresa?" 
                        required 
                        rows="3"
                        value={faleConoscoForm.mensagem}
                        onChange={e => { setFaleConoscoError(''); setFaleConoscoForm({...faleConoscoForm, mensagem: e.target.value}); }}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#00B3C9] focus:ring-4 focus:ring-teal-100 transition-all font-medium text-slate-800 placeholder-slate-400 text-sm font-['Nunito'] resize-none"
                      />
                    </div>
                    
                    {faleConoscoError && (
                      <p className="text-red-500 text-sm font-semibold mt-1 text-center">{faleConoscoError}</p>
                    )}
                    
                    <button 
                      type="submit" 
                      onClick={(e) => {
                        e.preventDefault();
                        setFaleConoscoError('');
                        
                        const nomeCap = capitalizeWords(faleConoscoForm.nome);
                        if (!validarNome(nomeCap)) {
                          setFaleConoscoError('Por favor, insira seu nome completo (nome e sobrenome).');
                          return;
                        }
                        
                        if (!validarEmail(faleConoscoForm.email)) {
                          setFaleConoscoError('Por favor, insira um e-mail válido.');
                          return;
                        }
                        
                        if (!validarTelefone(faleConoscoForm.telefone)) {
                          setFaleConoscoError('Por favor, insira um telefone válido com DDD.');
                          return;
                        }
                        
                        if (faleConoscoForm.mensagem.trim().length < 10) {
                          setFaleConoscoError('A mensagem deve conter pelo menos 10 caracteres.');
                          return;
                        }
                        
                        setFaleConoscoForm(prev => ({
                          ...prev,
                          nome: nomeCap
                        }));
                        setFaleConoscoEnviado(true);
                      }}
                      className="w-full bg-[#00B3C9] hover:bg-[#009eb2] text-white font-bold py-4 rounded-xl transition-all shadow-md text-sm active:scale-[0.98] text-center flex justify-center items-center gap-2 mt-4 font-['Nunito']"
                    >
                      Enviar Mensagem
                    </button>
                  </form>
                )}
              </div>

            </div>
          </main>
        </div>
      )}

      {/* =========================================================================
          TELA 10: TELA DE CHECKOUT
         ========================================================================= */}
      {currentScreen === 'tela_10_checkout' && (
        <div className="flex-1 flex flex-col md:flex-row max-w-5xl mx-auto w-full px-6 py-12 gap-8 items-center justify-center">
          
          <div className="w-full md:flex-1 bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl">
            <h3 className="text-3xl font-black text-slate-800 mb-6">Plano Full</h3>
            <ul className="space-y-4 text-sm font-semibold text-slate-500 mb-10">
              <li className="flex items-center gap-3"><span className="text-[#00a896]">✓</span> 10 orçamentos</li>
              <li className="flex items-center gap-3"><span className="text-[#00a896]">✓</span> 10 Despesas fixas</li>
              <li className="flex items-center gap-3"><span className="text-[#00a896]">✓</span> 10 Investimentos</li>
              <li className="flex items-center gap-3"><span className="text-[#00a896]">✓</span> 10 Colaboradores</li>
            </ul>
            <div className="text-5xl font-black text-slate-800">
              R$ 400,00
            </div>
          </div>
          
          <div className="w-full md:w-[450px] bg-white p-8 rounded-[32px] shadow-2xl border border-slate-100">
            <h2 className="text-xl font-bold mb-1 text-slate-800">Cartão de crédito</h2>
            <p className="text-xs text-slate-400 mb-6 font-semibold">Preencha seus dados para finalizar o pagamento</p>
            
            <div className="bg-gradient-to-br from-slate-800 to-slate-950 text-white p-6 rounded-2xl mb-6 shadow-lg border border-slate-700/50 flex flex-col justify-between h-44 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
              
              <div className="flex justify-between items-start">
                <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">Cartão de Crédito</div>
                <div className="flex -space-x-3">
                  <div className="w-7 h-7 rounded-full bg-red-500/80"></div>
                  <div className="w-7 h-7 rounded-full bg-amber-500/80"></div>
                </div>
              </div>
              
              <div className="text-xl font-mono my-4 tracking-widest font-bold">4258 8920 8231 9239</div>
              
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Titular</div>
                  <span>Marcos Coelho</span>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Validade</div>
                  <span>07/26</span>
                </div>
              </div>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); setCurrentScreen('tela_11_add_admin'); }} className="space-y-4">
              <input type="text" placeholder="Nome no cartão" required className={textInputStyle} />
              <input type="text" placeholder="N° Cartão" required className={textInputStyle} />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Vencimento (MM/AA)" required className={textInputStyle} />
                <input type="text" placeholder="CCV" required className={textInputStyle} />
              </div>
              
              <button type="submit" className={`${buttonStyle} mt-4`}>
                Assinar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          TELA 11: CRIAÇÃO DE PERFIL ADMINISTRADOR
         ========================================================================= */}
      {currentScreen === 'tela_11_add_admin' && (
        <div className="flex-1 flex flex-col md:flex-row min-h-screen">
          <div className="w-full md:flex-1 bg-[#00a896] p-8 md:p-16 flex flex-col justify-between text-white relative">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-widest bg-teal-800 bg-opacity-40 px-4 py-1.5 rounded-full border border-teal-600/30">
                1. Identificação
              </span>
              <h2 className="text-4xl md:text-5xl font-black mt-8 mb-4 tracking-tight">Adicione um administrador</h2>
              <p className="text-teal-50 text-base md:text-lg max-w-md font-medium leading-relaxed">
                Adicione um responsável para cuidar das suas contas na Empreasy.
              </p>
            </div>
            
            <div className="my-10">
              <svg className="w-48 h-48 mx-auto text-teal-100" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="80" fill="white" fillOpacity="0.15" />
                <rect x="65" y="80" width="70" height="90" rx="10" fill="#00a896" stroke="white" strokeWidth="5" />
                <circle cx="100" cy="55" r="22" stroke="white" strokeWidth="5" fill="#00a896" />
                <rect x="85" y="105" width="30" height="40" rx="5" fill="white" />
              </svg>
            </div>

            <div className="h-2 w-full bg-teal-700/50 rounded-full">
              <div className="h-full w-1/3 bg-white rounded-full"></div>
            </div>
          </div>
          
          <div className="w-full md:w-[500px] bg-white p-8 md:p-12 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-slate-400">ADMINISTRADOR</span>
              <button onClick={() => setCurrentScreen('tela_9_planos')} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-all">Cancelar</button>
            </div>
            
            <div className="my-auto py-10 max-w-sm w-full mx-auto space-y-6">
              <h3 className="text-3xl font-black text-slate-800">Informações cadastrais</h3>
              
              <form onSubmit={(e) => { e.preventDefault(); setCurrentScreen('tela_12_cadastro_empresa'); }} className="space-y-4">
                <input type="text" placeholder="Nome" required className={textInputStyle} />
                <input type="email" placeholder="E-mail" required className={textInputStyle} />
                <input type="password" placeholder="Senha" required className={textInputStyle} />
                <select className={textInputStyle}>
                  <option>Nível de acesso</option>
                  <option>Administrador Global</option>
                  <option>Gerente Financeiro</option>
                </select>
                
                <button type="submit" className={`${buttonStyle} mt-6`}>Ok</button>
              </form>
            </div>
            
            <div className="text-center text-xs font-semibold text-slate-400 hover:underline cursor-pointer">
              Precisa de ajuda? Entre em contato
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TELAS 12 & 13: CADASTRO DA EMPRESA
         ========================================================================= */}
      {currentScreen === 'tela_12_cadastro_empresa' && (
        <div className="flex-1 flex flex-col md:flex-row min-h-screen">
          <div className="w-full md:flex-1 bg-[#00a896] p-8 md:p-16 flex flex-col justify-between text-white relative">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-widest bg-teal-800 bg-opacity-40 px-4 py-1.5 rounded-full border border-teal-600/30">
                1. Identificação
              </span>
              <h2 className="text-4xl md:text-5xl font-black mt-8 mb-4 tracking-tight">Adicione um administrador</h2>
              <p className="text-teal-50 text-base md:text-lg max-w-md font-medium leading-relaxed">
                Adicione um responsável para cuidar das suas contas na Empreasy.
              </p>
            </div>
            
            <div className="my-10">
              <svg className="w-48 h-48 mx-auto text-teal-100" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="80" fill="white" fillOpacity="0.15" />
                <rect x="50" y="70" width="100" height="60" rx="8" stroke="white" strokeWidth="5" fill="#00a896" />
                <circle cx="100" cy="100" r="18" stroke="white" strokeWidth="5" />
                <rect x="145" y="80" width="10" height="40" rx="2" fill="white" />
              </svg>
            </div>

            <div className="h-2 w-full bg-teal-700/50 rounded-full">
              <div className="h-full w-2/3 bg-white rounded-full"></div>
            </div>
          </div>
          
          <div className="w-full md:w-[500px] bg-white p-8 md:p-12 flex flex-col justify-between overflow-y-auto max-h-screen">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-slate-400">CADASTRO DA EMPRESA</span>
              <button onClick={() => setCurrentScreen('tela_8_welcome_next')} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-all">Voltar</button>
            </div>
            
            <div className="my-6 space-y-6 max-w-sm w-full mx-auto">
              <h3 className="text-2xl font-black text-slate-800">Informações cadastrais</h3>
              
              <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-100">
                <span className="text-sm font-bold text-slate-500">Sou empresa?</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 font-semibold cursor-pointer text-sm text-slate-700">
                    <input type="radio" checked={empresaTipo === 'Sim'} onChange={() => setEmpresaTipo('Sim')} className="accent-[#00a896]" /> Sim
                  </label>
                  <label className="flex items-center gap-2 font-semibold cursor-pointer text-sm text-slate-700">
                    <input type="radio" checked={empresaTipo === 'Não'} onChange={() => setEmpresaTipo('Não')} className="accent-[#00a896]" /> Não
                  </label>
                </div>
              </div>
              
              <form onSubmit={handleSalvarEmpresaOnboarding} className="space-y-4">
                {empresaTipo === 'Sim' ? (
                  <>
                    <input 
                      ref={cnpjInputRef}
                      type="text" 
                      placeholder="CNPJ" 
                      required 
                      className={textInputStyle} 
                      value={empresaInfo.cnpj}
                      onChange={(e) => { setValidationError(''); setEmpresaInfo({...empresaInfo, cnpj: formatarCNPJ(e.target.value)}); }}
                    />
                    <input 
                      type="text" 
                      placeholder="Razão social" 
                      required 
                      className={textInputStyle} 
                      value={empresaInfo.razaoSocial}
                      onChange={(e) => { setValidationError(''); setEmpresaInfo({...empresaInfo, razaoSocial: e.target.value}); }}
                    />
                    <input 
                      type="text" 
                      placeholder="Nome fantasia" 
                      required 
                      className={textInputStyle} 
                      value={empresaInfo.nomeFantasia}
                      onChange={(e) => { setValidationError(''); setEmpresaInfo({...empresaInfo, nomeFantasia: e.target.value}); }}
                    />
                  </>
                ) : (
                  <>
                    <input 
                      ref={cpfEmpresaInputRef}
                      type="text" 
                      placeholder="CPF" 
                      required 
                      className={textInputStyle} 
                      value={userProfile.cpf}
                      onChange={(e) => { setValidationError(''); setUserProfile({...userProfile, cpf: formatarCPF(e.target.value)}); }}
                    />
                    <input 
                      type="text" 
                      placeholder="Nome completo" 
                      required 
                      className={textInputStyle} 
                      value={userProfile.nome}
                      onChange={(e) => { setValidationError(''); setUserProfile({...userProfile, nome: e.target.value}); }}
                    />
                    <input 
                      type="text" 
                      placeholder="Telefone" 
                      required 
                      className={textInputStyle} 
                      value={empresaInfo.cnpj}
                      onChange={(e) => { setValidationError(''); setEmpresaInfo({...empresaInfo, cnpj: formatarTelefone(e.target.value)}); }}
                    />
                  </>
                )}
                
                <select className={textInputStyle} value={empresaInfo.setor} onChange={(e) => setEmpresaInfo({...empresaInfo, setor: e.target.value})}>
                  <option value="Tecnologia & Software">Tecnologia & Software</option>
                  <option value="Alimentos & Bebidas">Alimentos & Bebidas</option>
                  <option value="Eventos & Produções">Eventos & Produções</option>
                  <option value="Outro">Outro</option>
                </select>
                
                <div className="border-t border-slate-100 pt-6 mt-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Endereço</h4>
                  <input 
                    type="text" 
                    placeholder="CEP" 
                    required 
                    className={textInputStyle} 
                    value={empresaInfo.cep}
                    onChange={(e) => {
                      const val = e.target.value;
                      const formatted = formatarCEP(val);
                      const limpo = val.replace(/\D/g, '');
                      setValidationError('');
                      setEmpresaInfo({...empresaInfo, cep: formatted});
                      if (limpo.length === 8) {
                        buscarCEP(limpo);
                      }
                    }}
                  />
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <input 
                      type="text" 
                      placeholder="Rua" 
                      required 
                      className={`${textInputStyle} col-span-3`} 
                      value={empresaInfo.rua}
                      onChange={(e) => { setValidationError(''); setEmpresaInfo({...empresaInfo, rua: e.target.value}); }}
                    />
                    <input 
                      type="text" 
                      placeholder="N°" 
                      required 
                      className={textInputStyle} 
                      value={empresaInfo.numero}
                      onChange={(e) => { setValidationError(''); setEmpresaInfo({...empresaInfo, numero: e.target.value}); }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input 
                      type="text" 
                      placeholder="Cidade" 
                      required 
                      className={textInputStyle} 
                      value={empresaInfo.cidade}
                      onChange={(e) => { setValidationError(''); setEmpresaInfo({...empresaInfo, cidade: e.target.value}); }}
                    />
                    <input 
                      type="text" 
                      placeholder="Estado" 
                      required 
                      className={textInputStyle} 
                      value={empresaInfo.estado}
                      onChange={(e) => { setValidationError(''); setEmpresaInfo({...empresaInfo, estado: e.target.value}); }}
                    />
                  </div>
                </div>

                {empresaTipo === 'Sim' && (
                  <div className="border-t border-slate-100 pt-6 mt-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Responsável</h4>
                    <input 
                      type="text" 
                      placeholder="Nome" 
                      required 
                      className={textInputStyle} 
                      value={empresaInfo.responsavel}
                      onChange={(e) => { setValidationError(''); setEmpresaInfo({...empresaInfo, responsavel: e.target.value}); }}
                    />
                  </div>
                )}
                
                {validationError && (
                  <p className="text-red-500 text-sm font-semibold mt-4 text-center">{validationError}</p>
                )}
                <button type="submit" className={`${buttonStyle} mt-6`}>Ok</button>
              </form>
            </div>
            
            <div className="text-center text-xs font-semibold text-slate-400 mt-6">
              Responsável
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          WIZARD DE DESPESAS FIXAS (Split Layout)
         ========================================================================= */}
      {currentScreen === 'tela_onboard_despesas_wizard' && (
        <div className="flex-1 flex flex-col md:flex-row min-h-screen">
          <div className="w-full md:flex-1 bg-[#475569] p-8 md:p-16 flex flex-col justify-between text-white relative">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-widest bg-slate-800 bg-opacity-40 px-4 py-1.5 rounded-full border border-slate-600/30">
                2. Planejamento Financeiro
              </span>
              <h2 className="text-4xl md:text-5xl font-black mt-8 mb-4 tracking-tight">Quais suas despesas fixas?</h2>
              <p className="text-slate-200 text-base md:text-lg max-w-md font-medium leading-relaxed">
                Suas despesas fixas é tudo que você paga mensalmente de forma recorrente.
              </p>
            </div>
            
            <div className="my-10">
              <svg className="w-48 h-48 mx-auto text-slate-300" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="80" fill="white" fillOpacity="0.1" />
                <rect x="60" y="50" width="80" height="100" rx="8" stroke="white" strokeWidth="5" fill="#475569" />
                <line x1="75" y1="75" x2="125" y2="75" stroke="white" strokeWidth="5" strokeLinecap="round" />
                <line x1="75" y1="95" x2="125" y2="95" stroke="white" strokeWidth="5" strokeLinecap="round" />
                <circle cx="80" cy="125" r="8" fill="white" />
                <circle cx="100" cy="125" r="8" fill="white" />
                <circle cx="120" cy="125" r="8" fill="white" />
              </svg>
            </div>

            <div className="flex items-center gap-3">
              {[0,1,2,3,4].map((step) => (
                <div key={step} className={`h-2.5 rounded-full transition-all duration-300 ${stepDespesas === step ? 'w-12 bg-white' : 'w-6 bg-slate-700/50'}`}></div>
              ))}
            </div>
          </div>
          
          <div className="w-full md:w-[500px] bg-white p-8 md:p-12 flex flex-col justify-between overflow-y-auto max-h-screen">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-slate-400">
                {stepDespesas === 0 && 'FINANCEIRO'}
                {stepDespesas === 1 && 'ADMINISTRATIVAS'}
                {stepDespesas === 2 && 'PESSOAL'}
                {stepDespesas === 3 && 'TERCEIRIZAÇÃO'}
                {stepDespesas === 4 && 'MATERIAIS E EQUIPAMENTOS'}
              </span>
              <span className="text-xs font-bold text-slate-400">PASSO {stepDespesas + 1} DE 5</span>
            </div>
            
            <div className="my-auto py-6 max-w-sm w-full mx-auto space-y-6">
              <h3 className="text-3xl font-black text-slate-800">
                {stepDespesas === 0 && 'Financeiro'}
                {stepDespesas === 1 && 'Administrativas'}
                {stepDespesas === 2 && 'Pessoal'}
                {stepDespesas === 3 && 'Terceirização'}
                {stepDespesas === 4 && 'Materiais e equipamentos'}
              </h3>
              
              <div className="space-y-3">
                {Object.keys(despesasWizardList).map((catName, idx) => {
                  if (idx !== stepDespesas) return null;
                  const catKey = Object.keys(despesasWizardList)[idx];
                  return despesasWizardList[catKey].map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        const updated = despesasWizardList[catKey].map(i => i.id === item.id ? { ...i, selecionado: !i.selecionado } : i);
                        setDespesasWizardList({ ...despesasWizardList, [catKey]: updated });
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${item.selecionado ? 'border-[#00a896] bg-teal-50/50' : 'border-slate-200 hover:border-slate-350'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${item.selecionado ? 'bg-[#00a896] border-[#00a896] text-white' : 'border-slate-300'}`}>
                          {item.selecionado && <span className="text-[10px] font-black">✓</span>}
                        </div>
                        <span className="font-semibold text-slate-700 text-sm">{item.titulo}</span>
                      </div>
                      
                      {item.selecionado ? (
                        <div className="text-right">
                          <span className="font-bold text-xs text-slate-400 block uppercase">Remuneração</span>
                          <span className="font-bold text-[#00a896] text-sm">R$ {item.valor.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-xl font-bold text-slate-300">+</span>
                      )}
                    </div>
                  ));
                })}
              </div>

              {!showCustomWizardForm ? (
                <button 
                  onClick={() => setShowCustomWizardForm(true)}
                  className="w-full py-4 border border-dashed border-slate-300 hover:border-[#00a896] rounded-2xl text-xs font-bold text-slate-400 hover:text-[#00a896] transition-all flex items-center justify-center gap-2"
                >
                  ➕ Adicionar nova despesa
                </button>
              ) : (
                <div className="p-4 border border-slate-200 rounded-2xl space-y-3 bg-slate-50">
                  <input 
                    type="text" 
                    placeholder="Título da Despesa" 
                    value={customWizardInput.titulo} 
                    onChange={e => setCustomWizardInput({...customWizardInput, titulo: e.target.value})} 
                    className={textInputStyle} 
                  />
                  <input 
                    type="number" 
                    placeholder="Valor (R$)" 
                    value={customWizardInput.valor} 
                    onChange={e => setCustomWizardInput({...customWizardInput, valor: e.target.value})} 
                    className={textInputStyle} 
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowCustomWizardForm(false)} className="w-1/2 py-2 border rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100">Cancelar</button>
                    <button onClick={handleAddCustomDespesaWizard} className="w-1/2 py-2 bg-[#00a896] text-white rounded-xl text-xs font-bold hover:bg-[#008f7f]">Adicionar</button>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-6 mt-6">
              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex justify-between items-center mb-4">
                <span className="font-bold text-sky-700 text-sm">Total</span>
                <span className="font-black text-sky-800 text-lg">R$ {getSelectedDespesasTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              
              <button onClick={handleNextDespesasWizard} className={buttonStyle}>
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          WIZARD DE INVESTIMENTOS (Split Layout)
         ========================================================================= */}
      {currentScreen === 'tela_onboard_investimentos_wizard' && (
        <div className="flex-1 flex flex-col md:flex-row min-h-screen">
          <div className="w-full md:flex-1 bg-[#d97706] p-8 md:p-16 flex flex-col justify-between text-white relative">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-widest bg-amber-800 bg-opacity-40 px-4 py-1.5 rounded-full border border-amber-600/30">
                2. Planejamento Financeiro
              </span>
              <h2 className="text-4xl md:text-5xl font-black mt-8 mb-4 tracking-tight">Quais seus investimentos?</h2>
              <p className="text-amber-100 text-base md:text-lg max-w-md font-medium leading-relaxed">
                Suas despesas fixas é tudo que você paga mensalmente de forma recorrente.
              </p>
            </div>
            
            <div className="my-10">
              <svg className="w-48 h-48 mx-auto text-amber-100" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="80" fill="white" fillOpacity="0.1" />
                <path d="M70 140H130" stroke="white" strokeWidth="5" strokeLinecap="round" />
                <path d="M100 140V100" stroke="white" strokeWidth="5" strokeLinecap="round" />
                <rect x="75" y="70" width="50" height="30" rx="5" stroke="white" strokeWidth="5" fill="#d97706" />
                <path d="M60 80C50 60 70 50 100 70" stroke="white" strokeWidth="3" strokeDasharray="3 3" />
              </svg>
            </div>

            <div className="flex items-center gap-3">
              {[0,1,2,3].map((step) => (
                <div key={step} className={`h-2.5 rounded-full transition-all duration-300 ${stepInvestimentos === step ? 'w-12 bg-white' : 'w-6 bg-amber-700/50'}`}></div>
              ))}
            </div>
          </div>
          
          <div className="w-full md:w-[500px] bg-white p-8 md:p-12 flex flex-col justify-between overflow-y-auto max-h-screen">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-slate-400">
                {stepInvestimentos === 0 && 'GESTÃO EMPRESARIAL'}
                {stepInvestimentos === 1 && 'BENS MATERIAIS'}
                {stepInvestimentos === 2 && 'PARCELADOS'}
                {stepInvestimentos === 3 && 'MARKETING'}
              </span>
              <span className="text-xs font-bold text-slate-400">PASSO {stepInvestimentos + 1} DE 4</span>
            </div>
            
            <div className="my-auto py-6 max-w-sm w-full mx-auto space-y-6">
              <h3 className="text-3xl font-black text-slate-800">
                {stepInvestimentos === 0 && 'Gestão empresarial'}
                {stepInvestimentos === 1 && 'Bens materiais'}
                {stepInvestimentos === 2 && 'Parcelados'}
                {stepInvestimentos === 3 && 'Marketing'}
              </h3>
              
              <div className="space-y-3">
                {Object.keys(investimentosWizardList).map((catName, idx) => {
                  if (idx !== stepInvestimentos) return null;
                  const catKey = Object.keys(investimentosWizardList)[idx];
                  return investimentosWizardList[catKey].map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        const updated = investimentosWizardList[catKey].map(i => i.id === item.id ? { ...i, selecionado: !i.selecionado } : i);
                        setInvestimentosWizardList({ ...investimentosWizardList, [catKey]: updated });
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${item.selecionado ? 'border-[#00a896] bg-teal-50/50' : 'border-slate-200 hover:border-slate-350'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${item.selecionado ? 'bg-[#00a896] border-[#00a896] text-white' : 'border-slate-300'}`}>
                          {item.selecionado && <span className="text-[10px] font-black">✓</span>}
                        </div>
                        <span className="font-semibold text-slate-700 text-sm">{item.titulo}</span>
                      </div>
                      
                      {item.selecionado ? (
                        <div className="text-right">
                          <span className="font-bold text-xs text-slate-400 block uppercase">Previsão</span>
                          <span className="font-bold text-[#00a896] text-sm">R$ {item.valor.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-xl font-bold text-slate-300">+</span>
                      )}
                    </div>
                  ));
                })}
              </div>

              {!showCustomWizardForm ? (
                <button 
                  onClick={() => setShowCustomWizardForm(true)}
                  className="w-full py-4 border border-dashed border-slate-300 hover:border-[#00a896] rounded-2xl text-xs font-bold text-slate-400 hover:text-[#00a896] transition-all flex items-center justify-center gap-2"
                >
                  ➕ Adicionar nova despesa
                </button>
              ) : (
                <div className="p-4 border border-slate-200 rounded-2xl space-y-3 bg-slate-50">
                  <input 
                    type="text" 
                    placeholder="Título do Investimento" 
                    value={customWizardInput.titulo} 
                    onChange={e => setCustomWizardInput({...customWizardInput, titulo: e.target.value})} 
                    className={textInputStyle} 
                  />
                  <input 
                    type="number" 
                    placeholder="Valor (R$)" 
                    value={customWizardInput.valor} 
                    onChange={e => setCustomWizardInput({...customWizardInput, valor: e.target.value})} 
                    className={textInputStyle} 
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowCustomWizardForm(false)} className="w-1/2 py-2 border rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100">Cancelar</button>
                    <button onClick={handleAddCustomInvestimentoWizard} className="w-1/2 py-2 bg-[#00a896] text-white rounded-xl text-xs font-bold hover:bg-[#008f7f]">Adicionar</button>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-6 mt-6">
              <button onClick={handleNextInvestimentosWizard} className={buttonStyle}>
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TELA 14/15: ADICIONAR COLABORADOR ONBOARDING
         ========================================================================= */}
      {currentScreen === 'tela_14_add_colaborador' && (
        <div className="flex-1 flex flex-col md:flex-row min-h-screen">
          <div className="w-full md:flex-1 bg-[#00a896] p-8 md:p-16 flex flex-col justify-between text-white relative">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-widest bg-teal-800 bg-opacity-40 px-4 py-1.5 rounded-full border border-teal-600/30">
                1. Identificação
              </span>
              <h2 className="text-4xl md:text-5xl font-black mt-8 mb-4 tracking-tight">Adicione um administrador</h2>
              <p className="text-teal-50 text-base md:text-lg max-w-md font-medium leading-relaxed">
                Adicione um responsável para cuidar das suas contas na Empreasy.
              </p>
            </div>
            
            <div className="my-10">
              <svg className="w-48 h-48 mx-auto text-teal-100" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="80" fill="white" fillOpacity="0.15" />
                <rect x="50" y="110" width="100" height="15" rx="4" fill="white" />
                <path d="M70 110V150M130 110V150" stroke="white" strokeWidth="5" />
                <path d="M85 80C85 60 115 60 115 80" stroke="white" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </div>

            <div className="h-2 w-full bg-teal-700/50 rounded-full">
              <div className="h-full w-full bg-white rounded-full"></div>
            </div>
          </div>
          
          <div className="w-full md:w-[500px] bg-white p-8 md:p-12 flex flex-col justify-between overflow-y-auto max-h-screen">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-slate-400">COLABORADOR</span>
              <button onClick={() => setCurrentScreen('tela_2_dashboard_hub')} className="text-xs font-bold text-[#00a896] hover:underline font-bold">Ir ao painel</button>
            </div>
            
            <div className="my-auto py-6 max-w-sm w-full mx-auto space-y-6">
              <h3 className="text-2xl font-black text-slate-800">Adicionar colaborador</h3>
              
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Nome do colaborador" 
                  value={novoColab.nome} 
                  onChange={e => setNovoColab({...novoColab, nome: e.target.value})} 
                  className={textInputStyle} 
                />
                
                <select 
                  value={novoColab.cargo} 
                  onChange={e => setNovoColab({...novoColab, cargo: e.target.value})} 
                  className={textInputStyle}
                >
                  <option value="">Cargos</option>
                  <option value="Product Designer">Product Designer</option>
                  <option value="UI Designer">UI Designer</option>
                  <option value="UX Research">UX Research</option>
                  <option value="Vendedor">Vendedor</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Assistente de Vendas">Assistente de Vendas</option>
                </select>

                <select 
                  value={novoColab.setor} 
                  onChange={e => setNovoColab({...novoColab, setor: e.target.value})} 
                  className={textInputStyle}
                >
                  <option value="Marketing">Marketing</option>
                  <option value="Vendas">Vendas</option>
                  <option value="Produto">Produto</option>
                  <option value="Administrativo">Administrativo</option>
                </select>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Horas por dia</label>
                    <input 
                      type="text" 
                      placeholder="00h" 
                      value={novoColab.horasDia} 
                      onChange={e => setNovoColab({...novoColab, horasDia: e.target.value})} 
                      className={textInputStyle} 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Dias na semana</label>
                    <input 
                      type="text" 
                      placeholder="0 dias" 
                      value={novoColab.diasSemana} 
                      onChange={e => setNovoColab({...novoColab, diasSemana: e.target.value})} 
                      className={textInputStyle} 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Remuneração</label>
                  <input 
                    type="number" 
                    placeholder="R$ 000,00" 
                    value={novoColab.remuneracao} 
                    onChange={e => setNovoColab({...novoColab, remuneracao: e.target.value})} 
                    className={textInputStyle} 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 mt-6 border-t border-slate-100 pt-6">
              <button 
                type="button" 
                onClick={handleSalvarColaborador} 
                className={buttonOutlineStyle}
              >
                Novo colaborador
              </button>
              
              <button 
                onClick={() => setCurrentScreen('tela_2_dashboard_hub')} 
                className={buttonStyle}
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TELA 2: HUB INTERNO (DASHBOARD COMPLETO E PÁGINAS ADICIONAIS)
         ========================================================================= */}
      {currentScreen === 'tela_2_dashboard_hub' && (
        <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-50px)]">
          
          <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between shadow-sm sticky top-0 md:h-[calc(100vh-50px)] z-40">
            <div className="space-y-10">
              <div className="flex items-center gap-2 w-[212px] h-[46px] cursor-pointer" onClick={() => setCurrentScreen('tela_1_landing')}>
                <img src="/Vector.png" alt="Empreasy Logo" className="w-7 h-7 object-contain" />
                <span className="text-2xl font-extrabold tracking-tight flex items-center">
                  <span className="text-[#004650]">Empr</span>
                  <span className="text-[#00B3C9]">easy</span>
                </span>
              </div>
              
              <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-1 pb-3 md:pb-0 scrollbar-none">
                <button 
                  onClick={() => { setActiveTab('dashboard'); setSubTabEmpresa('menu'); }} 
                  className={`flex items-center gap-3 p-3.5 rounded-2xl text-sm font-bold whitespace-nowrap text-left w-full transition-all ${activeTab === 'dashboard' ? 'bg-teal-50 text-[#00a896]' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <span className="text-lg">📊</span> Dashboard
                </button>
                <button 
                  onClick={() => setActiveTab('orcamentos')} 
                  className={`flex items-center gap-3 p-3.5 rounded-2xl text-sm font-bold whitespace-nowrap text-left w-full transition-all ${activeTab === 'orcamentos' ? 'bg-teal-50 text-[#00a896]' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <span className="text-lg">📄</span> Orçamentos
                </button>
                <button 
                  onClick={() => setActiveTab('investimentos')} 
                  className={`flex items-center gap-3 p-3.5 rounded-2xl text-sm font-bold whitespace-nowrap text-left w-full transition-all ${activeTab === 'investimentos' ? 'bg-teal-50 text-[#00a896]' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <span className="text-lg">💰</span> Investimentos
                </button>
                <button 
                  onClick={() => { setActiveTab('minha_empresa'); setSubTabEmpresa('menu'); }} 
                  className={`flex items-center gap-3 p-3.5 rounded-2xl text-sm font-bold whitespace-nowrap text-left w-full transition-all ${activeTab === 'minha_empresa' ? 'bg-teal-50 text-[#00a896]' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <span className="text-lg">🏢</span> Minha empresa
                </button>
                <button 
                  onClick={() => setActiveTab('configuracoes')} 
                  className={`flex items-center gap-3 p-3.5 rounded-2xl text-sm font-bold whitespace-nowrap text-left w-full transition-all ${activeTab === 'configuracoes' ? 'bg-teal-50 text-[#00a896]' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <span className="text-lg">⚙️</span> Configurações
                </button>
              </nav>
            </div>
            
            <div className="border-t border-slate-100 pt-6 mt-6 hidden md:block">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-teal-100 border-2 border-white shadow-sm flex items-center justify-center font-bold text-[#00a896]">
                  {userProfile.nome ? userProfile.nome.substring(0,2).toUpperCase() : 'MS'}
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">{userProfile.nome || 'Mariane Soares'}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{userProfile.cargo || 'Administrador'}</div>
                </div>
              </div>
              <button onClick={async () => {
                if (window.confirm("Deseja sair do sistema?")) {
                  await supabase.auth.signOut();
                }
              }} className="text-xs font-bold text-red-500 hover:text-red-700 transition-all flex items-center gap-2">
                🚪 Sair do sistema
              </button>
            </div>
          </aside>

          <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full">
            
            <header className="flex justify-between items-center mb-10 pb-6 border-b border-slate-100">
              <div>
                <h1 className="text-2xl font-black capitalize text-slate-800">
                  {activeTab === 'minha_empresa' && subTabEmpresa !== 'menu' ? `${subTabEmpresa}` : activeTab}
                </h1>
                <p className="text-xs font-semibold text-slate-400 mt-1">Conectado ao Supabase • Empreasy App</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm cursor-pointer relative hover:bg-slate-50 transition-all">
                  <span>🔔</span>
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-teal-500 rounded-full border-2 border-white"></span>
                </div>
                <div className="flex items-center gap-3">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80" alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                  <div className="hidden sm:block">
                    <span className="text-xs font-bold text-slate-800 block">{userProfile.nome}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Administrador</span>
                  </div>
                </div>
              </div>
            </header>

            {/* TAB: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Total em Orçamentos</span>
                      <h3 className="text-3xl font-black text-slate-800 mt-3">R$ 300.000,00</h3>
                    </div>
                    <div className="relative w-44 h-24 mx-auto mt-6">
                      <svg className="w-full h-full" viewBox="0 0 100 50">
                        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round" />
                        <path d="M 10 50 A 40 40 0 0 1 70 20" fill="none" stroke="#00a896" strokeWidth="12" strokeLinecap="round" strokeDasharray="100" />
                      </svg>
                      <div className="absolute bottom-0 inset-x-0 text-center font-black text-slate-700 text-xs uppercase tracking-widest">
                        TOTAL
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm col-span-1">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-bold text-slate-800 text-sm">Aprovados e Rejeitados</h4>
                      <div className="flex gap-4 text-xs font-bold text-slate-400">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#00a896]"></span> Aprovados</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Rejeitados</span>
                      </div>
                    </div>
                    <div className="flex items-end justify-between h-36 pt-4 px-2">
                      {[30, 45, 60, 25, 75, 40, 90, 50].map((h, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 w-6">
                          <div className="w-3 rounded-full bg-[#00a896] hover:bg-[#008f7f] transition-all" style={{ height: `${h}px` }}></div>
                          <div className="w-3 rounded-full bg-slate-200" style={{ height: `${30}px` }}></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h4 className="font-bold text-slate-800 text-sm mb-6">Média de orçamentos</h4>
                    <div className="space-y-4">
                      {['Marcus Coelho', 'Marcus Coelho', 'Marcus Coelho'].map((name, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center font-bold text-xs text-[#00a896]">MC</div>
                            <span className="text-xs font-bold text-slate-700">{name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-[#00a896] h-full" style={{ width: i === 0 ? '75%' : i === 1 ? '55%' : '35%' }}></div>
                            </div>
                            <span className="text-xs font-black text-slate-600">R$ 200.000,00</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm col-span-1 lg:col-span-2">
                    <div className="grid grid-cols-2 gap-8 border-b border-slate-100 pb-6 mb-6">
                      <div>
                        <span className="text-[10px] bg-teal-50 text-[#00a896] font-bold px-3 py-1 rounded-full">Total de lucros</span>
                        <div className="space-y-3 mt-4 text-xs font-bold text-slate-500">
                          <div className="flex justify-between"><span>Aprovados</span><span className="text-slate-800">R$ 200.000,00</span></div>
                          <div className="flex justify-between"><span>Rejeitados</span><span className="text-slate-800">R$ 200.000,00</span></div>
                          <div className="flex justify-between"><span>Pendentes</span><span className="text-slate-800">R$ 200.000,00</span></div>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] bg-teal-50 text-[#00a896] font-bold px-3 py-1 rounded-full">Média de lucros</span>
                        <div className="space-y-3 mt-4 text-xs font-bold text-slate-500">
                          <div className="flex justify-between"><span>Aprovados</span><span className="text-slate-800">R$ 200.000,00</span></div>
                          <div className="flex justify-between"><span>Rejeitados</span><span className="text-slate-800">R$ 200.000,00</span></div>
                          <div className="flex justify-between"><span>Pendentes</span><span className="text-slate-800">R$ 200.000,00</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-bold text-slate-500">
                        <thead>
                          <tr className="border-b border-slate-100 pb-3">
                            <th className="pb-2">Status</th>
                            <th className="pb-2">Progress</th>
                            <th className="pb-2 text-right">Ganho total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-50">
                            <td className="py-3 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Aprovado</td>
                            <td className="py-3"><div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full w-4/5"></div></div></td>
                            <td className="py-3 text-right text-slate-800">R$ 200.000,00</td>
                          </tr>
                          <tr className="border-b border-slate-50">
                            <td className="py-3 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Rejeitado</td>
                            <td className="py-3"><div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-rose-500 h-full w-1/5"></div></div></td>
                            <td className="py-3 text-right text-slate-800">R$ 200.000,00</td>
                          </tr>
                          <tr>
                            <td className="py-3 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Pendente</td>
                            <td className="py-3"><div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-amber-500 h-full w-2/5"></div></div></td>
                            <td className="py-3 text-right text-slate-800">R$ 200.000,00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] bg-teal-50 text-[#00a896] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Faixas de % de lucro</span>
                      <h4 className="font-bold text-slate-850 text-sm mt-4">Faixa de 30%</h4>
                    </div>
                    
                    <div className="space-y-6 my-6">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Aprovados (R$ 200.000,00)</span>
                        <div className="relative w-10 h-10 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="text-emerald-500" strokeDasharray="46, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          </svg>
                          <span className="absolute text-[8px] font-black text-slate-700">46%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Rejeitados (R$ 200.000,00)</span>
                        <div className="relative w-10 h-10 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="text-rose-500" strokeDasharray="46, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          </svg>
                          <span className="absolute text-[8px] font-black text-slate-700">46%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Pendentes (R$ 200.000,00)</span>
                        <div className="relative w-10 h-10 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="text-amber-500" strokeDasharray="46, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          </svg>
                          <span className="absolute text-[8px] font-black text-slate-700">46%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-[#00a896] text-white p-6 rounded-3xl shadow-md flex justify-between items-center relative overflow-hidden">
                    <div className="z-10">
                      <span className="text-xs font-bold opacity-80 uppercase block">Aprovados</span>
                      <h4 className="text-2xl font-black mt-2">R$ 60.000,00</h4>
                      <span className="text-[10px] font-bold mt-1 bg-white/20 px-2 py-0.5 rounded-full inline-block">aprovação em 53% ↗</span>
                    </div>
                    <svg className="w-24 h-16 opacity-30 absolute bottom-4 right-4" viewBox="0 0 100 50">
                      <path d="M0 45 Q 20 20 40 35 T 80 15 T 100 5" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" />
                    </svg>
                  </div>

                  <div className="bg-rose-500 text-white p-6 rounded-3xl shadow-md flex justify-between items-center relative overflow-hidden">
                    <div className="z-10">
                      <span className="text-xs font-bold opacity-80 uppercase block">Rejeitados</span>
                      <h4 className="text-2xl font-black mt-2">R$ 90.000,00</h4>
                      <span className="text-[10px] font-bold mt-1 bg-white/20 px-2 py-0.5 rounded-full inline-block">rejeição em 53% ↘</span>
                    </div>
                    <svg className="w-24 h-16 opacity-30 absolute bottom-4 right-4" viewBox="0 0 100 50">
                      <path d="M0 10 Q 20 30 40 15 T 80 40 T 100 45" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" />
                    </svg>
                  </div>

                  <div className="bg-sky-500 text-white p-6 rounded-3xl shadow-md flex justify-between items-center relative overflow-hidden">
                    <div className="z-10">
                      <span className="text-xs font-bold opacity-80 uppercase block">Pendentes</span>
                      <h4 className="text-2xl font-black mt-2">R$ 90.000,00</h4>
                      <span className="text-[10px] font-bold mt-1 bg-white/20 px-2 py-0.5 rounded-full inline-block">retenção em 53% →</span>
                    </div>
                    <svg className="w-24 h-16 opacity-30 absolute bottom-4 right-4" viewBox="0 0 100 50">
                      <path d="M0 25 H 30 Q 50 10 70 30 T 100 25" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

              </div>
            )}

            {/* TAB: ORÇAMENTOS */}
            {activeTab === 'orcamentos' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                  <div className="relative w-full sm:max-w-md">
                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">🔍</span>
                    <input type="text" placeholder="Procurar orçamentos..." className={`${textInputStyle} pl-12 py-3`} />
                  </div>
                  
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button 
                      onClick={() => { setActiveTab('novo_orcamento_calculadora'); setCalcTab('servico'); }} 
                      className={buttonStyle}
                    >
                      ➕ Criar orçamento
                    </button>
                    <button className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-650 font-bold px-6 py-3 rounded-2xl text-sm transition-all">
                      Ajuda
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 items-start">
                  
                  <div className="space-y-4">
                    <div className="bg-[#00a896] text-white p-4 rounded-2xl flex justify-between items-center shadow-sm">
                      <span className="text-xs font-bold uppercase tracking-wider">Total aceitos</span>
                      <span className="font-extrabold text-sm">
                        R$ {orcamentos.filter(o => o.status === 'Aprovado').reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {orcamentos.filter(o => o.status === 'Aprovado').map(orc => (
                        <div key={orc.id} className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm relative group hover:border-[#00a896] transition-all">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-black text-slate-800 text-base">{orc.titulo}</h5>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Vendedor responsável</p>
                              <span className="text-xs font-bold text-slate-700">{orc.vendedor}</span>
                            </div>
                            
                            <div className="flex gap-1.5 shrink-0">
                              <button 
                                onClick={() => { setOrcamentoSelecionado(orc); setCurrentScreen('tela_enviar_orcamento'); }}
                                title="Visualizar"
                                className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center hover:bg-teal-100 text-[#00a896] transition-all text-xs"
                              >
                                👁️
                              </button>
                              <button 
                                onClick={() => handleEditarOrcamentoClick(orc)}
                                title="Editar"
                                className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 text-blue-500 transition-all text-xs"
                              >
                                ✏️
                              </button>
                              <button 
                                onClick={() => handleExcluirOrcamento(orc.id)}
                                title="Excluir"
                                className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center hover:bg-rose-100 text-rose-500 transition-all text-xs"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          
                          <div className="border-t border-slate-100 mt-4 pt-3 flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold">Valor</span>
                            <span className="font-black text-slate-850">R$ {orc.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-rose-500 text-white p-4 rounded-2xl flex justify-between items-center shadow-sm">
                      <span className="text-xs font-bold uppercase tracking-wider">Total rejeitados</span>
                      <span className="font-extrabold text-sm">
                        R$ {orcamentos.filter(o => o.status === 'Rejeitado').reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {orcamentos.filter(o => o.status === 'Rejeitado').map(orc => (
                        <div key={orc.id} className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm relative group hover:border-rose-500 transition-all">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-black text-slate-800 text-base">{orc.titulo}</h5>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Vendedor responsável</p>
                              <span className="text-xs font-bold text-slate-700">{orc.vendedor}</span>
                            </div>
                            
                            <div className="flex gap-1.5 shrink-0">
                              <button 
                                onClick={() => { setOrcamentoSelecionado(orc); setCurrentScreen('tela_enviar_orcamento'); }}
                                title="Visualizar"
                                className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center hover:bg-teal-100 text-[#00a896] transition-all text-xs"
                              >
                                👁️
                              </button>
                              <button 
                                onClick={() => handleEditarOrcamentoClick(orc)}
                                title="Editar"
                                className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 text-blue-500 transition-all text-xs"
                              >
                                ✏️
                              </button>
                              <button 
                                onClick={() => handleExcluirOrcamento(orc.id)}
                                title="Excluir"
                                className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center hover:bg-rose-100 text-rose-500 transition-all text-xs"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          
                          <div className="border-t border-slate-100 mt-4 pt-3 flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold">Valor</span>
                            <span className="font-black text-slate-850">R$ {orc.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-amber-500 text-white p-4 rounded-2xl flex justify-between items-center shadow-sm">
                      <span className="text-xs font-bold uppercase tracking-wider">Total pendentes</span>
                      <span className="font-extrabold text-sm">
                        R$ {orcamentos.filter(o => o.status === 'Pendente').reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {orcamentos.filter(o => o.status === 'Pendente').map(orc => (
                        <div key={orc.id} className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm relative group hover:border-amber-500 transition-all">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-black text-slate-800 text-base">{orc.titulo}</h5>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Vendedor responsável</p>
                              <span className="text-xs font-bold text-slate-700">{orc.vendedor}</span>
                            </div>
                            
                            <div className="flex gap-1.5 shrink-0">
                              <button 
                                onClick={() => { setOrcamentoSelecionado(orc); setCurrentScreen('tela_enviar_orcamento'); }}
                                title="Visualizar"
                                className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center hover:bg-teal-100 text-[#00a896] transition-all text-xs"
                              >
                                👁️
                              </button>
                              <button 
                                onClick={() => handleEditarOrcamentoClick(orc)}
                                title="Editar"
                                className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 text-blue-500 transition-all text-xs"
                              >
                                ✏️
                              </button>
                              <button 
                                onClick={() => handleExcluirOrcamento(orc.id)}
                                title="Excluir"
                                className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center hover:bg-rose-100 text-rose-500 transition-all text-xs"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          
                          <div className="border-t border-slate-100 mt-4 pt-3 flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold">Valor</span>
                            <span className="font-black text-slate-850">R$ {orc.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB: NOVO ORÇAMENTO/CALCULADORA */}
            {activeTab === 'novo_orcamento_calculadora' && (
              <div className="space-y-8 max-w-5xl mx-auto">
                <div className="flex border-b border-slate-200">
                  <button 
                    onClick={() => setCalcTab('servico')} 
                    className={`pb-4 px-8 font-black text-base transition-all border-b-4 ${calcTab === 'servico' ? 'border-[#00a896] text-[#00a896]' : 'border-transparent text-slate-400'}`}
                  >
                    Serviço
                  </button>
                  <button 
                    onClick={() => setCalcTab('produto')} 
                    className={`pb-4 px-8 font-black text-base transition-all border-b-4 ${calcTab === 'produto' ? 'border-[#00a896] text-[#00a896]' : 'border-transparent text-slate-400'}`}
                  >
                    Produto
                  </button>
                </div>

                <div className="grid md:grid-cols-5 gap-8 items-start">
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 md:col-span-3">
                    <h3 className="text-lg font-black text-slate-850 flex items-center gap-3">
                      📝 Informações do orçamento
                    </h3>
                    
                    <div className="space-y-4">
                      <input 
                        type="text" 
                        placeholder="Nome do vendedor" 
                        value={novoOrcamentoForm.vendedor}
                        onChange={e => setNovoOrcamentoForm({...novoOrcamentoForm, vendedor: e.target.value})}
                        className={textInputStyle} 
                      />
                      <input 
                        type="text" 
                        placeholder="Nome da empresa" 
                        value={novoOrcamentoForm.empresa}
                        onChange={e => setNovoOrcamentoForm({...novoOrcamentoForm, empresa: e.target.value})}
                        className={textInputStyle} 
                      />
                      
                      <div className="border-t border-slate-100 pt-6">
                        <h4 className="text-sm font-black text-slate-700 mb-4">Descrição do orçamento</h4>
                        <input 
                          type="text" 
                          placeholder="Título do projeto" 
                          value={novoOrcamentoForm.titulo}
                          onChange={e => setNovoOrcamentoForm({...novoOrcamentoForm, titulo: e.target.value})}
                          className={textInputStyle} 
                        />
                        <textarea 
                          placeholder="Descrição do projeto..." 
                          rows={4}
                          value={novoOrcamentoForm.descricao}
                          onChange={e => setNovoOrcamentoForm({...novoOrcamentoForm, descricao: e.target.value})}
                          className={`${textInputStyle} mt-3 resize-none`}
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 md:col-span-2">
                    <h3 className="text-lg font-black text-slate-850">
                      🎛️ Markup & Taxas
                    </h3>
                    
                    <div className="space-y-5">
                      <div>
                        <div className="flex justify-between text-xs font-black text-slate-500 mb-2">
                          <span>Imposto</span>
                          <span className="text-[#00a896]">{imposto}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={imposto} onChange={e => setImposto(e.target.value)} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#00a896]" />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-black text-slate-500 mb-2">
                          <span>Comissão</span>
                          <span className="text-[#00a896]">{comissao}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={comissao} onChange={e => setComissao(e.target.value)} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#00a896]" />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-black text-slate-500 mb-2">
                          <span>Taxa de cartão</span>
                          <span className="text-[#00a896]">{taxaCartao}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={taxaCartao} onChange={e => setTaxaCartao(e.target.value)} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#00a896]" />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-black text-slate-500 mb-2">
                          <span>Capacidade produtiva</span>
                          <span className="text-[#00a896]">{capacidade}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={capacidade} onChange={e => setCapacidade(e.target.value)} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#00a896]" />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-black text-slate-500 mb-2">
                          <span>Lucros</span>
                          <span className="text-[#00a896]">{lucro}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={lucro} onChange={e => setLucro(e.target.value)} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#00a896]" />
                      </div>

                      {calcTab === 'produto' && (
                        <div className="border-t border-slate-100 pt-5 mt-5 space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Faturamento real</label>
                              <input 
                                type="number" 
                                value={novoOrcamentoForm.faturamentoReal}
                                onChange={e => setNovoOrcamentoForm({...novoOrcamentoForm, faturamentoReal: e.target.value})}
                                className={textInputStyle} 
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Valor do produto</label>
                              <input 
                                type="number" 
                                value={novoOrcamentoForm.valorProduto}
                                onChange={e => setNovoOrcamentoForm({...novoOrcamentoForm, valorProduto: e.target.value})}
                                className={textInputStyle} 
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                            <span>Taxa de Markup</span>
                            <span className="text-slate-800 font-black text-sm">{calcMarkup()}</span>
                          </div>
                        </div>
                      )}

                      <div className="border-t border-slate-100 pt-5 mt-5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Preço Final Calculado</span>
                        <h4 className="text-2xl font-black text-[#00a896] mt-2">
                          Total R$ {calcTotalOrcamento()}
                        </h4>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                  <button 
                    onClick={() => setActiveTab('orcamentos')} 
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-650 font-bold py-3.5 px-8 rounded-2xl text-sm transition-all sm:w-auto w-full text-center"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSalvarOrcamento}
                    className={`${buttonStyle} sm:w-auto`}
                  >
                    Salvar Orçamento
                  </button>
                </div>

              </div>
            )}

            {/* TAB: INVESTIMENTOS */}
            {activeTab === 'investimentos' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <div className="relative w-full max-w-md">
                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">🔍</span>
                    <input type="text" placeholder="Procurar investimentos..." className={`${textInputStyle} pl-12 py-3`} />
                  </div>
                  <button className="bg-slate-100 border border-slate-200 text-slate-600 font-bold px-6 py-3 rounded-2xl text-sm flex items-center gap-2 hover:bg-slate-200 transition-all">
                    <span>⚡</span> Filtrar
                  </button>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 items-start">
                  
                  <div className="bg-white p-6 rounded-[28px] border border-slate-150 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <span className="text-xs font-bold text-amber-600 uppercase bg-amber-50 px-3 py-1 rounded-full">🍊 Marketing</span>
                      <button className="text-slate-400 font-bold">•••</button>
                    </div>
                    
                    <div className="space-y-2">
                      {investimentosEstoque.filter(i => i.categoria.toLowerCase() === 'marketing').map(inv => (
                        <div key={inv.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center transition-all">
                          <span className="font-semibold text-xs text-slate-600">{inv.titulo}</span>
                          <span className="font-black text-xs text-slate-800">R$ {inv.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Novo..." 
                          value={newInvestimentoInput.marketing.title}
                          onChange={e => setNewInvestimentoInput({...newInvestimentoInput, marketing: {...newInvestimentoInput.marketing, title: e.target.value}})}
                          className={`${textInputStyle} py-2 px-3 text-xs`} 
                        />
                        <input 
                          type="number" 
                          placeholder="R$..." 
                          value={newInvestimentoInput.marketing.value}
                          onChange={e => setNewInvestimentoInput({...newInvestimentoInput, marketing: {...newInvestimentoInput.marketing, value: e.target.value}})}
                          className={`${textInputStyle} py-2 px-3 text-xs w-24`} 
                        />
                        <button 
                          onClick={() => {
                            if (!newInvestimentoInput.marketing.title || !newInvestimentoInput.marketing.value) return;
                            handleSalvarInvestimento(
                              'Marketing',
                              newInvestimentoInput.marketing.title,
                              newInvestimentoInput.marketing.value,
                              () => setNewInvestimentoInput({...newInvestimentoInput, marketing: { title: '', value: '' }})
                            );
                          }}
                          className="bg-[#00a896] text-white px-3 rounded-xl font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-[28px] border border-slate-150 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <span className="text-xs font-bold text-[#00a896] uppercase bg-teal-50 px-3 py-1 rounded-full">🏢 Bens Materiais</span>
                      <button className="text-slate-400 font-bold">•••</button>
                    </div>
                    
                    <div className="space-y-2">
                      {investimentosEstoque.filter(i => i.categoria.toLowerCase() === 'bens materiais' || i.categoria.toLowerCase() === 'bensmateriais').map(inv => (
                        <div key={inv.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center transition-all">
                          <span className="font-semibold text-xs text-slate-600">{inv.titulo}</span>
                          <span className="font-black text-xs text-slate-800">R$ {inv.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Novo..." 
                          value={newInvestimentoInput.bens.title}
                          onChange={e => setNewInvestimentoInput({...newInvestimentoInput, bens: {...newInvestimentoInput.bens, title: e.target.value}})}
                          className={`${textInputStyle} py-2 px-3 text-xs`} 
                        />
                        <input 
                          type="number" 
                          placeholder="R$..." 
                          value={newInvestimentoInput.bens.value}
                          onChange={e => setNewInvestimentoInput({...newInvestimentoInput, bens: {...newInvestimentoInput.bens, value: e.target.value}})}
                          className={`${textInputStyle} py-2 px-3 text-xs w-24`} 
                        />
                        <button 
                          onClick={() => {
                            if (!newInvestimentoInput.bens.title || !newInvestimentoInput.bens.value) return;
                            handleSalvarInvestimento(
                              'Bens Materiais',
                              newInvestimentoInput.bens.title,
                              newInvestimentoInput.bens.value,
                              () => setNewInvestimentoInput({...newInvestimentoInput, bens: { title: '', value: '' }})
                            );
                          }}
                          className="bg-[#00a896] text-white px-3 rounded-xl font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-[28px] border border-slate-150 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <span className="text-xs font-bold text-purple-600 uppercase bg-purple-50 px-3 py-1 rounded-full">📈 Gestão empresarial</span>
                      <button className="text-slate-400 font-bold">•••</button>
                    </div>
                    
                    <div className="space-y-2">
                      {investimentosEstoque.filter(i => i.categoria.toLowerCase() === 'gestão empresarial' || i.categoria.toLowerCase() === 'gestao').map(inv => (
                        <div key={inv.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center transition-all">
                          <span className="font-semibold text-xs text-slate-600">{inv.titulo}</span>
                          <span className="font-black text-xs text-slate-800">R$ {inv.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Novo..." 
                          value={newInvestimentoInput.gestao.title}
                          onChange={e => setNewInvestimentoInput({...newInvestimentoInput, gestao: {...newInvestimentoInput.gestao, title: e.target.value}})}
                          className={`${textInputStyle} py-2 px-3 text-xs`} 
                        />
                        <input 
                          type="number" 
                          placeholder="R$..." 
                          value={newInvestimentoInput.gestao.value}
                          onChange={e => setNewInvestimentoInput({...newInvestimentoInput, gestao: {...newInvestimentoInput.gestao, value: e.target.value}})}
                          className={`${textInputStyle} py-2 px-3 text-xs w-24`} 
                        />
                        <button 
                          onClick={() => {
                            if (!newInvestimentoInput.gestao.title || !newInvestimentoInput.gestao.value) return;
                            handleSalvarInvestimento(
                              'Gestão empresarial',
                              newInvestimentoInput.gestao.title,
                              newInvestimentoInput.gestao.value,
                              () => setNewInvestimentoInput({...newInvestimentoInput, gestao: { title: '', value: '' }})
                            );
                          }}
                          className="bg-[#00a896] text-white px-3 rounded-xl font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB: MINHA EMPRESA */}
            {activeTab === 'minha_empresa' && (
              <div className="space-y-8">
                
                {subTabEmpresa === 'menu' && (
                  <div className="grid sm:grid-cols-3 gap-6">
                    <div 
                      onClick={() => setSubTabEmpresa('despesas')} 
                      className="bg-white p-8 rounded-3xl border border-slate-150 hover:border-[#00a896] transition-all cursor-pointer shadow-sm hover:shadow-md text-center space-y-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 font-bold flex items-center justify-center text-3xl mx-auto">
                        📉
                      </div>
                      <h4 className="font-black text-slate-800 text-lg">Despesas fixas</h4>
                      <p className="text-slate-400 text-xs font-semibold">Veja e gerencie sua lista de gastos recorrentes</p>
                    </div>

                    <div 
                      onClick={() => setSubTabEmpresa('colaboradores')} 
                      className="bg-white p-8 rounded-3xl border border-slate-150 hover:border-[#00a896] transition-all cursor-pointer shadow-sm hover:shadow-md text-center space-y-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-teal-50 text-[#00a896] font-bold flex items-center justify-center text-3xl mx-auto">
                        👥
                      </div>
                      <h4 className="font-black text-slate-800 text-lg">Colaboradores</h4>
                      <p className="text-slate-400 text-xs font-semibold">Adicione, edite ou remova membros da sua equipe</p>
                    </div>

                    <div 
                      onClick={() => alert('Recurso em desenvolvimento: Editar Empresa.')} 
                      className="bg-white p-8 rounded-3xl border border-slate-150 hover:border-[#00a896] transition-all cursor-pointer shadow-sm hover:shadow-md text-center space-y-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 font-bold flex items-center justify-center text-3xl mx-auto">
                        🏢
                      </div>
                      <h4 className="font-black text-slate-800 text-lg">Editar minha empresa</h4>
                      <p className="text-slate-400 text-xs font-semibold">Edite informações cadastrais da sua empresa</p>
                    </div>
                  </div>
                )}

                {subTabEmpresa === 'despesas' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                      <button onClick={() => setSubTabEmpresa('menu')} className="text-xs font-black text-slate-400 hover:text-slate-600">
                        ← Voltar ao Menu
                      </button>
                      <div className="flex gap-3">
                        <button className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-650 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2">
                          <span>⚡</span> Filtrar
                        </button>
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 items-start">
                      
                      <div className="bg-white p-6 rounded-[28px] border border-slate-150 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                          <span className="text-xs font-bold text-rose-500 uppercase bg-rose-50 px-3 py-1 rounded-full">📊 Financeiras</span>
                          <button className="text-slate-400 font-bold">•••</button>
                        </div>
                        
                        <div className="space-y-2">
                          {despesasEstoque.filter(d => d.categoria.toLowerCase() === 'financeiras' || d.categoria.toLowerCase() === 'financeiro').map(desp => (
                            <div key={desp.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center transition-all">
                              <span className="font-semibold text-xs text-slate-600">{desp.titulo}</span>
                              <span className="font-black text-xs text-rose-500">- R$ {desp.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-slate-100 pt-4">
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="Novo..." 
                              value={newDespesaInput.financeiras.title}
                              onChange={e => setNewDespesaInput({...newDespesaInput, financeiras: {...newDespesaInput.financeiras, title: e.target.value}})}
                              className={`${textInputStyle} py-2 px-3 text-xs`} 
                            />
                            <input 
                              type="number" 
                              placeholder="R$..." 
                              value={newDespesaInput.financeiras.value}
                              onChange={e => setNewDespesaInput({...newDespesaInput, financeiras: {...newDespesaInput.financeiras, value: e.target.value}})}
                              className={`${textInputStyle} py-2 px-3 text-xs w-24`} 
                            />
                            <button 
                              onClick={() => {
                                if (!newDespesaInput.financeiras.title || !newDespesaInput.financeiras.value) return;
                                handleSalvarDespesa(
                                  'Financeiras',
                                  newDespesaInput.financeiras.title,
                                  newDespesaInput.financeiras.value,
                                  () => setNewDespesaInput({...newDespesaInput, financeiras: { title: '', value: '' }})
                                );
                              }}
                              className="bg-[#00a896] text-white px-3 rounded-xl font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-[28px] border border-slate-150 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                          <span className="text-xs font-bold text-[#00a896] uppercase bg-teal-50 px-3 py-1 rounded-full">🏢 Administrativas</span>
                          <button className="text-slate-400 font-bold">•••</button>
                        </div>
                        
                        <div className="space-y-2">
                          {despesasEstoque.filter(d => d.categoria.toLowerCase() === 'administrativas').map(desp => (
                            <div key={desp.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center transition-all">
                              <span className="font-semibold text-xs text-slate-600">{desp.titulo}</span>
                              <span className="font-black text-xs text-rose-500">- R$ {desp.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-slate-100 pt-4">
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="Novo..." 
                              value={newDespesaInput.administrativas.title}
                              onChange={e => setNewDespesaInput({...newDespesaInput, administrativas: {...newDespesaInput.administrativas, title: e.target.value}})}
                              className={`${textInputStyle} py-2 px-3 text-xs`} 
                            />
                            <input 
                              type="number" 
                              placeholder="R$..." 
                              value={newDespesaInput.administrativas.value}
                              onChange={e => setNewDespesaInput({...newDespesaInput, administrativas: {...newDespesaInput.administrativas, value: e.target.value}})}
                              className={`${textInputStyle} py-2 px-3 text-xs w-24`} 
                            />
                            <button 
                              onClick={() => {
                                if (!newDespesaInput.administrativas.title || !newDespesaInput.administrativas.value) return;
                                handleSalvarDespesa(
                                  'Administrativas',
                                  newDespesaInput.administrativas.title,
                                  newDespesaInput.administrativas.value,
                                  () => setNewDespesaInput({...newDespesaInput, administrativas: { title: '', value: '' }})
                                );
                              }}
                              className="bg-[#00a896] text-white px-3 rounded-xl font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-[28px] border border-slate-150 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                          <span className="text-xs font-bold text-indigo-500 uppercase bg-indigo-50 px-3 py-1 rounded-full">👥 Pessoal</span>
                          <button className="text-slate-400 font-bold">•••</button>
                        </div>
                        
                        <div className="space-y-2">
                          {despesasEstoque.filter(d => d.categoria.toLowerCase() === 'pessoal').map(desp => (
                            <div key={desp.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center transition-all">
                              <span className="font-semibold text-xs text-slate-600">{desp.titulo}</span>
                              <span className="font-black text-xs text-rose-500">- R$ {desp.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-slate-100 pt-4">
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="Novo..." 
                              value={newDespesaInput.pessoal.title}
                              onChange={e => setNewDespesaInput({...newDespesaInput, pessoal: {...newDespesaInput.pessoal, title: e.target.value}})}
                              className={`${textInputStyle} py-2 px-3 text-xs`} 
                            />
                            <input 
                              type="number" 
                              placeholder="R$..." 
                              value={newDespesaInput.pessoal.value}
                              onChange={e => setNewDespesaInput({...newDespesaInput, pessoal: {...newDespesaInput.pessoal, value: e.target.value}})}
                              className={`${textInputStyle} py-2 px-3 text-xs w-24`} 
                            />
                            <button 
                              onClick={() => {
                                if (!newDespesaInput.pessoal.title || !newDespesaInput.pessoal.value) return;
                                handleSalvarDespesa(
                                  'Pessoal',
                                  newDespesaInput.pessoal.title,
                                  newDespesaInput.pessoal.value,
                                  () => setNewDespesaInput({...newDespesaInput, pessoal: { title: '', value: '' }})
                                );
                              }}
                              className="bg-[#00a896] text-white px-3 rounded-xl font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {subTabEmpresa === 'colaboradores' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-4">
                      <button onClick={() => setSubTabEmpresa('menu')} className="text-xs font-black text-slate-400 hover:text-slate-600">
                        ← Voltar ao Menu
                      </button>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setCurrentScreen('tela_14_add_colaborador')} 
                          className="bg-[#00a896] hover:bg-[#008f7f] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-all"
                        >
                          ➕ Adicionar colaborador
                        </button>
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 items-start">
                      
                      <div className="bg-white p-6 rounded-[28px] border border-slate-150 shadow-sm space-y-4">
                        <h4 className="text-xs font-bold text-[#00a896] uppercase bg-teal-50 px-3 py-1 rounded-full w-max">📣 Marketing</h4>
                        <div className="space-y-3">
                          {colaboradoresEstoque.filter(c => c.setor.toLowerCase() === 'marketing').map(colab => (
                            <div key={colab.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-teal-150 text-[#00a896] font-bold flex items-center justify-center text-xs">
                                  {colab.nome.substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                  <h5 className="font-black text-slate-800 text-sm">{colab.nome}</h5>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase">{colab.cargo}</p>
                                </div>
                              </div>
                              <div className="border-t border-slate-100/60 mt-3 pt-3 flex justify-between text-xs font-bold text-slate-500">
                                <span>Remuneração</span>
                                <span className="text-slate-800">R$ {colab.remuneracao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-[28px] border border-slate-150 shadow-sm space-y-4">
                        <h4 className="text-xs font-bold text-[#00a896] uppercase bg-teal-50 px-3 py-1 rounded-full w-max">🛒 Vendas</h4>
                        <div className="space-y-3">
                          {colaboradoresEstoque.filter(c => c.setor.toLowerCase() === 'vendas').map(colab => (
                            <div key={colab.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-teal-150 text-[#00a896] font-bold flex items-center justify-center text-xs">
                                  {colab.nome.substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                  <h5 className="font-black text-slate-800 text-sm">{colab.nome}</h5>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase">{colab.cargo}</p>
                                </div>
                              </div>
                              <div className="border-t border-slate-100/60 mt-3 pt-3 flex justify-between text-xs font-bold text-slate-500">
                                <span>Remuneração</span>
                                <span className="text-slate-800">R$ {colab.remuneracao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-[28px] border border-slate-150 shadow-sm space-y-4">
                        <h4 className="text-xs font-bold text-[#00a896] uppercase bg-teal-50 px-3 py-1 rounded-full w-max">💻 Produto</h4>
                        <div className="space-y-3">
                          {colaboradoresEstoque.filter(c => c.setor.toLowerCase() === 'produto').map(colab => (
                            <div key={colab.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-teal-150 text-[#00a896] font-bold flex items-center justify-center text-xs">
                                  {colab.nome.substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                  <h5 className="font-black text-slate-800 text-sm">{colab.nome}</h5>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase">{colab.cargo}</p>
                                </div>
                              </div>
                              <div className="border-t border-slate-100/60 mt-3 pt-3 flex justify-between text-xs font-bold text-slate-500">
                                <span>Remuneração</span>
                                <span className="text-slate-800">R$ {colab.remuneracao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB: CONFIGURAÇÕES */}
            {activeTab === 'configuracoes' && (
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm max-w-md space-y-6">
                <h3 className="text-lg font-black text-slate-850">⚙️ Configurações Gerais</h3>
                <div className="space-y-3">
                  <div onClick={() => setCurrentScreen('tela_9_planos')} className="p-4 bg-slate-50 hover:bg-teal-50 border border-slate-100 hover:border-[#00a896] rounded-2xl font-bold text-slate-700 text-sm cursor-pointer transition-all flex justify-between items-center">
                    <span>Planos de Acesso</span>
                    <span className="text-slate-400">→</span>
                  </div>
                  <div onClick={() => setCurrentScreen('tela_10_checkout')} className="p-4 bg-slate-50 hover:bg-teal-50 border border-slate-100 hover:border-[#00a896] rounded-2xl font-bold text-slate-700 text-sm cursor-pointer transition-all flex justify-between items-center">
                    <span>Meios de pagamento</span>
                    <span className="text-slate-400">→</span>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      )}

      {/* =========================================================================
          TELA: ENVIAR ORÇAMENTO / DOWNLOAD PDF
         ========================================================================= */}
      {currentScreen === 'tela_enviar_orcamento' && (
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 min-h-screen">
          <div className="bg-white p-10 rounded-[32px] shadow-2xl max-w-lg w-full border border-slate-100 relative">
            <button 
              onClick={() => setCurrentScreen('tela_2_dashboard_hub')} 
              className="absolute top-6 left-6 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ← Voltar
            </button>
            
            <div className="text-center pt-6 mb-8">
              <h2 className="text-3xl font-black text-slate-800">Enviar Orçamento</h2>
              <p className="text-slate-400 text-sm font-semibold mt-2">
                Para enviar o orçamento, insira o e-mail do seu cliente
              </p>
            </div>
            
            {orcamentoSelecionado && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-8 flex justify-between items-center">
                <div>
                  <h4 className="font-black text-slate-700 text-base">{orcamentoSelecionado.titulo}</h4>
                  <span className="text-xs text-slate-400 font-bold">Vendedor: {orcamentoSelecionado.vendedor}</span>
                </div>
                <span className="font-black text-[#00a896] text-lg">
                  R$ {orcamentoSelecionado.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            
            <form onSubmit={handleEnviarOrcamento} className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">E-mail</label>
                <input 
                  type="email" 
                  placeholder="empresa@gmail.com" 
                  required 
                  value={emailCliente}
                  onChange={e => setEmailCliente(e.target.value)}
                  className={textInputStyle} 
                />
              </div>
              
              <button type="submit" className={buttonStyle}>
                Enviar
              </button>
            </form>

            <button 
              onClick={() => alert('Download do PDF iniciado com sucesso!')}
              className="w-full text-center text-xs font-bold text-[#00a896] mt-6 flex justify-center items-center gap-2 hover:underline"
            >
              📄 Baixar orçamento em PDF
            </button>
          </div>
        </div>
      )}

      {/* Rodapé comum */}
      <footer className="bg-white border-t border-slate-100 py-5 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
        &copy; 2026 Empreasy Inteligência Corporativa Ltda. Todos os direitos reservados.
      </footer>

      {/* MODAL DE EDIÇÃO DE ORÇAMENTO */}
      {isEditModalOpen && orcamentoSendoEditado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-lg w-full p-8 shadow-2xl border border-slate-100 relative overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => { setIsEditModalOpen(false); setOrcamentoSendoEditado(null); }}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-650 transition-all font-bold text-xl"
            >
              ✕
            </button>
            
            <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
              ✏️ Editar Orçamento
            </h3>
            
            <form onSubmit={handleSalvarEdicaoOrcamento} className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Título do Projeto</label>
                <input 
                  type="text" 
                  required
                  value={orcamentoSendoEditado.titulo} 
                  onChange={(e) => setOrcamentoSendoEditado({...orcamentoSendoEditado, titulo: e.target.value})}
                  className={textInputStyle} 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Valor (R$)</label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    value={orcamentoSendoEditado.valor} 
                    onChange={(e) => setOrcamentoSendoEditado({...orcamentoSendoEditado, valor: e.target.value})}
                    className={textInputStyle} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Vendedor</label>
                  <input 
                    type="text" 
                    required
                    value={orcamentoSendoEditado.vendedor} 
                    onChange={(e) => setOrcamentoSendoEditado({...orcamentoSendoEditado, vendedor: e.target.value})}
                    className={textInputStyle} 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Status</label>
                  <select 
                    value={orcamentoSendoEditado.status} 
                    onChange={(e) => setOrcamentoSendoEditado({...orcamentoSendoEditado, status: e.target.value})}
                    className={textInputStyle}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Rejeitado">Rejeitado</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">E-mail do Cliente</label>
                  <input 
                    type="email" 
                    value={orcamentoSendoEditado.email_cliente || ''} 
                    onChange={(e) => setOrcamentoSendoEditado({...orcamentoSendoEditado, email_cliente: e.target.value})}
                    className={textInputStyle} 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Nome da Empresa Cliente</label>
                <input 
                  type="text" 
                  value={orcamentoSendoEditado.empresa || ''} 
                  onChange={(e) => setOrcamentoSendoEditado({...orcamentoSendoEditado, empresa: e.target.value})}
                  className={textInputStyle} 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Descrição</label>
                <textarea 
                  rows="3"
                  value={orcamentoSendoEditado.descricao || ''} 
                  onChange={(e) => setOrcamentoSendoEditado({...orcamentoSendoEditado, descricao: e.target.value})}
                  className={`${textInputStyle} resize-none`} 
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setIsEditModalOpen(false); setOrcamentoSendoEditado(null); }}
                  className={buttonOutlineStyle}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={buttonStyle}
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}