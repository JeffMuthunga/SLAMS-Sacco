<?php

namespace App\Services;

use App\Jobs\SendEmailJob;
use App\Jobs\SendSmsJob;
use App\Models\Loan;
use App\Models\Member;
use App\Models\PettyCashRequest;
use App\Models\Issue;

class NotificationService
{
    private function dispatch(Member $member, string $subject, string $body, string $smsText): void
    {
        $email = $member->email ?? optional($member->user)->email;
        if ($email) {
            SendEmailJob::dispatch($email, $member->full_name, $subject, $this->htmlWrap($body));
        }
        if ($member->phone) {
            SendSmsJob::dispatch($member->phone, $smsText);
        }
    }

    private function htmlWrap(string $body): string
    {
        $appName = config('app.name', 'SLAMS SACCO');
        return <<<HTML
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#1a1a2e">{$appName}</h2>
            <div style="border-top:3px solid #5750f1;padding-top:16px">
                {$body}
            </div>
            <p style="color:#999;font-size:12px;margin-top:24px">
                This is an automated message from {$appName}. Please do not reply.
            </p>
        </div>
        HTML;
    }

    // ── Member notifications ───────────────────────────────────────────

    public function memberApproved(Member $member): void
    {
        $name = $member->full_name;
        $num  = $member->member_number;
        $body = "<p>Dear {$name},</p>
                 <p>Congratulations! Your membership application has been approved.</p>
                 <p>Your member number is: <strong>{$num}</strong></p>
                 <p>You can now access SACCO services through the member portal.</p>";

        $sms = "Dear {$name}, your membership application has been approved. Member No: {$num}. Welcome to " . config('app.name', 'SLAMS SACCO') . "!";

        $this->dispatch($member, 'Membership Approved', $body, $sms);
    }

    public function memberRejected(Member $member, string $reason): void
    {
        $name = $member->full_name;
        $body = "<p>Dear {$name},</p>
                 <p>We regret to inform you that your membership application has not been approved at this time.</p>
                 <p><strong>Reason:</strong> {$reason}</p>
                 <p>Please contact us for further assistance.</p>";

        $sms = "Dear {$name}, your membership application was not approved. Reason: {$reason}. Please contact us for more information.";

        $this->dispatch($member, 'Membership Application Update', $body, $sms);
    }

    // ── Loan notifications ─────────────────────────────────────────────

    public function loanApproved(Loan $loan): void
    {
        $member = $loan->member;
        if (!$member) return;

        $amount = number_format((float)$loan->principal_amount, 2);
        $ref    = $loan->account_number;
        $body   = "<p>Dear {$member->full_name},</p>
                   <p>Your loan application has been approved.</p>
                   <ul>
                     <li>Loan Reference: <strong>{$ref}</strong></li>
                     <li>Principal Amount: <strong>KES {$amount}</strong></li>
                   </ul>
                   <p>Disbursement will be processed shortly.</p>";

        $sms = "Dear {$member->full_name}, your loan (Ref: {$ref}) of KES {$amount} has been approved. Disbursement will follow shortly.";

        $this->dispatch($member, 'Loan Approved', $body, $sms);
    }

    public function loanRejected(Loan $loan, string $reason = ''): void
    {
        $member = $loan->member;
        if (!$member) return;

        $ref  = $loan->account_number;
        $body = "<p>Dear {$member->full_name},</p>
                 <p>Your loan application (Ref: {$ref}) has not been approved at this time.</p>"
               . ($reason ? "<p><strong>Reason:</strong> {$reason}</p>" : "")
               . "<p>Please contact us for further assistance.</p>";

        $sms = "Dear {$member->full_name}, your loan application (Ref: {$ref}) was not approved." . ($reason ? " Reason: {$reason}." : "");

        $this->dispatch($member, 'Loan Application Update', $body, $sms);
    }

    public function loanDisbursed(Loan $loan): void
    {
        $member = $loan->member;
        if (!$member) return;

        $amount  = number_format((float)$loan->principal_amount, 2);
        $ref     = $loan->account_number;
        $date    = $loan->disbursed_date
                        ? date('d M Y', strtotime($loan->disbursed_date))
                        : date('d M Y');
        $body    = "<p>Dear {$member->full_name},</p>
                    <p>Your loan has been disbursed.</p>
                    <ul>
                      <li>Loan Reference: <strong>{$ref}</strong></li>
                      <li>Amount Disbursed: <strong>KES {$amount}</strong></li>
                      <li>Disbursement Date: <strong>{$date}</strong></li>
                    </ul>
                    <p>Please log in to your member portal to view the repayment schedule.</p>";

        $sms = "Dear {$member->full_name}, KES {$amount} has been disbursed to your account (Ref: {$ref}) on {$date}.";

        $this->dispatch($member, 'Loan Disbursed', $body, $sms);
    }

