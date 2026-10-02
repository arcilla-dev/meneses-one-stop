import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export async function POST(req: Request) {
  const { email, password, fullName } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  // Grab cookies first, then pass them into createClient
  const cookieStore = await cookies();
  const supabaseServer = createClient(cookieStore);

  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: callerProfile } = await supabaseServer
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (callerProfile?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden. Superadmin access only." }, { status: 403 });
  }

  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !newUser.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Failed to create user." },
      { status: 400 }
    );
  }

  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: newUser.user.id,
    email,
    role: "admin",
    full_name: fullName ?? null,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, userId: newUser.user.id });
}