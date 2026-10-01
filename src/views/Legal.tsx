import React from 'react';
import { Navbar } from '../components/Navbar';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const TermsOfUse: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 text-sm"><ArrowLeft className="w-4 h-4"/> Voltar</Link>
        <h1 className="text-4xl font-bold mb-8">Termos de Uso</h1>
        <div className="prose prose-invert prose-zinc max-w-none">
          <p>Última atualização: {new Date().toLocaleDateString()}</p>
          
          <h3>1. Aceitação dos Termos</h3>
          <p>Ao acessar e usar o IAPLAY, você concorda em cumprir estes Termos de Uso e todas as leis aplicáveis.</p>

          <h3>2. Descrição do Serviço</h3>
          <p>O IAPLAY é uma ferramenta SaaS de composição assistida por inteligência artificial que fornece geração de letras, estruturação de prompts e sugestões criativas.</p>

          <h3>3. Assinaturas e Pagamentos</h3>
          <p>Alguns recursos requerem uma assinatura paga. O processamento de pagamentos é realizado pela Kiwify. O cancelamento pode ser feito a qualquer momento, mantendo-se o acesso até o fim do ciclo vigente.</p>

          <h3>4. Uso Aceitável</h3>
          <p>Você concorda em não usar o serviço para gerar conteúdo ilegal, ofensivo ou que viole direitos autorais de terceiros.</p>

          <h3>5. Propriedade Intelectual</h3>
          <p>As composições geradas (letras e prompts) são de propriedade do usuário, exceto onde limitado pelos termos das IAs subjacentes (OpenAI, Google, Groq).</p>
        </div>
      </div>
    </div>
  );
};

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 text-sm"><ArrowLeft className="w-4 h-4"/> Voltar</Link>
        <h1 className="text-4xl font-bold mb-8">Política de Privacidade</h1>
        <div className="prose prose-invert prose-zinc max-w-none">
          <p>Última atualização: {new Date().toLocaleDateString()}</p>

          <h3>1. Coleta de Dados</h3>
          <p>Coletamos apenas informações essenciais para o funcionamento do serviço: Nome, Email e dados de uso (projetos criados). Não armazenamos dados de cartão de crédito (geridos pela Kiwify).</p>

          <h3>2. Uso das Informações</h3>
          <p>Utilizamos seus dados para autenticação, personalização do serviço e comunicação sobre atualizações ou suporte.</p>

          <h3>3. Chaves de API</h3>
          <p>Se você optar por usar suas próprias Chaves de API (Google/OpenAI), elas são armazenadas <strong>exclusivamente no armazenamento local (LocalStorage) do seu navegador</strong>. Elas nunca são enviadas para nossos servidores.</p>

          <h3>4. Compartilhamento</h3>
          <p>Não vendemos nem compartilhamos seus dados pessoais com terceiros para fins de marketing.</p>

          <h3>5. Seus Direitos</h3>
          <p>Você pode solicitar a exclusão da sua conta e de todos os dados associados a qualquer momento através do nosso suporte ou painel de configurações.</p>
        </div>
      </div>
    </div>
  );
};