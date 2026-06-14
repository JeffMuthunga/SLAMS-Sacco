<?php

use App\Http\Controllers\Api\V1\AccountController;
use App\Http\Controllers\Api\V1\AdminDashboardController;
use App\Http\Controllers\Api\V1\AccountTransactionController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\PasswordResetController;
use App\Http\Controllers\Api\V1\ContributionController;
use App\Http\Controllers\Api\V1\JournalController;
use App\Http\Controllers\Api\V1\LoanController;
use App\Http\Controllers\Api\V1\LoanRepaymentController;
use App\Http\Controllers\Api\V1\MemberController;
use App\Http\Controllers\Api\V1\MemberExitController;
use App\Http\Controllers\Api\V1\MemberPortalController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\IssueController;
use App\Http\Controllers\Api\V1\PettyCashAllocationController;
use App\Http\Controllers\Api\V1\PettyCashRequestController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::middleware('throttle:5,1')->group(function () {
            Route::post('login',            [AuthController::class, 'login']);
            Route::post('register',         [AuthController::class, 'register']);
            Route::post('forgot-password',  [PasswordResetController::class, 'forgotPassword']);
            Route::post('reset-password',   [PasswordResetController::class, 'resetPassword']);
        });

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('me',      [AuthController::class, 'me']);
            Route::put('profile', [AuthController::class, 'updateProfile']);
            Route::post('logout', [AuthController::class, 'logout']);
        });
    });

    Route::middleware(['auth:sanctum', 'permission:manage_members'])->group(function () {
        // archived + action routes BEFORE apiResource so "archived" is never treated as a UUID
        Route::get('members/archived',          [MemberController::class, 'archived']);
        Route::post('members/{member}/restore', [MemberController::class, 'restore']);
        Route::post('members/{member}/photo',   [MemberController::class, 'uploadPhoto']);
        Route::post('members/{member}/approve', [MemberController::class, 'approve']);
        Route::post('members/{member}/reject',  [MemberController::class, 'reject']);
        Route::apiResource('members', MemberController::class);
    });

    Route::middleware(['auth:sanctum', 'permission:manage_members'])->group(function () {
        Route::post('member-exits/{memberExit}/approve', [MemberExitController::class, 'approve']);
        Route::post('member-exits/{memberExit}/reject',  [MemberExitController::class, 'reject']);
        Route::apiResource('member-exits', MemberExitController::class)->only(['index', 'show', 'store']);
    });

    Route::middleware(['auth:sanctum', 'permission:manage_accounts'])->group(function () {
        Route::get('accounts/{account}/statement',  [AccountController::class, 'statement']);
        Route::post('accounts/{account}/approve',   [AccountController::class, 'approve']);
        Route::post('accounts/{account}/reject',    [AccountController::class, 'reject']);
        Route::apiResource('accounts', AccountController::class);
        Route::apiResource('account-transactions', AccountTransactionController::class)->only(['index', 'show', 'store']);
    });

    Route::middleware(['auth:sanctum', 'permission:manage_loans'])->group(function () {
        Route::post('loans/{loan}/approve',      [LoanController::class, 'approve']);
        Route::post('loans/{loan}/reject',       [LoanController::class, 'reject']);
        Route::post('loans/{loan}/disburse',     [LoanController::class, 'disburse']);
        Route::post('loans/{loan}/default',      [LoanController::class, 'markDefaulted']);
        Route::post('loans/{loan}/notes',        [LoanController::class, 'addNote']);
        Route::post('loans/{loan}/repayments/{repayment}/pay', [LoanRepaymentController::class, 'store']);
        Route::get('loans/{loan}/repayments',    [LoanRepaymentController::class, 'index']);
        Route::get('loan-repayments',            [LoanRepaymentController::class, 'index']);
        Route::apiResource('loans', LoanController::class)->except(['update']);
    });

    Route::middleware(['auth:sanctum', 'permission:manage_contributions'])->group(function () {
        Route::post('contributions/generate',            [ContributionController::class, 'generate']);
        Route::post('contributions/{contribution}/pay',  [ContributionController::class, 'pay']);
        Route::post('contributions/{contribution}/waive',[ContributionController::class, 'waive']);
        Route::apiResource('contributions', ContributionController::class)->only(['index', 'show']);
    });

    Route::middleware(['auth:sanctum', 'permission:manage_configurations'])->prefix('configurations')->group(function () {
        Route::get('org', [\App\Http\Controllers\Api\V1\Configurations\OrgController::class, 'show']);
        Route::put('org', [\App\Http\Controllers\Api\V1\Configurations\OrgController::class, 'update']);
        Route::post('org/logo', [\App\Http\Controllers\Api\V1\Configurations\OrgController::class, 'uploadLogo']);

        Route::apiResource('currencies', \App\Http\Controllers\Api\V1\Configurations\CurrencyController::class)->except(['show']);

        Route::post('fiscal-years/{fiscal_year}/close', [\App\Http\Controllers\Api\V1\Configurations\FiscalYearController::class, 'close']);
        Route::apiResource('fiscal-years', \App\Http\Controllers\Api\V1\Configurations\FiscalYearController::class)->except(['show', 'destroy']);

        Route::patch('periods/{period}/status', [\App\Http\Controllers\Api\V1\Configurations\PeriodController::class, 'updateStatus']);

        Route::apiResource('collateral-types', \App\Http\Controllers\Api\V1\Configurations\CollateralTypeController::class);
        Route::apiResource('activity-types',   \App\Http\Controllers\Api\V1\Configurations\ActivityTypeController::class);
        Route::apiResource('banks',            \App\Http\Controllers\Api\V1\Configurations\BankController::class);
        Route::apiResource('departments',      \App\Http\Controllers\Api\V1\Configurations\DepartmentController::class);
        Route::apiResource('eligible-employers', \App\Http\Controllers\Api\V1\Configurations\EligibleEmployerController::class);

        Route::get('sacco-settings', [\App\Http\Controllers\Api\V1\Configurations\SaccoSettingsController::class, 'show']);
        Route::put('sacco-settings', [\App\Http\Controllers\Api\V1\Configurations\SaccoSettingsController::class, 'update']);

        Route::apiResource('bank-accounts',       \App\Http\Controllers\Api\V1\Configurations\BankAccountController::class)->except(['show']);
        Route::apiResource('loan-products',       \App\Http\Controllers\Api\V1\Configurations\LoanProductController::class);
        Route::apiResource('saving-products',     \App\Http\Controllers\Api\V1\Configurations\SavingProductController::class);
        Route::apiResource('account-types',         \App\Http\Controllers\Api\V1\Configurations\AccountTypeController::class)->except(['show']);
        Route::apiResource('chart-of-accounts',     \App\Http\Controllers\Api\V1\Configurations\ChartOfAccountController::class)->except(['show']);
        Route::apiResource('petty-cash-categories', \App\Http\Controllers\Api\V1\Configurations\PettyCashCategoryController::class)->except(['show']);
        Route::apiResource('petty-cash-items',      \App\Http\Controllers\Api\V1\Configurations\PettyCashItemController::class)->except(['show']);
        Route::apiResource('issue-categories',      \App\Http\Controllers\Api\V1\Configurations\IssueCategoryController::class)->except(['show']);
    });

    Route::middleware(['auth:sanctum', 'permission:manage_journals'])->group(function () {
        Route::get('ledger',                        [JournalController::class, 'ledger']);
        Route::post('journals/{journal}/post',      [JournalController::class, 'post']);
        Route::post('journals/{journal}/reverse',   [JournalController::class, 'reverse']);
        Route::apiResource('journals', JournalController::class)->except(['update']);
    });

    Route::middleware(['auth:sanctum', 'permission:manage_issues'])->group(function () {
        Route::post('issues/{issue}/comments', [IssueController::class, 'addComment']);
        Route::apiResource('issues', IssueController::class);
    });

    Route::middleware(['auth:sanctum', 'permission:manage_petty_cash'])->group(function () {
        Route::post('petty-cash-allocations/{pettyCashAllocation}/approve', [PettyCashAllocationController::class, 'approve']);
        Route::post('petty-cash-allocations/{pettyCashAllocation}/reject',  [PettyCashAllocationController::class, 'reject']);
        Route::apiResource('petty-cash-allocations', PettyCashAllocationController::class)->except(['update']);

        Route::post('petty-cash-requests/{pettyCashRequest}/approve', [PettyCashRequestController::class, 'approve']);
        Route::post('petty-cash-requests/{pettyCashRequest}/reject',  [PettyCashRequestController::class, 'reject']);
        Route::apiResource('petty-cash-requests', PettyCashRequestController::class)->except(['update']);
    });

    // Public org branding — any authenticated user (admins + members)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('org/branding', [\App\Http\Controllers\Api\V1\Configurations\OrgController::class, 'branding']);
    });

    // Admin dashboard
    Route::middleware(['auth:sanctum', 'permission:manage_members'])->group(function () {
        Route::get('admin/dashboard', [AdminDashboardController::class, 'stats']);
    });

    // Reports — accessible to any authenticated admin (permission: manage_members or above)
    Route::middleware(['auth:sanctum', 'permission:manage_members'])->prefix('reports')->group(function () {
        Route::get('members',      [ReportController::class, 'members']);
        Route::get('loans',        [ReportController::class, 'loans']);
        Route::get('contributions',[ReportController::class, 'contributions']);
        Route::get('accounts',     [ReportController::class, 'accounts']);
        Route::get('transactions', [ReportController::class, 'transactions']);
        Route::get('issues',       [ReportController::class, 'issues']);
        Route::get('petty-cash',   [ReportController::class, 'pettyCash']);
    });

    // Member portal — scoped to the authenticated user's member record
    Route::middleware('auth:sanctum')->prefix('me')->group(function () {
        Route::get('dashboard',      [MemberPortalController::class, 'dashboard']);
        Route::get('profile',        [MemberPortalController::class, 'profile']);
        Route::get('accounts',       [MemberPortalController::class, 'accounts']);
        Route::get('accounts/{accountId}/statement', [MemberPortalController::class, 'accountStatement']);
        Route::get('loans',          [MemberPortalController::class, 'loans']);
        Route::get('loans/{loanId}', [MemberPortalController::class, 'loanDetail']);
        Route::get('contributions',  [MemberPortalController::class, 'contributions']);
        Route::get('guarantees',     [MemberPortalController::class, 'guarantees']);
        Route::get('issues',         [MemberPortalController::class, 'issues']);
        Route::post('issues',        [MemberPortalController::class, 'createIssue']);
        Route::post('issues/{issueId}/comments', [MemberPortalController::class, 'addIssueComment']);
        Route::get('transactions',   [MemberPortalController::class, 'allTransactions']);
        Route::get('petty-cash/allocations', [MemberPortalController::class, 'myAllocations']);
        Route::get('petty-cash/requests',    [MemberPortalController::class, 'myRequests']);
    });
});
