import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Cria o cliente real se as chaves existirem, ou fornece um cliente mock dummy resiliente
// para evitar crashar a aplicação com tela branca na ausência de chaves de ambiente (como no Vercel).
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signUp: async () => ({ data: null, error: new Error("Banco de dados não configurado no deploy.") }),
        signInWithPassword: async () => ({ data: null, error: new Error("Banco de dados não configurado no deploy.") }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({ eq: async () => ({ data: [], error: null }) }),
        insert: () => ({ select: async () => ({ data: null, error: new Error("Banco de dados não configurado no deploy.") }) }),
        update: () => ({ eq: async () => ({ error: new Error("Banco de dados não configurado no deploy.") }) }),
        delete: () => ({ eq: async () => ({ error: new Error("Banco de dados não configurado no deploy.") }) }),
      })
    };