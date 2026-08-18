import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  LogOut, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  Check, 
  AlertCircle,
  Cloud,
  Flame
} from 'lucide-react';
import { 
  auth, 
  isFirebaseConnected, 
  getLocalFallbackUserId 
} from '../firebase/config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type User as FirebaseUser 
} from 'firebase/auth';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth?.currentUser || null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth) {
      const unsub = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
      });
      return () => unsub();
    }
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!auth || !isFirebaseConnected) {
      setErrorMsg('Não foi possível autenticar no momento. Verifique sua conexão com a internet.');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setErrorMsg('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Este e-mail já está cadastrado. Faça login.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
      } else {
        setErrorMsg('Erro na autenticação: ' + (err.message || 'Verifique sua conexão.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
    }
    setCurrentUser(null);
  };

  const localUserId = getLocalFallbackUserId();

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full my-6 shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#0f381e] text-white flex items-center justify-between border-b border-[#1b5e20]">
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
              <User className="w-5 h-5 text-[#f5b000]" />
              Minha Conta & Acesso
            </h2>
            <p className="text-xs text-slate-300">
              Sincronize seus orçamentos em todos os seus aparelhos.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-2 rounded-xl hover:bg-white/10 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Se o usuário já estiver logado com e-mail */}
          {currentUser && !currentUser.isAnonymous ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center">
                <div className="w-12 h-12 rounded-full bg-[#0f381e] text-[#f5b000] flex items-center justify-center font-bold text-xl mx-auto mb-2 shadow-sm">
                  {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                </div>
                <h3 className="font-bold text-sm text-slate-900">{currentUser.email}</h3>
                <p className="text-xs text-emerald-700 font-medium mt-0.5">Conta Conectada & Sincronizada</p>
                <span className="text-[10px] font-mono text-slate-400 block mt-1">UID: {currentUser.uid}</span>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-red-50 text-red-600 hover:text-red-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Desconectar desta conta</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              
              {/* Status do login atual (Anônimo/Local) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Sessão Atual</span>
                  <span className="text-[11px] text-slate-500">
                    {currentUser?.isAnonymous ? 'Login Anônimo Ativo' : 'Armazenamento Local'}
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border text-slate-600">
                  {currentUser?.uid?.substring(0, 10) || localUserId.substring(0, 10)}...
                </span>
              </div>

              {/* Mensagem de Erro */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Abas Login / Cadastro */}
              <div className="flex border border-slate-200 rounded-xl p-1 bg-slate-100">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    mode === 'login' ? 'bg-white text-[#0f381e] shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    mode === 'signup' ? 'bg-white text-[#0f381e] shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Criar Conta
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#0f381e] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#0f381e] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#0f381e] hover:bg-[#1b5e20] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {mode === 'login' ? <LogIn className="w-4 h-4 text-[#f5b000]" /> : <UserPlus className="w-4 h-4 text-[#f5b000]" />}
                <span>{loading ? 'Carregando...' : mode === 'login' ? 'Entrar com E-mail' : 'Criar Nova Conta'}</span>
              </button>

              <p className="text-[11px] text-slate-400 text-center mt-2">
                Ao criar uma conta, seus orçamentos salvos ficam protegidos no Firebase Cloud.
              </p>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
