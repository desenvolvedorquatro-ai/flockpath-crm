import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Create admin user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@sistema.com',
      password: '123456',
      email_confirm: true,
      user_metadata: {
        full_name: 'Administrador do Sistema'
      }
    })

    if (userError) {
      console.error('Error creating user:', userError)
      return new Response(JSON.stringify({ error: userError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Insert into profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userData.user.id,
        email: 'admin@sistema.com',
        full_name: 'Administrador do Sistema'
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
    }

    // Add admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userData.user.id,
        role: 'admin'
      })

    if (roleError) {
      console.error('Error assigning role:', roleError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin user created successfully',
        userId: userData.user.id 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
