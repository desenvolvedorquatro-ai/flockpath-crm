import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string
  password: string
  full_name: string
  phone: string
  cpf: string
  church_id: string
  region_id?: string
  area_id?: string
  additional_churches?: string[]
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

    const requestData: CreateUserRequest = await req.json()
    console.log('[CREATE-USER] Criando usuário:', requestData.email)

    // Criar usuário usando admin API (não faz login automático)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: requestData.email,
      password: requestData.password,
      email_confirm: true, // Auto-confirmar email
    })

    if (authError) {
      console.error('[CREATE-USER] Erro ao criar usuário no Auth:', authError)
      throw authError
    }

    if (!authData.user) {
      throw new Error('Usuário não foi criado')
    }

    console.log('[CREATE-USER] Usuário criado no Auth:', authData.user.id)

    // Inserir/Atualizar perfil (upsert)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        full_name: requestData.full_name,
        phone: requestData.phone || null,
        cpf: requestData.cpf || null, // null se vazio para evitar constraint violation
        church_id: requestData.church_id,
        region_id: requestData.region_id || null,
        area_id: requestData.area_id || null,
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('[CREATE-USER] Erro ao atualizar perfil:', profileError)
      throw profileError
    }

    console.log('[CREATE-USER] Perfil atualizado com sucesso')

    // Adicionar igrejas adicionais se fornecidas
    if (requestData.additional_churches && requestData.additional_churches.length > 0) {
      const churchesToInsert = requestData.additional_churches.map(churchId => ({
        user_id: authData.user.id,
        church_id: churchId,
      }))

      const { error: churchesError } = await supabaseAdmin
        .from('user_churches')
        .insert(churchesToInsert)

      if (churchesError) {
        console.error('[CREATE-USER] Erro ao inserir igrejas adicionais:', churchesError)
        throw churchesError
      }

      console.log('[CREATE-USER] Igrejas adicionais inseridas:', churchesToInsert.length)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: authData.user.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('[CREATE-USER] Erro geral:', error)
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
