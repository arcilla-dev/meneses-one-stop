import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { isOffice } from "@/lib/adminHome"; 

export async function POST(req: Request) {

  // Grab cookies first, then pass them into createClient
  const cookieStore = await cookies();
  const supabaseServer = createClient(cookieStore);

  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: callerProfile, error: callerProfileError } =
  await supabaseAdmin
    .from("profiles")
    .select("role")   
    .eq("id", user.id)
    .single();

if (callerProfileError) {
  console.error("Caller profile error:", callerProfileError);

  return NextResponse.json(
    { error: callerProfileError.message },
    { status: 500 }
  );    
}

  if (callerProfile?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden. Superadmin access only." }, { status: 403 });
  }
  
    const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const fullName = String(body?.fullName ?? "").trim();
  const office = body?.office;

  if (!email.includes("@") || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (!fullName) {
    return NextResponse.json({ error: "Enter the admin's full name." }, { status: 400 });
  }
  if (!isOffice(office)) {
    return NextResponse.json({ error: "Choose an office." }, { status: 400 });
  }

  const { data: newUser, error: createError } =
  await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (createError || !newUser.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Failed to create user." },
      { status: 400 }
    );
  }

   const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
    id: newUser.user.id,
    email,
    full_name: fullName,
    role: "admin",
    office,
  });

  if (profileError) {
    console.error("Profile insert error:", profileError);
    await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, userId: newUser.user.id });
}