"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Y2kButton, buttonClasses } from "@/components/y2k";
import { ConfirmDialog, SaveButton, useToast } from "@/components/y2k-dialog";
import { FormActions, FormErrorAlert } from "@/components/admin/form-controls";
import { API_URL, useToken } from "@/components/admin/use-catalog";
import { ApiError, type AdminInput } from "@/lib/api-client";
import { fieldText, parseFieldIssues } from "@/lib/admin-helpers";
import { useState } from "react";

const DELETE_COPY =
  "If learners have progress, Results or XP on this content it will be archived and hidden from learners; otherwise it is deleted.";

/**
 * Drives every New/Edit admin form: field state, required-field validation,
 * the create-or-update call, API error triage into `fieldErrors` + `formError`,
 * success toast + redirect, and the Edit page's danger DELETE row.
 *
 * `fields` is a render callback so each resource keeps its own layout while
 * sharing all the plumbing. It receives live error keys and a value setter.
 */
export function ResourceForm({
  resource,
  mode,
  initialValues,
  requiredKeys,
  toInput,
  hub,
  renderFields,
  deleteItem,
  itemName,
  cascadeWarning,
}: Readonly<{
  /** Human label, e.g. "Region". */
  resource: string;
  mode: "create" | "edit";
  initialValues: Record<string, unknown>;
  /** Field keys that must be non-empty before the request is sent. */
  requiredKeys: readonly string[];
  /** Builds the request body from the current field values. */
  toInput: (values: Record<string, unknown>) => AdminInput;
  /** The resource's hub path, e.g. `/admin/regions`. */
  hub: string;
  renderFields: (ctx: Readonly<{ values: Record<string, unknown>; set: (key: string, value: unknown) => void; errors: Record<string, string> }>) => ReactNode;
  deleteItem?: (apiUrl: string, token: string, id: number) => Promise<void>;
  /** Row name used in the delete confirm and toast; defaults to `resource`. */
  itemName?: string;
  cascadeWarning?: string;
}>) {
  const router = useRouter();
  const toast = useToast();
  const token = useToken();
  const name = itemName ?? resource;
  const [values, setValues] = useState(initialValues);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const set = (key: string, value: unknown) => setValues((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setFormError(null);
    const localErrors: Record<string, string> = {};
    for (const key of requiredKeys) {
      const value = values[key];
      // `0` is never a valid id, so a required select left on its placeholder fails.
      if (value === 0 || fieldText(value).trim().length === 0) localErrors[key] = "This field is required.";
    }
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      return;
    }

    if (!token) return;
    setBusy(true);
    setFieldErrors({});
    try {
      const input = toInput(values);
      if (mode === "create") {
        await createFor(resource, API_URL, token, input);
      } else {
        await updateFor(resource, API_URL, token, Number(initialValues.id), input);
      }
      toast.push(mode === "create" ? `${resource} created.` : `${resource} saved.`);
      router.push(hub);
      router.refresh();
    } catch (cause) {
      handleApiError(cause, setFieldErrors, setFormError);
    } finally {
      setBusy(false);
    }
  };

  const runDelete = async () => {
    if (!deleteItem || !token) return;
    setDeleting(true);
    try {
      await deleteItem(API_URL, token, Number(initialValues.id));
      toast.push(`${name} deleted.`);
      router.push(hub);
      router.refresh();
    } catch (cause) {
      toast.push(cause instanceof ApiError ? cause.message : "Could not delete. Try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      {formError && <FormErrorAlert message={formError} />}

      {renderFields({ values, set, errors: fieldErrors })}

      <FormActions>
        <Link href={hub} className={buttonClasses("secondary")}>
          CANCEL
        </Link>
        <SaveButton type="submit" busy={busy}>{mode === "create" ? `CREATE ${resource.toUpperCase()}` : "SAVE"}</SaveButton>
      </FormActions>

      {mode === "edit" && deleteItem && (
        <div className="mt-2 flex flex-col gap-2 border-t-2 border-border pt-4">
          {cascadeWarning && (
            <p className="flex items-center gap-2 font-body text-xs font-bold text-muted-foreground">
              <AlertTriangle aria-hidden="true" className="size-3" />
              {cascadeWarning}
            </p>
          )}
          <Y2kButton type="button" variant="danger" onClick={() => setConfirmingDelete(true)} className="self-start">
            <Trash2 aria-hidden="true" className="size-3" /> DELETE {resource.toUpperCase()}
          </Y2kButton>
        </div>
      )}

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title="Delete"
        danger
        confirmLabel={deleting ? "DELETING…" : "DELETE"}
        cancelLabel="CANCEL"
        onConfirm={() => void runDelete()}
        message={
          <>
            <p>{`Delete ${name}? This cannot be undone.`}</p>
            {cascadeWarning && <p className="mt-2">{cascadeWarning}</p>}
            <p className="mt-2 text-sm text-muted-foreground">{DELETE_COPY}</p>
          </>
        }
      />
    </form>
  );
}

function handleApiError(
  cause: unknown,
  setFieldErrors: (errors: Record<string, string>) => void,
  setFormError: (message: string | null) => void,
) {
  if (cause instanceof ApiError) {
    const { fields, alert } = parseFieldIssues(cause.message);
    setFieldErrors(fields);
    setFormError(alert ?? (Object.keys(fields).length === 0 ? cause.message : null));
    return;
  }
  setFormError("Something went wrong. Try again.");
}

/* The create/update shims: the six resources share one request shape, so the
   resource string selects the client function without a switch per page. */
import {
  createAdminBadge,
  createAdminCharacter,
  createAdminQuest,
  createAdminRegion,
  createAdminStage,
  createAdminZone,
  updateAdminBadge,
  updateAdminCharacter,
  updateAdminQuest,
  updateAdminRegion,
  updateAdminStage,
  updateAdminZone,
} from "@/lib/api-client";

type AdminWriter = (apiUrl: string, token: string, input: AdminInput) => Promise<unknown>;
type AdminUpdater = (apiUrl: string, token: string, id: number, input: AdminInput) => Promise<unknown>;

const CREATE: Record<string, AdminWriter> = {
  Region: createAdminRegion,
  Zone: createAdminZone,
  Stage: createAdminStage,
  Quest: createAdminQuest,
  Badge: createAdminBadge,
  Character: createAdminCharacter,
};

const UPDATE: Record<string, AdminUpdater> = {
  Region: updateAdminRegion,
  Zone: updateAdminZone,
  Stage: updateAdminStage,
  Quest: updateAdminQuest,
  Badge: updateAdminBadge,
  Character: updateAdminCharacter,
};

function createFor(resource: string, apiUrl: string, token: string, input: AdminInput) {
  const writer = CREATE[resource];
  if (!writer) throw new Error(`Unknown admin resource: ${resource}`);
  return writer(apiUrl, token, input);
}

function updateFor(resource: string, apiUrl: string, token: string, id: number, input: AdminInput) {
  const updater = UPDATE[resource];
  if (!updater) throw new Error(`Unknown admin resource: ${resource}`);
  return updater(apiUrl, token, id, input);
}

