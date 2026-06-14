<?php

namespace Database\Seeders;

use App\Models\AccountType;
use App\Models\ActivityType;
use App\Models\Bank;
use App\Models\BankAccount;
use App\Models\ChartOfAccount;
use App\Models\CollateralType;
use App\Models\Department;
use App\Models\FiscalYear;
use App\Models\IssueCategory;
use App\Models\LoanProduct;
use App\Models\Org;
use App\Models\Period;
use App\Models\PettyCashCategory;
use App\Models\PettyCashItem;
use App\Models\SaccoSetting;
use App\Models\SavingProduct;
use Illuminate\Database\Seeder;

class ConfigurationsSeeder extends Seeder
{
    public function run(): void
    {
        $org = Org::where('is_default', true)->firstOrFail();
        $orgId = $org->id;

        // ── SACCO Settings ────────────────────────────────────────────────
        SaccoSetting::firstOrCreate(
            ['org_id' => $orgId],
            [
                'registration_fee'          => '500.00',
                'min_share_capital'         => '5000.00',
                'min_monthly_contribution'  => '500.00',
                'loan_limit_multiplier'     => '3.00',
            ]
        );

        // ── Departments ───────────────────────────────────────────────────
        $departments = ['Finance', 'Operations', 'Human Resources', 'Information Technology', 'Management'];
        foreach ($departments as $name) {
            Department::firstOrCreate(['org_id' => $orgId, 'name' => $name], ['is_active' => true]);
        }

        // ── Collateral Types ──────────────────────────────────────────────
        $collateral = [
            ['name' => 'Log Book',          'description' => 'Vehicle log book (motor vehicle ownership document)'],
            ['name' => 'Land Title Deed',   'description' => 'Certificate of title for land or property'],
            ['name' => 'Share Certificate', 'description' => 'SACCO or company share certificate'],
            ['name' => 'Insurance Policy',  'description' => 'Life or asset insurance policy'],
            ['name' => 'Salary Assignment', 'description' => 'Signed salary assignment letter from employer'],
        ];
        foreach ($collateral as $item) {
            CollateralType::firstOrCreate(
                ['org_id' => $orgId, 'name' => $item['name']],
                ['description' => $item['description'], 'is_active' => true]
            );
        }

        // ── Banks ─────────────────────────────────────────────────────────
        $banks = [
            ['name' => 'KCB Bank Kenya',          'code' => 'KCB'],
            ['name' => 'Equity Bank Kenya',        'code' => 'EQT'],
            ['name' => 'Co-operative Bank',        'code' => 'COP'],
            ['name' => 'NCBA Bank Kenya',          'code' => 'NCBA'],
            ['name' => 'Absa Bank Kenya',          'code' => 'ABSA'],
            ['name' => 'Standard Chartered Kenya', 'code' => 'SCB'],
            ['name' => 'Diamond Trust Bank',       'code' => 'DTB'],
            ['name' => 'Family Bank',              'code' => 'FAM'],
            ['name' => 'I&M Bank Kenya',           'code' => 'IMB'],
            ['name' => 'Stanbic Bank Kenya',       'code' => 'SBK'],
            ['name' => 'Prime Bank',               'code' => 'PBK'],
        ];
        foreach ($banks as $bank) {
            Bank::firstOrCreate(
                ['org_id' => $orgId, 'code' => $bank['code']],
                ['name' => $bank['name'], 'is_active' => true]
            );
        }

        // ── Loan Products ─────────────────────────────────────────────────
        $loanProducts = [
            [
                'name'                  => 'Emergency Loan',
                'description'           => 'Short-term emergency loan for urgent needs.',
                'interest_rate'         => '1.00',
                'interest_method'       => 'flat',
                'repayment_frequency'   => 'monthly',
                'min_amount'            => '5000.00',
                'max_amount'            => '50000.00',
                'min_period_months'     => 1,
                'max_period_months'     => 6,
                'max_repayments'        => 6,
                'requires_guarantor'    => false,
                'requires_collateral'   => false,
                'min_membership_months' => 3,
                'processing_fee_amount' => '200.00',
                'processing_fee_percent'=> '0.00',
                'penalty_rate'          => '5.00',
                'is_active'             => true,
            ],
            [
                'name'                  => 'Development Loan',
                'description'           => 'Medium-term loan for development projects.',
                'interest_rate'         => '1.00',
                'interest_method'       => 'reducing_balance',
                'repayment_frequency'   => 'monthly',
                'min_amount'            => '10000.00',
                'max_amount'            => '500000.00',
                'min_period_months'     => 6,
                'max_period_months'     => 36,
                'max_repayments'        => 36,
                'requires_guarantor'    => true,
                'requires_collateral'   => false,
                'min_membership_months' => 6,
                'processing_fee_amount' => '0.00',
                'processing_fee_percent'=> '1.00',
                'penalty_rate'          => '5.00',
                'is_active'             => true,
            ],
            [
                'name'                  => 'School Fees Loan',
                'description'           => 'Loan specifically for school fees payment.',
                'interest_rate'         => '0.50',
                'interest_method'       => 'flat',
                'repayment_frequency'   => 'monthly',
                'min_amount'            => '5000.00',
                'max_amount'            => '150000.00',
                'min_period_months'     => 1,
                'max_period_months'     => 12,
                'max_repayments'        => 12,
                'requires_guarantor'    => false,
                'requires_collateral'   => false,
                'min_membership_months' => 3,
                'processing_fee_amount' => '100.00',
                'processing_fee_percent'=> '0.00',
                'penalty_rate'          => '5.00',
                'is_active'             => true,
            ],
            [
                'name'                  => 'Super Loan',
                'description'           => 'Long-term loan for large investments; requires collateral.',
                'interest_rate'         => '1.25',
                'interest_method'       => 'reducing_balance',
                'repayment_frequency'   => 'monthly',
                'min_amount'            => '50000.00',
                'max_amount'            => '2000000.00',
                'min_period_months'     => 12,
                'max_period_months'     => 60,
                'max_repayments'        => 60,
                'requires_guarantor'    => true,
                'requires_collateral'   => true,
                'min_membership_months' => 12,
                'processing_fee_amount' => '0.00',
                'processing_fee_percent'=> '2.00',
                'penalty_rate'          => '5.00',
                'is_active'             => true,
            ],
        ];
        foreach ($loanProducts as $product) {
            LoanProduct::firstOrCreate(
                ['org_id' => $orgId, 'name' => $product['name']],
                $product
            );
        }

        // ── Saving Products ───────────────────────────────────────────────
        $savingProducts = [
            [
                'name'                => 'Regular Savings',
                'description'         => 'Standard member savings account.',
                'interest_rate'       => '3.00',
                'min_opening_balance' => '1000.00',
                'min_balance'         => '500.00',
                'max_balance'         => null,
                'min_deposit'         => '500.00',
                'max_deposit'         => null,
                'min_withdrawal'      => '100.00',
                'max_withdrawal'      => '0.00',
                'lock_in_months'      => 0,
                'withdrawal_frequency'=> 'any',
                'is_active'           => true,
            ],
            [
                'name'                => 'Fixed Deposit',
                'description'         => 'Fixed deposit account with higher interest.',
                'interest_rate'       => '7.00',
                'min_opening_balance' => '10000.00',
                'min_balance'         => '10000.00',
                'max_balance'         => null,
                'min_deposit'         => '10000.00',
                'max_deposit'         => null,
                'min_withdrawal'      => '0.00',
                'max_withdrawal'      => null,
                'lock_in_months'      => 12,
                'withdrawal_frequency'=> 'monthly',
                'is_active'           => true,
            ],
        ];
        foreach ($savingProducts as $product) {
            SavingProduct::firstOrCreate(
                ['org_id' => $orgId, 'name' => $product['name']],
                $product
            );
        }

        // ── Fiscal Year 2026 + Monthly Periods ────────────────────────────
        $fy = FiscalYear::firstOrCreate(
            ['org_id' => $orgId, 'name' => 'FY 2026'],
            [
                'start_date' => '2026-01-01',
                'end_date'   => '2026-12-31',
                'is_opened'  => true,
                'is_closed'  => false,
            ]
        );

        $monthNames = [
            1 => 'January', 2 => 'February', 3 => 'March',    4 => 'April',
            5 => 'May',     6 => 'June',     7 => 'July',      8 => 'August',
            9 => 'September',10 => 'October', 11 => 'November', 12 => 'December',
        ];
        foreach ($monthNames as $month => $monthName) {
            $start = sprintf('2026-%02d-01', $month);
            $end   = date('Y-m-t', strtotime($start));
            Period::firstOrCreate(
                ['org_id' => $orgId, 'fiscal_year_id' => $fy->id, 'name' => "$monthName 2026"],
                [
                    'start_date' => $start,
                    'end_date'   => $end,
                    'is_opened'  => ($month <= (int) date('n')),
                    'is_closed'  => false,
                    'is_posted'  => false,
                ]
            );
        }

        // ── Account Types ─────────────────────────────────────────────────
        $accountTypes = [
            ['code' => 1, 'name' => 'Assets'],
            ['code' => 2, 'name' => 'Liabilities'],
            ['code' => 3, 'name' => 'Equity'],
            ['code' => 4, 'name' => 'Income'],
            ['code' => 5, 'name' => 'Expenses'],
        ];
        $atMap = [];
        foreach ($accountTypes as $at) {
            $record = AccountType::firstOrCreate(
                ['org_id' => $orgId, 'code' => $at['code']],
                ['name' => $at['name']]
            );
            $atMap[$at['code']] = $record->id;
        }

        // ── Chart of Accounts ─────────────────────────────────────────────
        // Helper: create or find an account and return its id
        $coa = function (int $typeCode, string $code, string $name, bool $isHeader = false, ?string $parentId = null) use ($orgId, $atMap): string {
            $record = ChartOfAccount::firstOrCreate(
                ['org_id' => $orgId, 'code' => $code],
                [
                    'account_type_id' => $atMap[$typeCode],
                    'parent_id'       => $parentId,
                    'name'            => $name,
                    'is_header'       => $isHeader,
                    'is_active'       => true,
                ]
            );
            return $record->id;
        };

        // Assets (1xxx)
        $assets        = $coa(1, '1000', 'Assets',                       true);
        $currentAssets = $coa(1, '1100', 'Current Assets',               true,  $assets);
        $coa(1, '1101', 'Cash on Hand',                false, $currentAssets);
        $bankAcc       = $coa(1, '1102', 'Bank Account',                  false, $currentAssets);
        $coa(1, '1103', 'Member Contributions Receivable', false, $currentAssets);
        $loanAssets    = $coa(1, '1200', 'Loan Assets',                   true,  $assets);
        $loansRec      = $coa(1, '1201', 'Member Loans Receivable',       false, $loanAssets);
        $coa(1, '1202', 'Interest Receivable',         false, $loanAssets);
        $fixedAssets   = $coa(1, '1300', 'Fixed Assets',                  true,  $assets);
        $coa(1, '1301', 'Furniture & Equipment',       false, $fixedAssets);
        $coa(1, '1302', 'Computers & IT Equipment',    false, $fixedAssets);

        // Liabilities (2xxx)
        $liabilities   = $coa(2, '2000', 'Liabilities',                  true);
        $currentLiab   = $coa(2, '2100', 'Current Liabilities',          true,  $liabilities);
        $coa(2, '2101', 'Accounts Payable',            false, $currentLiab);
        $coa(2, '2102', 'Accrued Expenses',            false, $currentLiab);
        $memberLiab    = $coa(2, '2200', 'Member Liabilities',           true,  $liabilities);
        $memberSavings = $coa(2, '2201', 'Member Savings Deposits',      false, $memberLiab);
        $coa(2, '2202', 'Member Share Capital',        false, $memberLiab);

        // Equity (3xxx)
        $equity        = $coa(3, '3000', 'Equity',                       true);
        $coa(3, '3001', 'Institutional Capital',       false, $equity);
        $coa(3, '3002', 'Retained Earnings',           false, $equity);
        $coa(3, '3003', 'Current Year Surplus',        false, $equity);

        // Income (4xxx)
        $income        = $coa(4, '4000', 'Income',                       true);
        $intIncome     = $coa(4, '4100', 'Interest Income',              true,  $income);
        $coa(4, '4101', 'Interest on Loans',           false, $intIncome);
        $coa(4, '4102', 'Interest on Investments',     false, $intIncome);
        $feeIncome     = $coa(4, '4200', 'Fee Income',                   true,  $income);
        $coa(4, '4201', 'Loan Processing Fees',        false, $feeIncome);
        $coa(4, '4202', 'Registration Fees',           false, $feeIncome);
        $coa(4, '4203', 'Penalty & Late Fees',         false, $feeIncome);

        // Expenses (5xxx)
        $expenses      = $coa(5, '5000', 'Expenses',                     true);
        $opEx          = $coa(5, '5100', 'Operating Expenses',           true,  $expenses);
        $pettyCashExp  = $coa(5, '5101', 'Petty Cash Expenses',          false, $opEx);
        $coa(5, '5102', 'Salaries & Wages',            false, $opEx);
        $coa(5, '5103', 'Rent & Utilities',            false, $opEx);
        $coa(5, '5104', 'Office Supplies',             false, $opEx);
        $coa(5, '5105', 'Communication Expenses',      false, $opEx);
        $coa(5, '5106', 'Transport & Travel',          false, $opEx);
        $coa(5, '5107', 'Depreciation',                false, $opEx);

        // ── Activity Types ────────────────────────────────────────────────
        $activityTypes = [
            ['name' => 'Loan Disbursement',      'code' => 'LOAN_DISB',   'dr' => $loansRec,     'cr' => $bankAcc],
            ['name' => 'Loan Repayment',         'code' => 'LOAN_REP',    'dr' => $bankAcc,       'cr' => $loansRec],
            ['name' => 'Savings Deposit',        'code' => 'SAV_DEP',     'dr' => $bankAcc,       'cr' => $memberSavings],
            ['name' => 'Savings Withdrawal',     'code' => 'SAV_WD',      'dr' => $memberSavings, 'cr' => $bankAcc],
            ['name' => 'Petty Cash Expense',     'code' => 'PC_EXP',      'dr' => $pettyCashExp,  'cr' => $bankAcc],
            ['name' => 'Interest on Loans',      'code' => 'INT_LOAN',    'dr' => null,            'cr' => null],
            ['name' => 'General Journal',        'code' => 'GEN_JNL',     'dr' => null,            'cr' => null],
        ];
        foreach ($activityTypes as $at) {
            ActivityType::firstOrCreate(
                ['org_id' => $orgId, 'code' => $at['code']],
                [
                    'name'          => $at['name'],
                    'dr_account_id' => $at['dr'],
                    'cr_account_id' => $at['cr'],
                    'is_active'     => true,
                ]
            );
        }

        // ── Petty Cash Categories + Items ─────────────────────────────────
        $pcCategories = [
            'Office Supplies' => [
                ['name' => 'Pens & Pencils',    'default_price' => '150.00',  'default_units' => 1],
                ['name' => 'Printing Paper',    'default_price' => '500.00',  'default_units' => 1],
                ['name' => 'Printer Toner',     'default_price' => '2500.00', 'default_units' => 1],
                ['name' => 'Staples & Clips',   'default_price' => '80.00',   'default_units' => 1],
                ['name' => 'Envelopes',         'default_price' => '200.00',  'default_units' => 1],
            ],
            'Transport & Travel' => [
                ['name' => 'Taxi / Ride-share', 'default_price' => '500.00',  'default_units' => 1],
                ['name' => 'Fuel Reimbursement','default_price' => '1000.00', 'default_units' => 1],
                ['name' => 'Parking Fee',       'default_price' => '200.00',  'default_units' => 1],
            ],
            'Utilities & Communication' => [
                ['name' => 'Internet Bill',     'default_price' => '2000.00', 'default_units' => 1],
                ['name' => 'Airtime',           'default_price' => '500.00',  'default_units' => 1],
                ['name' => 'Electricity Top-up','default_price' => '1000.00', 'default_units' => 1],
            ],
            'Maintenance & Cleaning' => [
                ['name' => 'Cleaning Supplies', 'default_price' => '600.00',  'default_units' => 1],
                ['name' => 'Repairs (minor)',   'default_price' => '1500.00', 'default_units' => 1],
            ],
            'Refreshments' => [
                ['name' => 'Tea & Coffee',      'default_price' => '300.00',  'default_units' => 1],
                ['name' => 'Meeting Snacks',    'default_price' => '500.00',  'default_units' => 1],
                ['name' => 'Water Bottles',     'default_price' => '200.00',  'default_units' => 1],
            ],
        ];
        foreach ($pcCategories as $catName => $items) {
            $cat = PettyCashCategory::firstOrCreate(['org_id' => $orgId, 'name' => $catName]);
            foreach ($items as $item) {
                PettyCashItem::firstOrCreate(
                    ['org_id' => $orgId, 'category_id' => $cat->id, 'name' => $item['name']],
                    [
                        'default_price' => $item['default_price'],
                        'default_units' => $item['default_units'],
                    ]
                );
            }
        }

        // ── Issue Categories ──────────────────────────────────────────────
        $issueCategories = [
            ['name' => 'Loan Query',           'description' => 'Questions or issues about loan applications, approvals, or repayments.'],
            ['name' => 'Account Issue',        'description' => 'Problems with savings or deposit accounts.'],
            ['name' => 'Contribution Query',   'description' => 'Questions about monthly contribution records or payments.'],
            ['name' => 'Guarantee Request',    'description' => 'Issues related to guaranteeing another member\'s loan.'],
            ['name' => 'Withdrawal Request',   'description' => 'Request for funds withdrawal from savings account.'],
            ['name' => 'General Enquiry',      'description' => 'General questions not fitting other categories.'],
            ['name' => 'Complaint',            'description' => 'Formal complaint about SACCO services or staff.'],
            ['name' => 'System / IT Issue',    'description' => 'Technical issues with the member portal or system.'],
        ];
        foreach ($issueCategories as $cat) {
            IssueCategory::firstOrCreate(
                ['org_id' => $orgId, 'name' => $cat['name']],
                ['description' => $cat['description']]
            );
        }
    }
}
