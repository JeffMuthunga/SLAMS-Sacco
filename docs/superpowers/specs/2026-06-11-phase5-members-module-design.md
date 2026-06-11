# Phase 5: Members Module Design

**Date:** 2026-06-11
**Status:** Approved

---

## Goal

Build the Members CRUD module for the admin portal — the first end-to-end feature in SLAMS SACCO. Members are the root entity for loans, accounts, and contributions, so this module must be solid.

---

## Decisions Made

| Question | Decision |
|----------|----------|
| Member number generation | Auto-incremented by system (`MEM-{YYYY}-{NNNN}`) |
| Approval on create | Auto-submit: saving sets `approval_status = pending` |
| Next of kin | Inline on the create/edit form |
| Photo upload | Included in Phase 5 |
| Form structure | Full-page multi-section form (not a wizard) |

---

## Backend

### Endpoints

All routes under `/api/v1/members`, protected by `auth:sanctum`, scoped to `org_id` from the authenticated user's session.

| Method | Path | Action |
|--------|------|--------|
| `GET` | `/members` | Paginated list. Query params: `search` (name/number/id_number), `status` (approval_status), `per_page` (default 20) |
| `POST` | `/members` | Create member + kins in a DB transaction. Auto-assigns member number. Sets `approval_status = pending`. |
| `GET` | `/members/archived` | Paginated soft-deleted members. Must be registered before `{id}` route. |
| `GET` | `/members/{id}` | Member detail with kins eager-loaded. |
| `PUT` | `/members/{id}` | Update member fields + sync kins (delete removed, upsert remaining). |
| `DELETE` | `/members/{id}` | Soft delete (archive). |
| `POST` | `/members/{id}/restore` | Restore soft-deleted member. |
| `POST` | `/members/{id}/photo` | Multipart upload. Stores to `storage/app/public/member-photos/`. Updates `photo_path`. |
| `POST` | `/members/{id}/approve` | Sets `approval_status = approved`, `approved_by = auth()->id()`, `approved_at = now()`. |
| `POST` | `/members/{id}/reject` | Sets `approval_status = rejected`. Requires `reason` in body (stored to `approval_logs`). |

### Member Number Generation

Format: `MEM-{YYYY}-{NNNN}` where `YYYY` is current year and `NNNN` is zero-padded 4-digit sequence scoped per org per year.

```php
// MemberService::generateMemberNumber(string $orgId): string
$year = now()->year;
$prefix = "MEM-{$year}-";
$max = Member::withTrashed()
    ->where('org_id', $orgId)
    ->where('member_number', 'like', $prefix . '%')
    ->max('member_number');
$next = $max ? ((int) substr($max, -4)) + 1 : 1;
return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
```

This runs inside the create transaction so concurrent inserts on the same org use DB-level locking.

### File Structure

```
backend/app/
  Http/
    Controllers/Api/V1/MemberController.php
    Requests/Api/V1/Member/
      StoreMemberRequest.php
      UpdateMemberRequest.php
    Resources/V1/
      MemberResource.php
      MemberCollection.php
  Models/
    Member.php          (already exists)
    MemberKin.php       (already exists)
  Services/
    MemberService.php
tests/Feature/Api/V1/MemberTest.php
```

### Validation (StoreMemberRequest)

Required fields: `full_name`, `id_number`, `id_type`, `phone`, `date_of_birth`, `entry_date`.
Optional: all other personal/employment fields.
Kins: `kins` array, each item requires `full_name` and `relationship`. If `is_beneficiary = true`, `beneficiary_percent` must be present (0–100). Sum of `beneficiary_percent` across kins must not exceed 100.

### MemberResource shape

```json
{
  "id": "uuid",
  "member_number": "MEM-2026-0001",
  "full_name": "Jane Doe",
  "title": "Mrs",
  "id_number": "12345678",
  "id_type": "national",
  "email": "jane@example.com",
  "phone": "0700000000",
  "phone2": null,
  "date_of_birth": "1990-01-15",
  "gender": "F",
  "nationality": "KEN",
  "marital_status": "married",
  "address": "P.O. Box 123",
  "town": "Nairobi",
  "postal_code": "00100",
  "photo_url": "http://localhost:8000/storage/member-photos/uuid.jpg",
  "employed": true,
  "self_employed": false,
  "employer_name": "Acme Ltd",
  "monthly_salary": "50000.00",
  "monthly_net_income": "40000.00",
  "entry_date": "2026-01-01",
  "is_active": true,
  "approval_status": "pending",
  "approved_by": null,
  "approved_at": null,
  "terminated_at": null,
  "termination_reason": null,
  "org_id": "uuid",
  "kins": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "relationship": "spouse",
      "date_of_birth": "1988-05-20",
      "id_number": null,
      "id_type": null,
      "phone": "0711000000",
      "is_emergency_contact": true,
      "is_beneficiary": true,
      "beneficiary_percent": "50.00"
    }
  ],
  "created_at": "2026-06-11T10:00:00+00:00"
}
```

### MemberService responsibilities

- `generateMemberNumber(string $orgId): string`
- `store(array $validated, string $orgId): Member` — wraps create + kin create in `DB::transaction`
- `update(Member $member, array $validated): Member` — updates member, syncs kins (delete removed by ID, upsert remainder)
- `storePhoto(Member $member, UploadedFile $file): void` — deletes old file if exists, stores new one to `member-photos/`, updates `photo_path`
- `approve(Member $member, User $by): void`
- `reject(Member $member, string $reason, User $by): void` — also writes to `approval_logs`

---

## Frontend

### Routes

