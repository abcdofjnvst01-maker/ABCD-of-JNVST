"use client";

import { useState } from "react";
import { updateGuardianProfileAction } from "@/features/guardians/actions";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { INDIAN_STATES_AND_UTS } from "@/lib/constants";
import type { GuardianProfileRecord } from "@/server/db/types";
import { UserCheck, Edit3, Save, X } from "lucide-react";

interface GuardianProfileCardProps {
  profile: GuardianProfileRecord;
}

export function GuardianProfileCard({ profile }: GuardianProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await updateGuardianProfileAction(formData);

    if (!result.success) {
      setError(result.error || "Failed to update profile.");
    } else {
      setSuccess(true);
      setIsEditing(false);
    }
    setIsLoading(false);
  };

  const stateOptions = INDIAN_STATES_AND_UTS.map((s) => ({ value: s, label: s }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-teal-800" />
            Guardian Account Details
          </CardTitle>
          <CardDescription>
            Official parent/guardian details linked to registered students.
          </CardDescription>
        </div>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-1.5"
          >
            <Edit3 className="h-3.5 w-3.5 text-slate-600" /> Edit Details
          </Button>
        )}
      </CardHeader>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-4">
          Guardian profile updated successfully.
        </Alert>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Input
            label="Guardian Full Name"
            name="fullName"
            id="guardian_fullName"
            required
            defaultValue={profile.full_name}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Mobile Number"
              name="phoneNumber"
              id="guardian_phoneNumber"
              type="tel"
              defaultValue={profile.phone_number || ""}
              placeholder="10-digit mobile"
            />

            <Select
              label="State / UT"
              name="state"
              id="guardian_state"
              required
              defaultValue={profile.state || "Rajasthan"}
              options={stateOptions}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              <X className="mr-1 h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
              <Save className="mr-1 h-4 w-4" /> Save Profile
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 gap-4 pt-2 text-sm sm:grid-cols-3">
          <div>
            <span className="block text-xs font-semibold uppercase text-slate-500">
              Full Name
            </span>
            <span className="font-medium text-slate-900">{profile.full_name}</span>
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase text-slate-500">
              Login Email
            </span>
            <span className="font-medium text-slate-900">{profile.email}</span>
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase text-slate-500">
              Phone / State
            </span>
            <span className="font-medium text-slate-900">
              {profile.phone_number || "Not provided"} • {profile.state || "India"}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
