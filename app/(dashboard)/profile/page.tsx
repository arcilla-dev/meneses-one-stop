"use client";

import React, { useState, useRef } from "react";
import { Settings, Camera, Edit2, Check, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useUserProfile } from "@/contexts/UserProfileContext";

const supabase = createClient();

export default function ProfileAndSettings() {
  const { role, studentProfile, refreshUserData, updateAvatar } = useUserProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    gender: "",
    age: "",
    program: "",
    year_section: "",
    email: "",
    phone: "",
  });

  React.useEffect(() => {
    if (studentProfile && !isEditing) {
      setFormData({
        full_name: studentProfile.full_name ?? "",
        gender: studentProfile.gender ?? "",
        age: studentProfile.age?.toString() ?? "",
        program: studentProfile.program ?? "",
        year_section: studentProfile.year_section ?? "",
        email: studentProfile.email ?? "",
        phone: studentProfile.phone ?? "",
      });
    }
  }, [studentProfile, isEditing]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !studentProfile) return;

    setIsUploadingAvatar(true);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${studentProfile.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error(uploadError.message);
        alert("Failed to upload image.");
        return;
      }

      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const newAvatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: newAvatarUrl })
        .eq("id", studentProfile.id);

      if (updateError) {
        console.error(updateError.message);
        alert("Image uploaded, but failed to save to profile.");
        return;
      }

      updateAvatar(newAvatarUrl);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!studentProfile) return;
    setIsSaving(true);

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ email: formData.email })
        .eq("id", studentProfile.id);

      if (profileError) {
        alert("Failed to save profile info.");
        return;
      }

      if (role === "student") {
        const { error: studentError } = await supabase
          .from("student_profiles")
          .update({
            full_name: formData.full_name,
            gender: formData.gender,
            age: formData.age ? parseInt(formData.age, 10) : null,
            program: formData.program,
            year_section: formData.year_section,
            phone: formData.phone,
          })
          .eq("id", studentProfile.id);

        if (studentError) {
          alert("Failed to save student info.");
          return;
        }
      }

      await refreshUserData();
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const newPassword = prompt("Enter your new password (min 12 characters):");
    if (!newPassword) return;

    if (newPassword.length < 12) {
      alert("Password must be at least 12 characters.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      alert(error.message);
    } else {
      alert("Password updated successfully.");
    }
  };

  if (!studentProfile) {
    return (
      <div className="flex-1 h-full min-h-screen bg-[#feeaee] p-8 flex items-center justify-center">
        <p className="text-[#5a4a75]">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full min-h-screen bg-[#feeaee] p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 text-[#39265f]">
          <Settings size={48} strokeWidth={1.5} className="fill-[#39265f] text-white" />
          <h1 className="text-5xl font-semibold tracking-wide" style={{ fontFamily: "Georgia, serif" }}>
            Profile and Settings
          </h1>
        </div>

        <div className="flex items-center justify-center my-6 opacity-60">
          <div className="h-[2px] bg-[#39265f] flex-1 rounded-full"></div>
          <div className="mx-4 text-[#39265f] flex gap-1">
            <span className="w-2 h-2 rounded-full bg-[#39265f]"></span>
            <span className="w-4 h-2 rounded-full bg-[#39265f]"></span>
            <span className="w-2 h-2 rounded-full bg-[#39265f]"></span>
          </div>
          <div className="h-[2px] bg-[#39265f] flex-1 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
          {/* Left Column: Profile Card */}
          <div className="md:col-span-4 bg-[#f2e1ea]/80 border-[4px] border-[#e1ccdb] rounded-xl p-6 flex flex-col items-center shadow-sm relative">
            <div className="relative mb-6 mt-4">
              <div className="w-40 h-40 rounded-full border-[5px] border-[#39265f] overflow-hidden bg-white shadow-inner">
                <img
                  src={studentProfile.avatar_url || "https://i.pravatar.cc/300?img=47"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>

              <button
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="absolute bottom-1 right-1 bg-[#c195b6] p-2 rounded-full border-[3px] border-[#f2e1ea] hover:bg-[#a67b9a] transition-colors cursor-pointer shadow-md disabled:opacity-50"
              >
                <Camera size={18} className="text-white" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="text-center w-full">
              <h2
                className="text-xl font-bold text-[#39265f] uppercase tracking-wide mb-2"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {studentProfile.full_name}
              </h2>
              {studentProfile.program && studentProfile.year_section && (
                <p className="text-[#6d5b7a] font-medium" style={{ fontFamily: "Georgia, serif" }}>
                  {studentProfile.program} - {studentProfile.year_section}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Personal Information */}
          <div className="md:col-span-8 bg-[#f2e1ea]/80 border-[4px] border-[#e1ccdb] rounded-xl p-8 pt-10 relative shadow-sm flex flex-col justify-between">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#c195b6] text-white px-8 py-2 rounded-xl shadow-sm border border-[#b88cad]">
              <h3 className="font-semibold text-xl tracking-wide" style={{ fontFamily: "Georgia, serif" }}>
                Personal Information
              </h3>
            </div>

            <div className="border border-[#cbaebd] rounded-md overflow-hidden bg-white/40 flex-1 flex flex-col shadow-inner">
              <div className="flex border-b border-[#cbaebd]">
                <div className="flex-1 p-2 px-3 border-r border-[#cbaebd]">
                  <p className="text-xs font-bold text-[#39265f]">Full Name</p>
                  {isEditing ? (
                    <input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="text-[#7c6a8f] text-[15px] bg-white/60 rounded px-1 w-full"
                    />
                  ) : (
                    <p className="text-[#7c6a8f] text-[15px]" style={{ fontFamily: "Georgia, serif" }}>
                      {studentProfile.full_name}
                    </p>
                  )}
                </div>
                <div className="w-24 p-2 px-3 border-r border-[#cbaebd]">
                  <p className="text-xs font-bold text-[#39265f]">Gender</p>
                  {isEditing ? (
                    <input
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="text-[#7c6a8f] text-[15px] bg-white/60 rounded px-1 w-full"
                    />
                  ) : (
                    <p className="text-[#7c6a8f] text-[15px]" style={{ fontFamily: "Georgia, serif" }}>
                      {studentProfile.gender ?? "—"}
                    </p>
                  )}
                </div>
                <div className="w-20 p-2 px-3">
                  <p className="text-xs font-bold text-[#39265f]">Age</p>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="text-[#7c6a8f] text-[15px] bg-white/60 rounded px-1 w-full"
                    />
                  ) : (
                    <p className="text-[#7c6a8f] text-[15px]" style={{ fontFamily: "Georgia, serif" }}>
                      {studentProfile.age ?? "—"}
                    </p>
                  )}
                </div>
              </div>

              {studentProfile.student_number && (
                <div className="p-2 px-3 border-b border-[#cbaebd]">
                  <p className="text-xs font-bold text-[#39265f]">Student Number</p>
                  <p className="text-[#7c6a8f] text-[15px]" style={{ fontFamily: "Georgia, serif" }}>
                    {studentProfile.student_number}
                  </p>
                </div>
              )}

              <div className="p-2 px-3 border-b border-[#cbaebd]">
                <p className="text-xs font-bold text-[#39265f]">Program/Year/Section</p>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      value={formData.program}
                      onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                      className="text-[#7c6a8f] text-[15px] bg-white/60 rounded px-1 flex-1"
                    />
                    <input
                      value={formData.year_section}
                      onChange={(e) => setFormData({ ...formData, year_section: e.target.value })}
                      className="text-[#7c6a8f] text-[15px] bg-white/60 rounded px-1 w-20"
                    />
                  </div>
                ) : (
                  <p className="text-[#7c6a8f] text-[15px]" style={{ fontFamily: "Georgia, serif" }}>
                    {studentProfile.program} - {studentProfile.year_section}
                  </p>
                )}
              </div>

              <div className="p-2 px-3 border-b border-[#cbaebd]">
                <p className="text-xs font-bold text-[#39265f]">Email Address</p>
                {isEditing ? (
                  <input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="text-[#7c6a8f] text-[15px] bg-white/60 rounded px-1 w-full"
                  />
                ) : (
                  <p className="text-[#7c6a8f] text-[15px]" style={{ fontFamily: "Georgia, serif" }}>
                    {studentProfile.email}
                  </p>
                )}
              </div>

              <div className="p-2 px-3">
                <p className="text-xs font-bold text-[#39265f]">Phone Number</p>
                {isEditing ? (
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="text-[#7c6a8f] text-[15px] bg-white/60 rounded px-1 w-full"
                  />
                ) : (
                  <p className="text-[#7c6a8f] text-[15px]" style={{ fontFamily: "Georgia, serif" }}>
                    {studentProfile.phone ?? "—"}
                  </p>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-[#67d953] hover:brightness-105 text-[#1f3b16] py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-60"
                >
                  <Check size={16} /> {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="flex-1 bg-[#d3bbcc] hover:brightness-95 text-[#39265f] py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <X size={16} /> Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 w-full bg-[#c195b6] hover:bg-[#b084a5] text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                Edit Profile <Edit2 size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="bg-[#f2e1ea]/80 border-[4px] border-[#e1ccdb] rounded-xl p-8 pt-10 relative shadow-sm">
          <div className="absolute -top-5 left-6 bg-[#c195b6] text-white px-8 py-2 rounded-xl shadow-sm border border-[#b88cad]">
            <h3 className="font-semibold text-xl tracking-wide" style={{ fontFamily: "Georgia, serif" }}>
              Account
            </h3>
          </div>

          <div className="flex flex-col md:flex-row gap-6 mt-2">
            <div className="flex-1 flex flex-col justify-end">
              <button
                onClick={handleChangePassword}
                className="w-full h-[60px] rounded-lg font-semibold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95 bg-gradient-to-b from-[#94819d] to-[#6d5b7a]"
              >
                Change Password
              </button>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <button
                onClick={() => alert("Email settings — build this out when ready.")}
                className="w-full h-[60px] rounded-lg font-semibold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95 bg-gradient-to-b from-[#94819d] to-[#6d5b7a]"
              >
                Email Settings
              </button>
              <button
                onClick={() => alert("Privacy settings — build this out when ready.")}
                className="w-full h-[60px] rounded-lg font-semibold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95 bg-gradient-to-b from-[#94819d] to-[#6d5b7a]"
              >
                Privacy
              </button>
            </div>

            <div className="flex-1 flex">
              <button
                onClick={() => alert("Login security — build this out when ready.")}
                className="w-full h-full min-h-[136px] rounded-lg font-semibold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95 bg-gradient-to-b from-[#94819d] to-[#6d5b7a]"
              >
                Login Security
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}