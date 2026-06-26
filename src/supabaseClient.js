import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Cria e exporta a conexão com o banco
export const supabase = createClient(supabaseUrl, supabaseKey)