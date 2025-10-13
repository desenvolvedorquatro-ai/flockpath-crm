import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('[CLEANUP-AUTH-USERS] Iniciando limpeza de usuários órfãos')

    // Buscar todos os usuários do auth
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('[CLEANUP-AUTH-USERS] Erro ao listar usuários:', listError)
      throw listError
    }

    console.log(`[CLEANUP-AUTH-USERS] Total de usuários encontrados: ${authUsers.users.length}`)

    let deletedCount = 0
    const adminEmail = 'admin@sistema.com'

    // Deletar todos os usuários exceto o admin
    for (const user of authUsers.users) {
      if (user.email !== adminEmail) {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
        
        if (deleteError) {
          console.error(`[CLEANUP-AUTH-USERS] Erro ao deletar usuário ${user.email}:`, deleteError)
        } else {
          console.log(`[CLEANUP-AUTH-USERS] Usuário deletado: ${user.email}`)
          deletedCount++
        }
      }
    }

    console.log(`[CLEANUP-AUTH-USERS] Limpeza concluída. ${deletedCount} usuários deletados`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${deletedCount} usuários deletados com sucesso`,
        deleted_count: deletedCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('[CLEANUP-AUTH-USERS] Erro geral:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
