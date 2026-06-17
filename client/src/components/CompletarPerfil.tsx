import { useState } from 'react';
import { useLocation } from 'wouter';
import { usuarios as api } from '@/services/api';
import { toast } from 'sonner';
import {
  MapPin,
  Phone,
  ArrowRight,
  SkipForward,
  CheckCircle2,
  Building2,
  User,
  Loader2,
  Info,
} from 'lucide-react';

interface Props {
  usuarioId: number;
}

export default function CompletarPerfil({ usuarioId }: Props) {
  const [, navigate] = useLocation();
  const [etapa, setEtapa] = useState<'endereco' | 'telefone'>('endereco');
  const [salvando, setSalvando] = useState(false);

  // endereço
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');

  // telefone
  const [telefoneNum, setTelefoneNum] = useState('');
  const [telefoneTipo, setTelefoneTipo] = useState('Celular');

  async function salvarEndereco() {
    if (!rua.trim() || !cidade.trim() || !estado.trim()) {
      toast.error('Rua, cidade e estado são obrigatórios.');
      return;
    }
    try {
      setSalvando(true);
      await api.atualizarEndereco(usuarioId, {
        rua, numero, complemento, bairro, cidade, estado, cep,
      });
      toast.success('Endereço salvo!');
      setEtapa('telefone');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Erro ao salvar endereço');
    } finally {
      setSalvando(false);
    }
  }

  async function salvarTelefone() {
    if (!telefoneNum.trim()) {
      toast.error('Número é obrigatório.');
      return;
    }
    try {
      setSalvando(true);
      await api.atualizarTelefone(usuarioId, {
        numero: telefoneNum,
        tipo: telefoneTipo,
      });
      toast.success('Telefone salvo! Redirecionando para o login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Erro ao salvar telefone');
    } finally {
      setSalvando(false);
    }
  }

  function pularEtapa() {
    if (etapa === 'endereco') {
      setEtapa('telefone');
    } else {
      toast.success('Conta criada! Redirecionando para o login...');
      setTimeout(() => navigate('/login'), 1200);
    }
  }

  return (
    <div className="space-y-6">
      {/* Indicador de etapa */}
      <div className="flex items-center justify-center gap-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
          etapa === 'endereco'
            ? 'bg-primary/10 text-primary border border-primary/30'
            : 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800'
        }`}>
          {etapa === 'endereco' ? (
            <MapPin className="w-3.5 h-3.5" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          Endereço
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
          etapa === 'telefone'
            ? 'bg-primary/10 text-primary border border-primary/30'
            : 'bg-muted text-muted-foreground border border-border'
        }`}>
          <Phone className="w-3.5 h-3.5" />
          Telefone
        </div>
      </div>

      {/* ─── Etapa Endereço ───────────────────────────────────────────── */}
      {etapa === 'endereco' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="text-center mb-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Seu endereço</h3>
            <p className="text-sm text-muted-foreground mt-1">Complete seus dados para uma melhor experiência</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Rua <span className="text-destructive">*</span></label>
              <input type="text" value={rua} onChange={(e) => setRua(e.target.value)} className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 mt-1" />
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Número</label>
              <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 mt-1" />
            </div>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Complemento</label>
            <input type="text" value={complemento} onChange={(e) => setComplemento(e.target.value)} className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 mt-1" placeholder="Apto, bloco, etc." />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Bairro</label>
            <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 mt-1" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Cidade <span className="text-destructive">*</span></label>
              <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 mt-1" />
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Estado <span className="text-destructive">*</span></label>
              <input type="text" value={estado} onChange={(e) => setEstado(e.target.value)} maxLength={2} placeholder="UF" className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 mt-1" />
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">CEP</label>
              <input type="text" value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 mt-1" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={salvarEndereco}
              disabled={salvando}
              className="flex-1 py-3 bg-primary text-white rounded-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Salvar e continuar</>}
            </button>
            <button
              onClick={pularEtapa}
              className="px-4 py-3 text-muted-foreground hover:text-slate-700 dark:hover:text-slate-300 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm border border-slate-200 dark:border-slate-600"
            >
              <SkipForward className="w-4 h-4" /> Pular
            </button>
          </div>
        </div>
      )}

      {/* ─── Etapa Telefone ───────────────────────────────────────────── */}
      {etapa === 'telefone' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="text-center mb-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Seu telefone</h3>
            <p className="text-sm text-muted-foreground mt-1">Para que possamos entrar em contato se necessário</p>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Número <span className="text-destructive">*</span></label>
            <input type="text" value={telefoneNum} onChange={(e) => setTelefoneNum(e.target.value)} placeholder="(21) 99999-9999" className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 mt-1" />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Tipo</label>
            <select
              value={telefoneTipo}
              onChange={(e) => setTelefoneTipo(e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 mt-1"
            >
              <option value="Celular">Celular</option>
              <option value="Residencial">Residencial</option>
              <option value="Comercial">Comercial</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={salvarTelefone}
              disabled={salvando}
              className="flex-1 py-3 bg-primary text-white rounded-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Finalizar</>}
            </button>
            <button
              onClick={pularEtapa}
              className="px-4 py-3 text-muted-foreground hover:text-slate-700 dark:hover:text-slate-300 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm border border-slate-200 dark:border-slate-600"
            >
              <SkipForward className="w-4 h-4" /> Pular
            </button>
          </div>
        </div>
      )}

      {/* ─── Aviso de onde editar depois ──────────────────────────────── */}
      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-semibold">Pode completar depois!</p>
          <p className="mt-1 text-blue-600 dark:text-blue-400">
            Após fazer login, acesse <strong>Meu Perfil</strong> clicando no seu avatar no canto superior direito. Lá você pode editar endereço, telefone e adicionar uma foto.
          </p>
        </div>
      </div>
    </div>
  );
}
