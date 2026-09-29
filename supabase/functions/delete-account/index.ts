import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return Response.json(
      { error: 'Method not allowed.' },
      { headers: corsHeaders, status: 405 }
    );
  }

  const authorization = request.headers.get('Authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const publishableKey =
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey =
    Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!authorization || !supabaseUrl || !publishableKey || !serviceRoleKey) {
    return Response.json(
      { error: 'Account deletion is not configured.' },
      { headers: corsHeaders, status: 500 }
    );
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const token = authorization.replace(/^Bearer\s+/i, '');
  const { data, error: userError } = await userClient.auth.getUser(token);

  if (userError || !data.user) {
    return Response.json(
      { error: 'A valid signed-in session is required.' },
      { headers: corsHeaders, status: 401 }
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(data.user.id);

  if (deleteError) {
    console.error('Unable to delete account', deleteError);
    return Response.json(
      { error: 'The account could not be deleted.' },
      { headers: corsHeaders, status: 500 }
    );
  }

  return Response.json({ deleted: true }, { headers: corsHeaders });
});
