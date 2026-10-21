
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Camera, Edit2, Check, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Dela_Gothic_One } from "next/font/google";
import Image from "next/image";
import PrivacyTermsModal from "@/components/PrivacyTermsModal";

const delaGothicOne = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin"],
});

const supabase = createClient();

export default function ProfileAndSettings() {
  const {
    role,
    studentProfile,
    refreshUserData,
    updateAvatar,
  } = useUserProfile();

  const isStudent = role === "student";

  const [legalOpen, setLegalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsSaving, setTermsSaving] = useState(false);
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

  useEffect(() => {
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

  useEffect(() => {
  if (!studentProfile) return;
  supabase
    .from("profiles")
    .select("terms_accepted_at")
    .eq("id", studentProfile.id)
    .single()
    .then(({ data }) => setTermsAccepted(!!data?.terms_accepted_at));
}, [studentProfile?.id]);

const handleTermsToggle = async (checked: boolean) => {
  if (!studentProfile || termsSaving) return;

  setTermsAccepted(checked); // update the box right away
  setTermsSaving(true);

  const { error } = await supabase
    .from("profiles")
    .update({ terms_accepted_at: checked ? new Date().toISOString() : null })
    .eq("id", studentProfile.id);

  if (error) {
    console.error(error.message);
    setTermsAccepted(!checked); // put it back if saving failed
    alert("Failed to save your choice. Please try again.");
  }
  setTermsSaving(false);
};

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file || !studentProfile) return;

    // Allow image files only.
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      e.target.value = "";
      return;
    }

    // Prevent excessively large uploads.
    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5 MB.");
      e.target.value = "";
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase();

      if (!fileExt) {
        alert("Could not determine the image file type.");
        return;
      }

      const filePath = `${studentProfile.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        console.error("Avatar upload error:", uploadError);
        alert(`Failed to upload image: ${uploadError.message}`);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const newAvatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: newAvatarUrl })
        .eq("id", studentProfile.id);

      if (updateError) {
        console.error("Avatar profile update error:", updateError);
        alert(
          `Image uploaded, but the profile could not be updated: ${updateError.message}`
        );
        return;
      }

      updateAvatar(newAvatarUrl);
      alert("Profile picture updated successfully.");
    } catch (error) {
      console.error("Unexpected avatar error:", error);
      alert("An unexpected error occurred while uploading your image.");
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!studentProfile || isSaving) return;

    // Validate everything before updating the database.
    const fullName = formData.full_name.trim();
    const newEmail = formData.email.trim().toLowerCase();
    const currentEmail = studentProfile.email.trim().toLowerCase();

    if (!fullName) {
      alert("Full name cannot be empty.");
      return;
    }

    if (!newEmail) {
      alert("Email address cannot be empty.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(newEmail)) {
      alert("Please enter a valid email address.");
      return;
    }

    let parsedAge: number | null = null;

    if (isStudent && formData.age.trim() !== "") {
      parsedAge = Number(formData.age);

      if (
        !Number.isInteger(parsedAge) ||
        parsedAge < 1 ||
        parsedAge > 120
      ) {
        alert("Please enter a valid age between 1 and 120.");
        return;
      }
    }

    setIsSaving(true);

    // These changes can succeed independently, so report partial failures clearly.
    let profileSaved = false;
    let studentInfoSaved = !isStudent;

    try {
      // 1. Save the name to profiles.
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", studentProfile.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        alert(`Failed to save your name: ${profileError.message}`);
        return;
      }

      profileSaved = true;

      // 2. Save student fields allowed by the current SQL grants.
      if (isStudent) {
        const { error: studentError } = await supabase
          .from("student_profiles")
          .update({
            gender: formData.gender.trim() || null,
            age: parsedAge,
            phone: formData.phone.trim() || null,
            program: formData.program.trim() || null,
            year_section: formData.year_section.trim() || null,
            })
          .eq("id", studentProfile.id);

        if (studentError) {
          console.error("Student update error:", studentError);
          alert(
            `Your name was saved, but student information could not be saved: ${studentError.message}`
          );
          return;
        }

        studentInfoSaved = true;
      }

      // 3. Request email changes through Supabase Auth.
      // Do not update profiles.email directly from the browser.
      if (newEmail !== currentEmail) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: newEmail,
        });

        if (emailError) {
          console.error("Email update error:", emailError);

          alert(
            `Your name and allowed student information were saved, but the email change failed: ${emailError.message}`
          );

          await refreshUserData();
          return;
        }

        // Supabase may require confirmation before the new email becomes active.
        await refreshUserData();

        alert(
          "Your other profile changes were saved. The email change was requested. Please check your email for Supabase's confirmation instructions. Your displayed email may remain unchanged until confirmation."
        );

        // Keep editing open so the user can review the email state.
        return;
      }

      // 4. Refresh the context so the UI shows saved database values.
      await refreshUserData();

      if (profileSaved && studentInfoSaved) {
        setIsEditing(false);
        alert("Profile saved successfully.");
      }
    } catch (error) {
      console.error("Unexpected profile save error:", error);

      alert(
        "An unexpected error occurred while saving your profile. Please refresh your profile and check which changes were saved."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const newPassword = prompt(
      "Enter your new password (min 12 characters):"
    );

    if (!newPassword) return;

    if (newPassword.length < 12) {
      alert("Password must be at least 12 characters.");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        alert(`Failed to update password: ${error.message}`);
      } else {
        alert("Password updated successfully.");
      }
    } catch (error) {
      console.error("Password update error:", error);
      alert("An unexpected error occurred while updating your password.");
    }
  };

  const handleCancel = () => {
    if (isSaving) return;

    setIsEditing(false);
  };

  if (!studentProfile) {
    return (
      <div className="flex-1 h-full min-h-screen bg-[#feeaee] p-8 flex items-center justify-center">
        <p className="text-[#5a4a75]">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 h-full min-h-screen p-8 overflow-y-auto">
      <div
        aria-hidden="true"
        className="pointer-events-none sticky top-0 z-0 h-0"
      >
        <div className="absolute left-0 top-0 flex h-screen w-full items-center justify-center overflow-hidden bg-[#ffd9e8]">
          <img
            src="/mns-logo.png"
            alt=""
            className="h-[90vh] w-auto max-w-none select-none opacity-25"
          />
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 text-[#39265f]">
          <Image
            src="/icons/settings-icon.png"
            alt="Settings"
            width={45}
            height={45}
            className="h-13 w-13 object-contain sm:h-14 sm:w-14"
          />

          <h1 className={`${delaGothicOne.className} text-5xl tracking-wide`}>
            Profile and Settings
          </h1>
        </div>

        <div className="flex items-center justify-center my-6 opacity-60">
          <div className="h-[2px] bg-[#39265f] flex-1 rounded-full" />
          <div className="mx-4 text-[#39265f] flex gap-1">
            <span className="w-2 h-2 rounded-full bg-[#39265f]" />
            <span className="w-4 h-2 rounded-full bg-[#39265f]" />
            <span className="w-2 h-2 rounded-full bg-[#39265f]" />
          </div>
          <div className="h-[2px] bg-[#39265f] flex-1 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
          {/* Left Column: Profile Card */}
          <div className="md:col-span-4 bg-[linear-gradient(135deg,#8B5E80_0%,#C896BC_14%,#EBC6E2_32%,#F6DAEF_50%,#FBE6F5_58%,#E2B5D6_76%,#A67396_100%)] border-[4px] border-[#c48ab2] rounded-xl p-6 flex flex-col items-center shadow-sm relative">
            <div className="relative mb-6 mt-4">
              <div className="w-40 h-40 rounded-full border-[5px] border-[#895177] overflow-hidden bg-white shadow-inner">
                <img
                  src={
                    studentProfile.avatar_url ||
                    "https://i.pravatar.cc/300?img=47"
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>

              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                aria-label="Change profile picture"
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

              {isUploadingAvatar && (
                <p className="text-center text-sm text-[#39265f] mt-2">
                  Uploading...
                </p>
              )}
            </div>

            <div className="text-center w-full">
              <h2
                className="text-xl font-bold text-[#39265f] uppercase tracking-wide mb-2"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {studentProfile.full_name || "Unnamed User"}
              </h2>

              {isStudent &&
              studentProfile.program &&
              studentProfile.year_section ? (
                <p
                  className="text-[#6d5b7a] font-medium"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {studentProfile.program} - {studentProfile.year_section}
                </p>
              ) : (
                !isStudent && (
                  <p
                    className="text-[#6d5b7a] font-medium uppercase tracking-wide"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {role}
                  </p>
                )
              )}
            </div>
          </div>

          {/* Right Column: Personal Information */}
          <div className="md:col-span-8 bg-[#dfb5d1]/80 border-[4px] border-[#dfb5d1] rounded-xl p-8 pt-10 relative shadow-sm flex flex-col justify-between">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#c48ab2] text-white px-8 py-2 rounded-xl shadow-sm border border-[#c48ab2]">
              <h3
                className="font-semibold text-xl tracking-wide"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Personal Information
              </h3>
            </div>

            <div className="border border-[#cbaebd] rounded-md overflow-hidden bg-white/40 flex-1 flex flex-col shadow-inner">
              {/* Full Name */}
              <div className="flex border-b border-[#cbaebd]">
                <div className="flex-1 p-2 px-3 border-r border-[#cbaebd]">
                  <p className="text-xs font-bold text-[#39265f]">Full Name</p>

                  {isEditing ? (
                    <input
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          full_name: e.target.value,
                        })
                      }
                      className="text-[#7c6a8f] text-[15px] bg-white/60 rounded px-1 w-full"
                    />
                  ) : (
                    <p
                      className="text-[#7c6a8f] text-[15px]"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {studentProfile.full_name || "—"}
                    </p>
                  )}
                </div>

                {isStudent && (
                  <>
                    <div className="w-24 p-2 px-3 border-r border-[#cbaebd]">
                      <p className="text-xs font-bold text-[#39265f]">
                        Gender
                      </p>

                      {isEditing ? (
                        <input
                          value={formData.gender}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              gender: e.target.value,
                            })
                          }
                          className="text-[#7c6a8f] text-[15px] bg-white/60 rounded px-1 w-full"
                        />
                      ) : (
                        <p
                          className="text-[#7c6a8f] text-[15px]"
                          style={{ fontFamily: "Georgia, serif" }}
                        >
                          {studentProfile.gender ?? "—"}
                        </p>
                      )}
                    </div>

                    <div className="w-20 p-2 px-3">
                      <p className="text-xs font-bold text-[#39265f]">Age</p>

                      {isEditing ? (
                        <input
                          type="number"
                          min={1}
                          max={120}
                          step={1}
                          value={formData.age}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              age: e.target.value,
                            })
                          }
                          className="text-[#7c6a8f] text-[15px] bg-white/60 rounded px-1 w-full"
                        />
                      ) : (
                        <p
                          className="text-[#7c6a8f] text-[15px]"
                          style={{ fontFamily: "Georgia, serif" }}
                        >
                          {studentProfile.age ?? "—"}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Role for admin/superadmin */}
              {!isStudent && (
                <div className="p-2 px-3 border-b border-[#cbaebd]">
                  <p className="text-xs font-bold text-[#39265f]">Role</p>
                  <p
                    className="text-[#7c6a8f] text-[15px] capitalize"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {role}
                  </p>
                </div>
              )}

              {/* Student Number */}
              {isStudent && studentProfile.student_number && (
                <div className="p-2 px-3 border-b border-[#cbaebd]">
                  <p className="text-xs font-bold text-[#39265f]">
                    Student Number
                  </p>
                  <p
                    className="text-[#7c6a8f] text-[15px]"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {studentProfile.student_number}
                  </p>
                </div>
              )}

              {/* Program and Year/Section: display-only until permissions are configured */}
                            {isStudent && (
                  <div className="p-2 px-3 border-b border-[#cbaebd]">
                    <p className="text-xs font-bold text-[#39265f]">
                      Program/Year/Section
                    </p>

                    {isEditing ? (
                      <div className="flex gap-2">
                        <input
                          value={formData.program}
                          onChange={(e) =>
                            setFormData({ ...formData, program: e.target.value })
                          }
                          placeholder="Program"
                          className="text-[#7c6a8f] text-[15px] bg-white/60 rounded px-1 flex-1 min-w-0"
                        />

                        <input
                          value={formData.year_section}
                          onChange={(e) =>
                            setFormData({ ...formData, year_section: e.target.value })
                          }
                          placeholder="Year/Section"
                          className="text-[#7c6a8f] text-[15px] bg-white/60 rounded px-1 w-28"
                        />
                      </div>
                    ) : (
                      <p
                        className="text-[#7c6a8f] text-[15px]"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {studentProfile.program || "—"} - {studentProfile.year_section || "—"}
                      </p>
                    )}
                  </div>
                )}

              {/* Email */}
              <div className="p-2 px-3 border-b border-[#cbaebd]">
                <p className="text-xs font-bold text-[#39265f]">
                  Email Address
                </p>

                {isEditing ? (
                  <input
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                    className="text-[#7c6a8f] text-[15px] bg-white/60 rounded px-1 w-full"
                  />
                ) : (
                  <p
                    className="text-[#7c6a8f] text-[15px]"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {studentProfile.email || "—"}
                  </p>
                )}
              </div>

                          {isStudent && (
              <div className="p-2 px-3">
                <p className="text-xs font-bold text-[#39265f]">
                  Phone Number
                </p>

                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Enter phone number"
                    className="text-[#7c6a8f] text-[15px] bg-white/60 rounded px-1 w-full"
                  />
                ) : (
                  <p
                    className="text-[#7c6a8f] text-[15px]"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {studentProfile.phone || "—"}
                  </p>
                )}
              </div>
            )}
            </div>

            {isEditing ? (
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-[#67d953] hover:brightness-105 text-[#1f3b16] py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-60"
                >
                  <Check size={16} />
                  {isSaving ? "Saving..." : "Save"}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1 bg-[#d3bbcc] hover:brightness-95 text-[#39265f] py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-60"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="mt-4 w-full bg-[#c48ab2] hover:bg-[#956084] text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                Edit Profile <Edit2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-[#dfb5d1]/80 border-[4px] border-[#dfb5d1] rounded-xl p-8 pt-10 relative shadow-sm">
          <div className="absolute -top-5 left-6 bg-[#c48ab2] text-white px-20 py-2 rounded-xl shadow-sm border border-[#c48ab2]">
            <h3
              className="font-semibold text-xl tracking-wide"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Account
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            <button
              type="button"
              onClick={handleChangePassword}
              className="w-full h-[60px] rounded-lg font-semibold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95 bg-[linear-gradient(105deg,#B97CA5_0%,#A5779F_35%,#8E7FBA_68%,#5E4A6F_100%)]"
            >
              Change Password
            </button>

            <button
              type="button"
              onClick={() => setLegalOpen(true)}
              className="w-full h-[60px] rounded-lg font-semibold text-white shadow-md transition-all hover:scale-[1.02] active:scale-95 bg-[linear-gradient(105deg,#B97CA5_0%,#A5779F_35%,#8E7FBA_68%,#5E4A6F_100%)]"
            >
              Privacy Policy &amp; Terms
            </button>

            <PrivacyTermsModal
              open={legalOpen}
              onClose={() => setLegalOpen(false)}
            />

          <label className="md:col-span-2 flex items-center gap-3 cursor-pointer select-none text-[#39265f]">
            <input
              type="checkbox"
              checked={termsAccepted}
              disabled={termsSaving}
              onChange={(e) => handleTermsToggle(e.target.checked)}
              className="h-5 w-5 cursor-pointer accent-[#8E4F7F] disabled:opacity-50"
            />
            <span className="text-sm font-semibold" style={{ fontFamily: "Georgia, serif" }}>
              I have read and agree to the Privacy Policy &amp; Terms
            </span>
          </label>
          </div>
        </div>
      </div>
    </div>
  );
}
