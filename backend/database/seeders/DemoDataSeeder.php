<?php

namespace Database\Seeders;

use App\Models\AccountTransaction;
use App\Models\ChartOfAccount;
use App\Models\Loan;
use App\Models\LoanProduct;
use App\Models\LoanRepayment;
use App\Services\LoanService;
use App\Models\Commodity;
use App\Models\CommodityRequest;
use App\Models\CommodityRequestItem;
use App\Models\CommodityType;
use App\Models\Contribution;
use App\Models\DepositAccount;
use App\Models\DividendEntry;
use App\Models\DividendRun;
use App\Models\FiscalYear;
use App\Models\Journal;
use App\Models\JournalLine;
use App\Models\Member;
use App\Models\MemberShare;
use App\Models\Org;
use App\Models\Period;
use App\Models\PettyCashAllocation;
use App\Models\PettyCashItem;
use App\Models\PettyCashRequest;
use App\Models\SaccoSetting;
use App\Models\SavingProduct;
use App\Models\ShareProduct;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $org   = Org::where('is_default', true)->firstOrFail();
        $orgId = $org->id;
        $admin = User::whereHas('roles', fn ($q) => $q->where('name', 'admin'))
            ->where('org_id', $orgId)
            ->firstOrFail();
        $fy    = FiscalYear::where('org_id', $orgId)->where('name', 'FY 2026')->firstOrFail();
        $junePeriod = Period::where('org_id', $orgId)
            ->where('fiscal_year_id', $fy->id)
            ->where('name', 'June 2026')
            ->firstOrFail();
        $mayPeriod = Period::where('org_id', $orgId)
            ->where('fiscal_year_id', $fy->id)
            ->where('name', 'May 2026')
            ->firstOrFail();

        $this->seedCommodities($orgId);
        $this->seedJournals($orgId, $admin, $fy, $junePeriod, $mayPeriod);
        $this->seedTransactions($orgId, $admin, $junePeriod, $mayPeriod);
        $this->seedPettyCash($orgId, $admin, $junePeriod, $mayPeriod);
        $this->seedContributions($orgId, $mayPeriod, $junePeriod);
        $this->seedMemberShares($orgId, $admin, $fy);
        $this->seedDividends($orgId, $admin, $fy);
        $this->seedCommodityRequests($orgId, $admin);
        $this->seedLoans($orgId, $admin);
    }

    // ── Commodities ────────────────────────────────────────────────────────

    private function seedCommodities(string $orgId): void
    {
        $types = [
            'Food & Groceries' => [
                ['name' => 'Maize Meal (10kg)',    'unit_price' => '85.00',  'stock_quantity' => 50],
                ['name' => 'Cooking Oil (2L)',     'unit_price' => '42.00',  'stock_quantity' => 40],
                ['name' => 'Sugar (2kg)',           'unit_price' => '28.00',  'stock_quantity' => 60],
                ['name' => 'Rice (5kg)',            'unit_price' => '65.00',  'stock_quantity' => 30],
            ],
            'Household Goods' => [
                ['name' => 'Washing Powder (2kg)', 'unit_price' => '55.00',  'stock_quantity' => 25],
                ['name' => 'Dish Soap (500ml)',    'unit_price' => '18.00',  'stock_quantity' => 40],
                ['name' => 'Broom & Dustpan Set', 'unit_price' => '120.00', 'stock_quantity' => 15],
            ],
            'Stationery' => [
                ['name' => 'Exercise Book (A4)',   'unit_price' => '12.00',  'stock_quantity' => 100],
                ['name' => 'Ball Point Pens (pk)', 'unit_price' => '20.00',  'stock_quantity' => 50],
                ['name' => 'Stapler',              'unit_price' => '45.00',  'stock_quantity' => 20],
            ],
            'Building Materials' => [
                ['name' => 'Cement (50kg bag)',    'unit_price' => '95.00',  'stock_quantity' => 80],
                ['name' => 'Paint (20L bucket)',   'unit_price' => '380.00', 'stock_quantity' => 10],
                ['name' => 'Sand (1 ton)',         'unit_price' => '250.00', 'stock_quantity' => 20],
            ],
            'Electronics & Accessories' => [
                ['name' => 'USB Flash Drive (16GB)', 'unit_price' => '75.00',  'stock_quantity' => 30],
                ['name' => 'Phone Charger (USB-C)',  'unit_price' => '55.00',  'stock_quantity' => 25],
                ['name' => 'Extension Cable (3m)',   'unit_price' => '90.00',  'stock_quantity' => 15],
            ],
        ];

        foreach ($types as $typeName => $commodities) {
            $type = CommodityType::firstOrCreate(
                ['org_id' => $orgId, 'name' => $typeName]
            );

            foreach ($commodities as $c) {
                Commodity::firstOrCreate(
                    ['org_id' => $orgId, 'commodity_type_id' => $type->id, 'name' => $c['name']],
                    [
                        'unit_price'     => $c['unit_price'],
                        'stock_quantity' => $c['stock_quantity'],
                        'is_active'      => true,
                    ]
                );
            }
        }
    }

    // ── Journals ───────────────────────────────────────────────────────────

    private function seedJournals(
        string $orgId,
        User $admin,
        FiscalYear $fy,
        Period $junePeriod,
        Period $mayPeriod
    ): void {
        $coa = fn (string $code) => ChartOfAccount::where('org_id', $orgId)->where('code', $code)->value('id');

        $bank           = $coa('1102');
        $loansRec       = $coa('1201');
        $intReceivable  = $coa('1202');
        $memberSavings  = $coa('2201');
        $instCapital    = $coa('3001');
        $intOnLoans     = $coa('4101');
        $loanFees       = $coa('4201');
        $pettyCashExp   = $coa('5101');
        $salaries       = $coa('5102');
        $officeSupplies = $coa('5104');

        $journals = [
            [
                'reference_number' => 'JNL-2026-001',
                'journal_date'     => '2026-05-01',
                'period'           => $mayPeriod,
                'narration'        => 'Opening bank balance — institutional capital injection',
                'lines'            => [
                    ['account_id' => $bank,        'debit' => '500000.00', 'credit' => '0.00', 'narration' => 'Opening cash at bank'],
                    ['account_id' => $instCapital, 'debit' => '0.00',      'credit' => '500000.00', 'narration' => 'Institutional capital'],
                ],
            ],
            [
                'reference_number' => 'JNL-2026-002',
                'journal_date'     => '2026-05-15',
                'period'           => $mayPeriod,
                'narration'        => 'Loan disbursement — Development Loan to member JWN-2026-0002',
                'lines'            => [
                    ['account_id' => $loansRec, 'debit' => '150000.00', 'credit' => '0.00',      'narration' => 'Loan receivable — Dev Loan'],
                    ['account_id' => $loanFees, 'debit' => '0.00',      'credit' => '1500.00',   'narration' => 'Processing fee 1%'],
                    ['account_id' => $bank,     'debit' => '0.00',      'credit' => '148500.00', 'narration' => 'Net disbursement to bank'],
                ],
            ],
            [
                'reference_number' => 'JNL-2026-003',
                'journal_date'     => '2026-05-31',
                'period'           => $mayPeriod,
                'narration'        => 'May payroll — salaries & wages',
                'lines'            => [
                    ['account_id' => $salaries,    'debit' => '85000.00', 'credit' => '0.00',      'narration' => 'Staff salaries May 2026'],
                    ['account_id' => $bank,        'debit' => '0.00',     'credit' => '85000.00',  'narration' => 'Paid from bank account'],
                ],
            ],
            [
                'reference_number' => 'JNL-2026-004',
                'journal_date'     => '2026-06-01',
                'period'           => $junePeriod,
                'narration'        => 'Interest accrual — member loans portfolio May 2026',
                'lines'            => [
                    ['account_id' => $intReceivable, 'debit' => '18750.00', 'credit' => '0.00',     'narration' => 'Interest receivable on loan portfolio'],
                    ['account_id' => $intOnLoans,    'debit' => '0.00',     'credit' => '18750.00', 'narration' => 'Interest income accrued'],
                ],
            ],
            [
                'reference_number' => 'JNL-2026-005',
                'journal_date'     => '2026-06-05',
                'period'           => $junePeriod,
                'narration'        => 'Petty cash expenses — office supplies June 2026',
                'lines'            => [
                    ['account_id' => $officeSupplies, 'debit' => '3200.00', 'credit' => '0.00',    'narration' => 'Stationery and printing supplies'],
                    ['account_id' => $pettyCashExp,   'debit' => '1800.00', 'credit' => '0.00',    'narration' => 'Miscellaneous petty cash'],
                    ['account_id' => $bank,           'debit' => '0.00',    'credit' => '5000.00', 'narration' => 'Paid from bank account'],
                ],
            ],
            [
                'reference_number' => 'JNL-2026-006',
                'journal_date'     => '2026-06-10',
                'period'           => $junePeriod,
                'narration'        => 'Member savings deposit — bulk June contributions',
                'lines'            => [
                    ['account_id' => $bank,          'debit' => '62500.00', 'credit' => '0.00',     'narration' => 'Cash received from members'],
                    ['account_id' => $memberSavings, 'debit' => '0.00',     'credit' => '62500.00', 'narration' => 'Member savings liability'],
                ],
            ],
        ];

        foreach ($journals as $j) {
            if (Journal::where('org_id', $orgId)->where('reference_number', $j['reference_number'])->exists()) {
                continue;
            }

            $journal = Journal::create([
                'org_id'           => $orgId,
                'fiscal_year_id'   => $fy->id,
                'period_id'        => $j['period']->id,
                'reference_number' => $j['reference_number'],
                'journal_date'     => $j['journal_date'],
                'narration'        => $j['narration'],
                'is_posted'        => true,
                'posted_at'        => now(),
                'posted_by'        => $admin->id,
                'created_by'       => $admin->id,
            ]);

            foreach ($j['lines'] as $line) {
                JournalLine::create([
                    'org_id'     => $orgId,
                    'journal_id' => $journal->id,
                    'account_id' => $line['account_id'],
                    'debit'      => $line['debit'],
                    'credit'     => $line['credit'],
                    'narration'  => $line['narration'],
                ]);
            }
        }
    }

    // ── Account Transactions (Ledger) ──────────────────────────────────────

    private function seedTransactions(
        string $orgId,
        User $admin,
        Period $junePeriod,
        Period $mayPeriod
    ): void {
        $savingProduct = SavingProduct::where('org_id', $orgId)->where('name', 'Regular Savings')->firstOrFail();
        $members = Member::where('org_id', $orgId)
            ->where('approval_status', 'approved')
            ->orderBy('member_number')
            ->take(5)
            ->get();

        foreach ($members as $i => $member) {
            $accountNumber = 'SAV-' . substr($member->member_number, -4) . '-' . str_pad($i + 1, 3, '0', STR_PAD_LEFT);

            $account = DepositAccount::firstOrCreate(
                ['org_id' => $orgId, 'account_number' => $accountNumber],
                [
                    'member_id'       => $member->id,
                    'product_id'      => $savingProduct->id,
                    'balance'         => '0.00',
                    'interest_rate'   => $savingProduct->interest_rate,
                    'opening_date'    => '2026-05-01',
                    'is_active'       => true,
                    'approval_status' => 'approved',
                    'approved_by'     => $admin->id,
                    'approved_at'     => now(),
                ]
            );

            // Skip if transactions already exist for this account
            if (AccountTransaction::where('deposit_account_id', $account->id)->exists()) {
                continue;
            }

            $openingDeposit = (5000 + ($i * 2500));
            $this->createTxn($account, $orgId, $admin, $mayPeriod, [
                'transaction_type' => 'deposit',
                'amount'           => $openingDeposit,
                'balance_before'   => 0,
                'transaction_date' => '2026-05-01',
                'value_date'       => '2026-05-01',
                'narration'        => 'Opening deposit',
                'reference_number' => 'TXN-' . $accountNumber . '-001',
            ]);

            $balance = $openingDeposit;

            // Monthly contribution top-up
            $topUp = 1500 + ($i * 500);
            $this->createTxn($account, $orgId, $admin, $mayPeriod, [
                'transaction_type' => 'deposit',
                'amount'           => $topUp,
                'balance_before'   => $balance,
                'transaction_date' => '2026-05-15',
                'value_date'       => '2026-05-15',
                'narration'        => 'Monthly contribution — May 2026',
                'reference_number' => 'TXN-' . $accountNumber . '-002',
            ]);
            $balance += $topUp;

            // Interest credit
            $interest = round($balance * 0.03 / 12, 2);
            $this->createTxn($account, $orgId, $admin, $mayPeriod, [
                'transaction_type' => 'interest_credit',
                'amount'           => $interest,
                'balance_before'   => $balance,
                'transaction_date' => '2026-05-31',
                'value_date'       => '2026-05-31',
                'narration'        => 'Monthly interest credit — May 2026',
                'reference_number' => 'TXN-' . $accountNumber . '-003',
            ]);
            $balance += $interest;

            // June contribution
            $this->createTxn($account, $orgId, $admin, $junePeriod, [
                'transaction_type' => 'deposit',
                'amount'           => $topUp,
                'balance_before'   => $balance,
                'transaction_date' => '2026-06-10',
                'value_date'       => '2026-06-10',
                'narration'        => 'Monthly contribution — June 2026',
                'reference_number' => 'TXN-' . $accountNumber . '-004',
            ]);
            $balance += $topUp;

            // Occasional withdrawal for some members
            if ($i % 2 === 0) {
                $withdrawal = min($balance - 500, 2000);
                if ($withdrawal > 0) {
                    $this->createTxn($account, $orgId, $admin, $junePeriod, [
                        'transaction_type' => 'withdrawal',
                        'amount'           => $withdrawal,
                        'balance_before'   => $balance,
                        'transaction_date' => '2026-06-12',
                        'value_date'       => '2026-06-12',
                        'narration'        => 'Member withdrawal',
                        'reference_number' => 'TXN-' . $accountNumber . '-005',
                    ]);
                    $balance -= $withdrawal;
                }
            }

            $account->update(['balance' => $balance, 'last_activity_date' => '2026-06-12']);
        }
    }

    private function createTxn(
        DepositAccount $account,
        string $orgId,
        User $admin,
        Period $period,
        array $data
    ): void {
        $creditTypes = ['deposit', 'interest_credit', 'transfer_in', 'loan_disbursement', 'contribution'];
        $isCredit    = in_array($data['transaction_type'], $creditTypes, true);
        $balanceAfter = $isCredit
            ? bcadd((string) $data['balance_before'], (string) $data['amount'], 2)
            : bcsub((string) $data['balance_before'], (string) $data['amount'], 2);

        AccountTransaction::create([
            'org_id'             => $orgId,
            'deposit_account_id' => $account->id,
            'period_id'          => $period->id,
            'transaction_type'   => $data['transaction_type'],
            'amount'             => $data['amount'],
            'balance_after'      => $balanceAfter,
            'reference_number'   => $data['reference_number'],
            'transaction_date'   => $data['transaction_date'],
            'value_date'         => $data['value_date'],
            'narration'          => $data['narration'],
            'created_by'         => $admin->id,
            'approval_status'    => 'approved',
            'approved_by'        => $admin->id,
            'approved_at'        => now(),
        ]);
    }

    // ── Petty Cash ─────────────────────────────────────────────────────────

    private function seedPettyCash(
        string $orgId,
        User $admin,
        Period $junePeriod,
        Period $mayPeriod
    ): void {
        // May allocation
        $mayAlloc = PettyCashAllocation::firstOrCreate(
            ['org_id' => $orgId, 'period_id' => $mayPeriod->id, 'allocated_to' => $admin->id],
            [
                'amount'          => '15000.00',
                'spent'           => '9800.00',
                'balance'         => '5200.00',
                'narration'       => 'Office operations — May 2026',
                'approval_status' => 'approved',
                'approved_by'     => $admin->id,
                'approved_at'     => now(),
            ]
        );

        // June allocation
        $juneAlloc = PettyCashAllocation::firstOrCreate(
            ['org_id' => $orgId, 'period_id' => $junePeriod->id, 'allocated_to' => $admin->id],
            [
                'amount'          => '15000.00',
                'spent'           => '4350.00',
                'balance'         => '10650.00',
                'narration'       => 'Office operations — June 2026',
                'approval_status' => 'approved',
                'approved_by'     => $admin->id,
                'approved_at'     => now(),
            ]
        );

        $item = fn (string $name) => PettyCashItem::where('org_id', $orgId)->where('name', $name)->value('id');

        $mayRequests = [
            [
                'item'           => 'Printing Paper',
                'units'          => 5,
                'unit_price'     => '500.00',
                'amount'         => '2500.00',
                'receipt_number' => 'RCP-2026-0501',
                'expense_date'   => '2026-05-03',
                'narration'      => 'A4 paper for monthly statements',
            ],
            [
                'item'           => 'Taxi / Ride-share',
                'units'          => 2,
                'unit_price'     => '500.00',
                'amount'         => '1000.00',
                'receipt_number' => 'RCP-2026-0502',
                'expense_date'   => '2026-05-08',
                'narration'      => 'Transport to regulatory office',
            ],
            [
                'item'           => 'Internet Bill',
                'units'          => 1,
                'unit_price'     => '2000.00',
                'amount'         => '2000.00',
                'receipt_number' => 'RCP-2026-0503',
                'expense_date'   => '2026-05-12',
                'narration'      => 'Monthly internet service fee',
            ],
            [
                'item'           => 'Tea & Coffee',
                'units'          => 3,
                'unit_price'     => '300.00',
                'amount'         => '900.00',
                'receipt_number' => 'RCP-2026-0504',
                'expense_date'   => '2026-05-20',
                'narration'      => 'Board meeting refreshments',
            ],
            [
                'item'           => 'Cleaning Supplies',
                'units'          => 2,
                'unit_price'     => '600.00',
                'amount'         => '1200.00',
                'receipt_number' => 'RCP-2026-0505',
                'expense_date'   => '2026-05-27',
                'narration'      => 'Monthly cleaning supplies',
            ],
            [
                'item'           => 'Parking Fee',
                'units'          => 4,
                'unit_price'     => '200.00',
                'amount'         => '800.00',
                'receipt_number' => 'RCP-2026-0506',
                'expense_date'   => '2026-05-29',
                'narration'      => 'Staff parking — end of month',
            ],
            [
                'item'           => 'Pens & Pencils',
                'units'          => 1,
                'unit_price'     => '150.00',
                'amount'         => '150.00',
                'receipt_number' => 'RCP-2026-0507',
                'expense_date'   => '2026-05-30',
                'narration'      => 'Stationery restock',
            ],
            [
                'item'           => 'Airtime',
                'units'          => 3,
                'unit_price'     => '450.00',
                'amount'         => '1250.00',
                'receipt_number' => 'RCP-2026-0508',
                'expense_date'   => '2026-05-31',
                'narration'      => 'Staff airtime allocation May',
            ],
        ];

        $juneRequests = [
            [
                'item'           => 'Printing Paper',
                'units'          => 3,
                'unit_price'     => '500.00',
                'amount'         => '1500.00',
                'receipt_number' => 'RCP-2026-0601',
                'expense_date'   => '2026-06-02',
                'narration'      => 'A4 paper for member welcome packs',
            ],
            [
                'item'           => 'Fuel Reimbursement',
                'units'          => 2,
                'unit_price'     => '1000.00',
                'amount'         => '2000.00',
                'receipt_number' => 'RCP-2026-0602',
                'expense_date'   => '2026-06-05',
                'narration'      => 'Field visit fuel reimbursement',
            ],
            [
                'item'           => 'Tea & Coffee',
                'units'          => 1,
                'unit_price'     => '300.00',
                'amount'         => '300.00',
                'receipt_number' => 'RCP-2026-0603',
                'expense_date'   => '2026-06-10',
                'narration'      => 'AGM planning committee refreshments',
            ],
            [
                'item'           => 'Envelopes',
                'units'          => 2,
                'unit_price'     => '200.00',
                'amount'         => '400.00',
                'receipt_number' => 'RCP-2026-0604',
                'expense_date'   => '2026-06-11',
                'narration'      => 'Statement envelopes',
            ],
            [
                'item'           => 'Staples & Clips',
                'units'          => 2,
                'unit_price'     => '80.00',
                'amount'         => '150.00',
                'receipt_number' => 'RCP-2026-0605',
                'expense_date'   => '2026-06-12',
                'narration'      => 'Stationery restock',
            ],
        ];

        foreach ($mayRequests as $r) {
            $itemId = $item($r['item']);
            if (! $itemId) continue;
            if (PettyCashRequest::where('org_id', $orgId)->where('receipt_number', $r['receipt_number'])->exists()) continue;

            PettyCashRequest::create([
                'org_id'          => $orgId,
                'allocation_id'   => $mayAlloc->id,
                'item_id'         => $itemId,
                'requested_by'    => $admin->id,
                'units'           => $r['units'],
                'unit_price'      => $r['unit_price'],
                'amount'          => $r['amount'],
                'receipt_number'  => $r['receipt_number'],
                'expense_date'    => $r['expense_date'],
                'narration'       => $r['narration'],
                'approval_status' => 'approved',
                'approved_by'     => $admin->id,
                'approved_at'     => now(),
            ]);
        }

        foreach ($juneRequests as $r) {
            $itemId = $item($r['item']);
            if (! $itemId) continue;
            if (PettyCashRequest::where('org_id', $orgId)->where('receipt_number', $r['receipt_number'])->exists()) continue;

            PettyCashRequest::create([
                'org_id'          => $orgId,
                'allocation_id'   => $juneAlloc->id,
                'item_id'         => $itemId,
                'requested_by'    => $admin->id,
                'units'           => $r['units'],
                'unit_price'      => $r['unit_price'],
                'amount'          => $r['amount'],
                'receipt_number'  => $r['receipt_number'],
                'expense_date'    => $r['expense_date'],
                'narration'       => $r['narration'],
                'approval_status' => 'approved',
                'approved_by'     => $admin->id,
                'approved_at'     => now(),
            ]);
        }
    }

    // ── Contributions ──────────────────────────────────────────────────────

    private function seedContributions(string $orgId, Period $mayPeriod, Period $junePeriod): void
    {
        $setting        = SaccoSetting::where('org_id', $orgId)->firstOrFail();
        $expectedAmount = $setting->min_monthly_contribution ?? '500.00';
        $savingProduct  = SavingProduct::where('org_id', $orgId)->where('name', 'Regular Savings')->firstOrFail();
        $admin          = User::whereHas('roles', fn ($q) => $q->where('name', 'admin'))
                              ->where('org_id', $orgId)->firstOrFail();

        $members = Member::where('org_id', $orgId)
            ->where('approval_status', 'approved')
            ->orderBy('member_number')
            ->get();

        foreach ($members as $i => $member) {
            // Ensure the member has a deposit account; create one if missing
            $account = DepositAccount::where('org_id', $orgId)
                ->where('member_id', $member->id)
                ->first();

            if (! $account) {
                $seq    = str_pad($i + 1, 3, '0', STR_PAD_LEFT);
                $suffix = substr($member->member_number, -4);
                $account = DepositAccount::create([
                    'org_id'          => $orgId,
                    'member_id'       => $member->id,
                    'product_id'      => $savingProduct->id,
                    'account_number'  => "SAV-{$suffix}-{$seq}",
                    'balance'         => '1000.00',
                    'interest_rate'   => $savingProduct->interest_rate,
                    'opening_date'    => '2026-05-01',
                    'is_active'       => true,
                    'approval_status' => 'approved',
                    'approved_by'     => $admin->id,
                    'approved_at'     => now(),
                ]);
            }

            // May — all paid
            Contribution::firstOrCreate(
                ['org_id' => $orgId, 'member_id' => $member->id, 'period_id' => $mayPeriod->id],
                [
                    'deposit_account_id' => $account->id,
                    'expected_amount'    => $expectedAmount,
                    'paid_amount'        => $expectedAmount,
                    'due_date'           => '2026-05-31',
                    'paid_date'          => '2026-05-15',
                    'status'             => 'paid',
                ]
            );

            // June — mix: first 8 paid, next 3 partial, last 2 pending
            $juneStatus = match (true) {
                $i < 8  => 'paid',
                $i < 11 => 'partial',
                default => 'pending',
            };
            $junePaid     = match ($juneStatus) {
                'paid'    => $expectedAmount,
                'partial' => bcdiv($expectedAmount, '2', 2),
                default   => '0.00',
            };
            $junePaidDate = $juneStatus === 'pending' ? null : '2026-06-10';

            Contribution::firstOrCreate(
                ['org_id' => $orgId, 'member_id' => $member->id, 'period_id' => $junePeriod->id],
                [
                    'deposit_account_id' => $account->id,
                    'expected_amount'    => $expectedAmount,
                    'paid_amount'        => $junePaid,
                    'due_date'           => '2026-06-30',
                    'paid_date'          => $junePaidDate,
                    'status'             => $juneStatus,
                ]
            );
        }
    }

    // ── Member Shares ──────────────────────────────────────────────────────

    private function seedMemberShares(string $orgId, User $admin, FiscalYear $fy): void
    {
        $shareCapitalAccount = ChartOfAccount::where('org_id', $orgId)->where('code', '2202')->first();

        $ordinary = ShareProduct::firstOrCreate(
            ['org_id' => $orgId, 'name' => 'Ordinary Shares'],
            [
                'share_capital_account_id' => $shareCapitalAccount?->id,
                'price_per_share'          => '10.00',
                'min_shares'               => 50,
                'max_shares'               => 10000,
                'is_active'                => true,
            ]
        );

        $bonus = ShareProduct::firstOrCreate(
            ['org_id' => $orgId, 'name' => 'Bonus Shares'],
            [
                'share_capital_account_id' => $shareCapitalAccount?->id,
                'price_per_share'          => '10.00',
                'min_shares'               => 1,
                'max_shares'               => null,
                'is_active'                => true,
            ]
        );

        $accounts = DepositAccount::where('org_id', $orgId)
            ->where('account_number', 'like', 'SAV-%')
            ->with('member')
            ->get();

        // Ordinary share purchases — varying quantities per member
        $ordinaryPurchases = [
            ['qty' => 500,  'date' => '2026-01-15', 'notes' => 'Initial ordinary share subscription'],
            ['qty' => 200,  'date' => '2026-02-10', 'notes' => 'Additional ordinary shares'],
            ['qty' => 1000, 'date' => '2026-03-05', 'notes' => 'Ordinary share purchase — Q1'],
            ['qty' => 300,  'date' => '2026-04-20', 'notes' => 'Additional ordinary shares'],
            ['qty' => 750,  'date' => '2026-05-01', 'notes' => 'Mid-year ordinary share purchase'],
        ];

        foreach ($accounts as $i => $account) {
            $member  = $account->member;
            if (! $member) continue;

            $purchase = $ordinaryPurchases[$i] ?? $ordinaryPurchases[0];
            $total    = bcmul((string) $purchase['qty'], $ordinary->price_per_share, 2);

            if (! MemberShare::where('org_id', $orgId)->where('member_id', $member->id)->where('share_product_id', $ordinary->id)->exists()) {
                MemberShare::create([
                    'org_id'           => $orgId,
                    'member_id'        => $member->id,
                    'share_product_id' => $ordinary->id,
                    'deposit_account_id' => $account->id,
                    'quantity'         => $purchase['qty'],
                    'price_per_share'  => $ordinary->price_per_share,
                    'total_amount'     => $total,
                    'purchase_date'    => $purchase['date'],
                    'status'           => 'approved',
                    'approved_by'      => $admin->id,
                    'approved_at'      => now(),
                    'notes'            => $purchase['notes'],
                ]);
            }

            // Bonus shares for first 3 members (FY 2025 dividend reinvestment)
            if ($i < 3) {
                $bonusQty   = intval($purchase['qty'] * 0.08);
                $bonusTotal = bcmul((string) $bonusQty, $bonus->price_per_share, 2);

                if (! MemberShare::where('org_id', $orgId)->where('member_id', $member->id)->where('share_product_id', $bonus->id)->exists()) {
                    MemberShare::create([
                        'org_id'             => $orgId,
                        'member_id'          => $member->id,
                        'share_product_id'   => $bonus->id,
                        'deposit_account_id' => $account->id,
                        'quantity'           => $bonusQty,
                        'price_per_share'    => $bonus->price_per_share,
                        'total_amount'       => $bonusTotal,
                        'purchase_date'      => '2026-01-10',
                        'status'             => 'approved',
                        'approved_by'        => $admin->id,
                        'approved_at'        => now(),
                        'notes'              => 'Bonus shares from FY 2025 dividend reinvestment',
                    ]);
                }
            }
        }
    }

    // ── Dividends ──────────────────────────────────────────────────────────

    private function seedDividends(string $orgId, User $admin, FiscalYear $fy): void
    {
        if (DividendRun::where('org_id', $orgId)->where('fiscal_year_id', $fy->id)->exists()) {
            return;
        }

        // Gather approved ordinary share totals per member
        $ordinary = ShareProduct::where('org_id', $orgId)->where('name', 'Ordinary Shares')->first();
        if (! $ordinary) return;

        $shares = MemberShare::where('org_id', $orgId)
            ->where('share_product_id', $ordinary->id)
            ->where('status', 'approved')
            ->with(['member', 'depositAccount'])
            ->get();

        if ($shares->isEmpty()) return;

        $rate         = '0.0800'; // 8%
        $totalDividend = '0.00';

        $entries = $shares->map(function ($share) use ($rate, &$totalDividend) {
            $dividend = bcmul($share->total_amount, $rate, 2);
            $totalDividend = bcadd($totalDividend, $dividend, 2);
            return [
                'member_id'          => $share->member_id,
                'share_balance'      => $share->total_amount,
                'dividend_amount'    => $dividend,
                'credited_account_id'=> $share->deposit_account_id,
            ];
        });

        $run = DividendRun::create([
            'org_id'         => $orgId,
            'fiscal_year_id' => $fy->id,
            'rate'           => $rate,
            'status'         => 'posted',
            'total_dividend' => $totalDividend,
            'approved_by'    => $admin->id,
            'approved_at'    => now(),
            'posted_at'      => now(),
            'notes'          => 'FY 2026 dividend run — 8% on ordinary share capital',
        ]);

        foreach ($entries as $entry) {
            DividendEntry::create([
                'org_id'              => $orgId,
                'dividend_run_id'     => $run->id,
                'member_id'           => $entry['member_id'],
                'share_balance'       => $entry['share_balance'],
                'dividend_amount'     => $entry['dividend_amount'],
                'credited_account_id' => $entry['credited_account_id'],
                'posted_at'           => now(),
            ]);
        }
    }

    // ── Loans ──────────────────────────────────────────────────────────────

    private function seedLoans(string $orgId, User $admin): void
    {
        $loanService = app(LoanService::class);

        $emergency   = LoanProduct::where('org_id', $orgId)->where('name', 'Emergency Loan')->first();
        $development = LoanProduct::where('org_id', $orgId)->where('name', 'Development Loan')->first();
        $schoolFees  = LoanProduct::where('org_id', $orgId)->where('name', 'School Fees Loan')->first();

        if (! $emergency || ! $development || ! $schoolFees) {
            return;
        }

        $mem = fn (string $name) => Member::where('org_id', $orgId)->where('full_name', $name)->first();

        $loanDefs = [
            [
                'member'          => 'Demo Member',
                'product'         => $emergency,
                'principal'       => '20000.00',
                'period'          => 6,
                'disbursed_date'  => '2026-01-10',
                'repayments_paid' => 5,
            ],
            [
                'member'          => 'Kagiso Sithole',
                'product'         => $emergency,
                'principal'       => '15000.00',
                'period'          => 6,
                'disbursed_date'  => '2026-02-05',
                'repayments_paid' => 4,
            ],
            [
                'member'          => 'Boitumelo Kgosi',
                'product'         => $schoolFees,
                'principal'       => '30000.00',
                'period'          => 6,
                'disbursed_date'  => '2026-03-01',
                'repayments_paid' => 3,
            ],
            [
                'member'          => 'Tebogo Mosweu',
                'product'         => $development,
                'principal'       => '80000.00',
                'period'          => 24,
                'disbursed_date'  => '2026-01-20',
                'repayments_paid' => 4,
            ],
            [
                'member'          => 'Mpho Gabaraane',
                'product'         => $development,
                'principal'       => '50000.00',
                'period'          => 12,
                'disbursed_date'  => '2026-04-01',
                'repayments_paid' => 2,
            ],
        ];

        foreach ($loanDefs as $def) {
            $member = $mem($def['member']);
            if (! $member) continue;

            // Skip if this member already has an active loan on this product
            if (Loan::where('org_id', $orgId)
                ->where('member_id', $member->id)
                ->where('loan_product_id', $def['product']->id)
                ->exists()) {
                continue;
            }

            // Ensure the member has a deposit account
            $account = DepositAccount::where('org_id', $orgId)
                ->where('member_id', $member->id)
                ->first();

            if (! $account) {
                $savingProduct = \App\Models\SavingProduct::where('org_id', $orgId)
                    ->where('name', 'Regular Savings')->first();
                $account = DepositAccount::create([
                    'org_id'          => $orgId,
                    'member_id'       => $member->id,
                    'product_id'      => $savingProduct?->id,
                    'account_number'  => 'SAV-LOAN-' . substr($member->member_number, -4),
                    'balance'         => '2000.00',
                    'interest_rate'   => $savingProduct?->interest_rate ?? '3.00',
                    'opening_date'    => '2026-01-01',
                    'is_active'       => true,
                    'approval_status' => 'approved',
                    'approved_by'     => $admin->id,
                    'approved_at'     => now(),
                ]);
            }

            // Create loan (status: applied)
            $loan = $loanService->store([
                'loan_product_id'     => $def['product']->id,
                'member_id'           => $member->id,
                'principal_amount'    => $def['principal'],
                'interest_rate'       => $def['product']->interest_rate,
                'repayment_period'    => $def['period'],
                'repayment_frequency' => $def['product']->repayment_frequency,
            ], $orgId, $admin);

            // Approve directly (bypassing guarantor check for seeder)
            $loan->update([
                'loan_status'     => 'approved',
                'approval_status' => 'approved',
                'approved_by'     => $admin->id,
                'approved_at'     => now(),
            ]);
            $loan->refresh();

            // Disburse — generates repayment schedule
            $loan = $loanService->disburse($loan, [
                'disburse_account_id' => $account->id,
                'disbursed_date'      => $def['disbursed_date'],
            ], $admin);

            // Record historical repayments
            $schedules = LoanRepayment::where('loan_id', $loan->id)
                ->where('repayment_status', '!=', 'paid')
                ->orderBy('due_date')
                ->take($def['repayments_paid'])
                ->get();

            foreach ($schedules as $schedule) {
                $loanService->recordRepayment($loan, $schedule, [
                    'amount'    => $schedule->balance,
                    'paid_date' => $schedule->due_date,
                ], $admin);
                $loan = $loan->fresh();
            }
        }
    }

    // ── Commodity Requests ─────────────────────────────────────────────────

    private function seedCommodityRequests(string $orgId, User $admin): void
    {
        $com = fn (string $name) => Commodity::where('org_id', $orgId)->where('name', $name)->first();
        $mem = fn (string $name) => Member::where('org_id', $orgId)->where('full_name', $name)->first();

        $requests = [
            [
                'request_number'   => 'COMREQ-2026-001',
                'member'           => 'Demo Member',
                'status'           => 'issued',
                'repayment_period' => 3,
                'approved_at'      => '2026-05-10',
                'issued_at'        => '2026-05-12',
                'notes'            => 'Monthly grocery hamper request',
                'items'            => [
                    ['name' => 'Maize Meal (10kg)',  'qty' => 2],
                    ['name' => 'Cooking Oil (2L)',   'qty' => 3],
                    ['name' => 'Sugar (2kg)',         'qty' => 2],
                ],
            ],
            [
                'request_number'   => 'COMREQ-2026-002',
                'member'           => 'Kagiso Sithole',
                'status'           => 'approved',
                'repayment_period' => 6,
                'approved_at'      => '2026-05-20',
                'issued_at'        => null,
                'notes'            => 'Household supplies for family',
                'items'            => [
                    ['name' => 'Rice (5kg)',           'qty' => 4],
                    ['name' => 'Washing Powder (2kg)', 'qty' => 2],
                    ['name' => 'Dish Soap (500ml)',    'qty' => 3],
                    ['name' => 'Broom & Dustpan Set', 'qty' => 1],
                ],
            ],
            [
                'request_number'   => 'COMREQ-2026-003',
                'member'           => 'Boitumelo Kgosi',
                'status'           => 'pending',
                'repayment_period' => 3,
                'approved_at'      => null,
                'issued_at'        => null,
                'notes'            => 'School stationery for children',
                'items'            => [
                    ['name' => 'Exercise Book (A4)',   'qty' => 10],
                    ['name' => 'Ball Point Pens (pk)', 'qty' => 3],
                    ['name' => 'Stapler',              'qty' => 1],
                ],
            ],
            [
                'request_number'   => 'COMREQ-2026-004',
                'member'           => 'Tebogo Mosweu',
                'status'           => 'issued',
                'repayment_period' => 12,
                'approved_at'      => '2026-04-15',
                'issued_at'        => '2026-04-18',
                'notes'            => 'Home construction materials',
                'items'            => [
                    ['name' => 'Cement (50kg bag)', 'qty' => 10],
                    ['name' => 'Sand (1 ton)',       'qty' => 2],
                ],
            ],
            [
                'request_number'   => 'COMREQ-2026-005',
                'member'           => 'Mpho Gabaraane',
                'status'           => 'repaid',
                'repayment_period' => 3,
                'approved_at'      => '2026-03-05',
                'issued_at'        => '2026-03-07',
                'notes'            => 'Office accessories',
                'items'            => [
                    ['name' => 'USB Flash Drive (16GB)', 'qty' => 2],
                    ['name' => 'Phone Charger (USB-C)',  'qty' => 1],
                    ['name' => 'Extension Cable (3m)',   'qty' => 1],
                ],
            ],
            [
                'request_number'   => 'COMREQ-2026-006',
                'member'           => 'Demo Member',
                'status'           => 'rejected',
                'repayment_period' => null,
                'approved_at'      => null,
                'issued_at'        => null,
                'notes'            => 'Request rejected — outstanding balance on previous request',
                'items'            => [
                    ['name' => 'Paint (20L bucket)', 'qty' => 2],
                    ['name' => 'Cement (50kg bag)',  'qty' => 5],
                ],
            ],
            [
                'request_number'   => 'COMREQ-2026-007',
                'member'           => 'Kagiso Sithole',
                'status'           => 'pending',
                'repayment_period' => 6,
                'approved_at'      => null,
                'issued_at'        => null,
                'notes'            => 'Electronics for home office setup',
                'items'            => [
                    ['name' => 'USB Flash Drive (16GB)', 'qty' => 1],
                    ['name' => 'Extension Cable (3m)',   'qty' => 2],
                ],
            ],
        ];

        foreach ($requests as $r) {
            if (CommodityRequest::where('request_number', $r['request_number'])->exists()) {
                continue;
            }

            $member = $mem($r['member']);
            if (! $member) continue;

            // Calculate total from items
            $total = '0.00';
            $resolvedItems = [];
            foreach ($r['items'] as $item) {
                $commodity = $com($item['name']);
                if (! $commodity) continue;
                $subtotal      = bcmul($commodity->unit_price, (string) $item['qty'], 2);
                $total         = bcadd($total, $subtotal, 2);
                $resolvedItems[] = ['commodity' => $commodity, 'qty' => $item['qty'], 'subtotal' => $subtotal];
            }

            $request = CommodityRequest::create([
                'org_id'           => $orgId,
                'member_id'        => $member->id,
                'request_number'   => $r['request_number'],
                'status'           => $r['status'],
                'total_amount'     => $total,
                'repayment_period' => $r['repayment_period'],
                'approved_by'      => $r['approved_at'] ? $admin->id : null,
                'approved_at'      => $r['approved_at'],
                'issued_at'        => $r['issued_at'],
                'notes'            => $r['notes'],
            ]);

            foreach ($resolvedItems as $line) {
                CommodityRequestItem::create([
                    'org_id'                => $orgId,
                    'commodity_request_id'  => $request->id,
                    'commodity_id'          => $line['commodity']->id,
                    'quantity'              => $line['qty'],
                    'unit_price'            => $line['commodity']->unit_price,
                    'subtotal'              => $line['subtotal'],
                ]);
            }
        }
    }
}