| Path | Page component | Description |
|------|---------------|-------------|
| `/admin/members` | `MembersPage` | Active members list |
| `/admin/members/create` | `CreateMemberPage` | Full create form |
| `/admin/members/[id]` | `MemberDetailPage` | Detail view + approve/reject/archive actions |
| `/admin/members/[id]/edit` | `EditMemberPage` | Pre-filled edit form |
| `/admin/members/archived` | `ArchivedMembersPage` | Archived members list |

### File Structure

```
frontend/src/
  app/admin/members/
    page.tsx                      (replace placeholder)
    create/page.tsx
    archived/page.tsx             (replace placeholder)
    [id]/
      page.tsx
      edit/page.tsx
  components/Members/
    MemberForm.tsx                (shared create/edit form — client component)
    MembersTable.tsx              (DataTable wrapper — client component)
    KinRow.tsx                    (single kin row in dynamic list)
    ApprovalStatusBadge.tsx       (reusable status badge)
  lib/
    api/members.ts                (React Query hooks + API calls for members)
```

### MembersTable columns

| Column | Source | Notes |
|--------|--------|-------|
| Member # | `member_number` | Sortable |
| Full Name | `full_name` | Searchable |
| Phone | `phone` | |
| Entry Date | `entry_date` | Formatted |
| Status | `approval_status` | `ApprovalStatusBadge` |
| Active | `is_active` | Badge |
| Actions | — | View / Edit / Archive buttons |

### MemberForm sections (single page, three cards)

**Personal Details card:**
- Title (SelectInput: Mr / Mrs / Miss / Dr / Prof / Rev)
- Full Name (text, required)
- ID Type (SelectInput: National ID / Passport / Alien Card / Military ID)
- ID Number (text, required)
- Email (email)
- Phone (text, required), Phone 2 (text)
- Date of Birth (DateInput, required)
- Gender (SelectInput: Male / Female)
- Nationality (text, default "KEN")
- Marital Status (SelectInput: Single / Married / Divorced / Widowed)
- Address (textarea), Town (text), Postal Code (text)
- Photo (file input, accepts image/*)

**Employment card:**
- Entry Date (DateInput, required)
- Employed (checkbox) — reveals: Employer Name, Monthly Salary (NumberInput), Monthly Net Income (NumberInput)
- Self Employed (checkbox)

**Next of Kin card:**
- "Add Kin" button appends a new `KinRow`
- Each `KinRow`: Full Name (required), Relationship (SelectInput), Date of Birth, Phone, Emergency Contact (checkbox), Beneficiary (checkbox → reveals Beneficiary %)
- Remove button per row

### ApprovalStatusBadge

```
draft    → gray   bg
pending  → yellow bg
approved → green  bg
rejected → red    bg
```

### MemberDetailPage layout

- Header: member number + full name + `ApprovalStatusBadge` + action buttons (Edit, Archive)
- Approve / Reject buttons shown only when `approval_status = pending`
- Two-column grid: personal details left, employment right
- Kins section below as a simple table
- Photo shown if `photo_url` is present

### API hooks (`lib/api/members.ts`)

```ts
useMembers(params)           // GET /members — paginated
useMember(id)                // GET /members/:id
useCreateMember()            // POST /members
useUpdateMember(id)          // PUT /members/:id
useDeleteMember()            // DELETE /members/:id
useRestoreMember()           // POST /members/:id/restore
useUploadMemberPhoto(id)     // POST /members/:id/photo
useApproveMember()           // POST /members/:id/approve
useRejectMember()            // POST /members/:id/reject
useArchivedMembers(params)   // GET /members/archived
```

All mutations invalidate `['members']` query on success. Errors surface via `extractFieldErrors` for 422s (inline form errors) and `extractApiError` for everything else (sonner toast).

---

## Data Flow: Create

1. User fills `MemberForm`, selects optional photo file
2. Submit → `useCreateMember()` → `POST /api/v1/members` with JSON body (photo excluded)
3. On success:
   - If photo file selected → `useUploadMemberPhoto()` → `POST /api/v1/members/{id}/photo`
   - Redirect to `/admin/members/{id}`
   - Sonner toast: "Member created — pending approval"
4. On 422 error → `extractFieldErrors` → inline errors on each field / kin row
5. On other error → sonner toast with message

## Data Flow: Approve/Reject

1. Admin views `/admin/members/{id}`, sees `pending` badge
2. Clicks "Approve" → confirm dialog → `POST /members/{id}/approve`
3. React Query invalidates `['members', id]` and `['members']` list
4. Page re-renders with `approved` badge; buttons disappear
5. Reject: same flow but prompts for a reason (textarea in modal)

---

## Testing (Backend)

`tests/Feature/Api/V1/MemberTest.php` covers:

- `test_create_member_with_kins` — POST creates member + 2 kins, returns 201 with correct shape
- `test_member_number_increments` — two creates yield MEM-2026-0001 and MEM-2026-0002
- `test_create_sets_pending_status` — `approval_status = pending` on create
- `test_update_syncs_kins` — PUT removes deleted kins, updates existing, adds new
- `test_approve_member` — POST approve sets status + approved_by + approved_at
- `test_reject_member` — POST reject sets status + writes approval_log
- `test_archive_and_restore` — DELETE soft-deletes; POST restore brings back
- `test_archived_list_excludes_active` — GET /archived only returns soft-deleted
- `test_photo_upload` — POST photo stores file, updates photo_path
- `test_org_scoping` — member from org A returns 404 for org B user
- `test_search_filter` — search by name, member number, id_number
- `test_status_filter` — filter by approval_status

---

## Out of Scope for Phase 5

- Member exit/termination workflow (Phase 15)
- SACCO officials management (deferred — small table, low priority)
- Member portal view of own profile (Phase 12)
- Bulk import from CSV
- SMS/email notification on approval (Phase 14)