    public function loanDefaulted(Loan $loan): void
    {
        $member = $loan->member;
        if (!$member) return;

        $balance = number_format((float)$loan->outstanding_balance, 2);
        $ref     = $loan->account_number;
        $body    = "<p>Dear {$member->full_name},</p>
                    <p>Your loan (Ref: {$ref}) has been flagged as <strong>defaulted</strong>.</p>
                    <p>Outstanding Balance: <strong>KES {$balance}</strong></p>
                    <p>Please contact us immediately to arrange repayment.</p>";

        $sms = "URGENT: Your loan (Ref: {$ref}) has been flagged as defaulted. Outstanding: KES {$balance}. Contact us immediately.";

        $this->dispatch($member, 'Loan Default Notice', $body, $sms);
    }

    // ── Petty cash notifications ───────────────────────────────────────

    public function pettyCashRequestApproved(PettyCashRequest $pcRequest): void
    {
        $alloc  = $pcRequest->allocation;
        if (!$alloc) return;
        $user   = $alloc->allocatedTo;
        if (!$user) return;

        $amount = number_format((float)$pcRequest->amount, 2);
        $item   = optional($pcRequest->item)->name ?? 'Petty Cash';
        $body   = "<p>Dear {$user->name},</p>
                   <p>Your petty cash request has been approved.</p>
                   <ul>
                     <li>Item: <strong>{$item}</strong></li>
                     <li>Amount: <strong>KES {$amount}</strong></li>
                   </ul>";

        $this->dispatchToUser($user->email, $user->name, $user->phone ?? '', 'Petty Cash Request Approved', $body,
            "Dear {$user->name}, your petty cash request for {$item} (KES {$amount}) has been approved.");
    }

    public function pettyCashRequestRejected(PettyCashRequest $pcRequest): void
    {
        $alloc = $pcRequest->allocation;
        if (!$alloc) return;
        $user  = $alloc->allocatedTo;
        if (!$user) return;

        $amount = number_format((float)$pcRequest->amount, 2);
        $item   = optional($pcRequest->item)->name ?? 'Petty Cash';
        $body   = "<p>Dear {$user->name},</p>
                   <p>Your petty cash request has been rejected.</p>
                   <ul>
                     <li>Item: <strong>{$item}</strong></li>
                     <li>Amount: <strong>KES {$amount}</strong></li>
                   </ul>
                   <p>Please contact your manager for more information.</p>";

        $this->dispatchToUser($user->email, $user->name, $user->phone ?? '', 'Petty Cash Request Rejected', $body,
            "Dear {$user->name}, your petty cash request for {$item} (KES {$amount}) was rejected.");
    }

    // ── Issue notifications ────────────────────────────────────────────

    public function issueCreated(Issue $issue): void
    {
        // Notify the assigned staff member (if any)
        $assignee = $issue->assignee;
        if (!$assignee || !$assignee->email) return;

        $ref     = $issue->reference_number;
        $title   = $issue->title;
        $member  = optional($issue->member)->full_name ?? 'Unknown';
        $body    = "<p>Dear {$assignee->name},</p>
                    <p>A new issue has been raised and assigned to you.</p>
                    <ul>
                      <li>Reference: <strong>{$ref}</strong></li>
                      <li>Title: <strong>{$title}</strong></li>
                      <li>Member: <strong>{$member}</strong></li>
                    </ul>
                    <p>Please log in to the admin portal to review and respond.</p>";

        SendEmailJob::dispatch($assignee->email, $assignee->name, "New Issue: {$ref}", $this->htmlWrap($body));
    }

    public function issueResolved(Issue $issue): void
    {
        $member = $issue->member;
        if (!$member) return;

        $ref   = $issue->reference_number;
        $title = $issue->title;
        $body  = "<p>Dear {$member->full_name},</p>
                  <p>Your issue has been resolved.</p>
                  <ul>
                    <li>Reference: <strong>{$ref}</strong></li>
                    <li>Title: <strong>{$title}</strong></li>
                  </ul>
                  <p>If you are not satisfied with the resolution, please contact us.</p>";

        $sms = "Dear {$member->full_name}, your issue ({$ref}) has been resolved. Contact us if you need further assistance.";

        $this->dispatch($member, "Issue Resolved: {$ref}", $body, $sms);
    }

    // ── Private helpers ────────────────────────────────────────────────

    private function dispatchToUser(string $email, string $name, string $phone, string $subject, string $body, string $sms): void
    {
        if ($email) {
            SendEmailJob::dispatch($email, $name, $subject, $this->htmlWrap($body));
        }
        if ($phone) {
            SendSmsJob::dispatch($phone, $sms);
        }
    }
}
