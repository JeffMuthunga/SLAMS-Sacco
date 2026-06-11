import * as Icons from "../icons";

export interface NavSubItem {
  title: string;
  url: string;
}

export interface NavItem {
  title: string;
  url?: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
  items: NavSubItem[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const ADMIN_NAV_DATA: NavSection[] = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        url: "/admin/dashboard",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "Members",
        icon: Icons.User,
        items: [
          { title: "Members", url: "/admin/members" },
          { title: "Archived Members", url: "/admin/members/archived" },
        ],
      },
      {
        title: "Loans",
        icon: Icons.Table,
        items: [
          { title: "Active Loans", url: "/admin/loans/active" },
          { title: "Applied Loans", url: "/admin/loans/applied" },
          { title: "Re-Paid Loans", url: "/admin/loans/repaid" },
          { title: "Rejected Loans", url: "/admin/loans/rejected" },
          { title: "Defaulted Loans", url: "/admin/loans/defaulted" },
          { title: "Draft Loans", url: "/admin/loans/draft" },
          { title: "Member Loans Desk", url: "/admin/loans/desk" },
        ],
      },
      {
        title: "Loan Approval",
        icon: Icons.Authentication,
        items: [
          { title: "Applied Loans", url: "/admin/loan-approval/queue" },
          { title: "Disbursement", url: "/admin/loan-approval/disbursement" },
        ],
      },
      {
        title: "Transactions",
        icon: Icons.PieChart,
        items: [
          { title: "SACCO Core Accounts", url: "/admin/transactions/core-accounts" },
          { title: "Transaction Accounts", url: "/admin/transactions/accounts" },
          { title: "Contribution Accounts", url: "/admin/transactions/contributions" },
          { title: "Other Accounts", url: "/admin/transactions/other" },
        ],
      },
      {
        title: "Operations",
        icon: Icons.FourCircle,
        items: [
          { title: "Transactions Ledger", url: "/admin/operations/ledger" },
          { title: "Fiscal Years", url: "/admin/operations/fiscal-years" },
          { title: "Journals", url: "/admin/operations/journals" },
          { title: "Emails & News", url: "/admin/operations/emails-news" },
          { title: "Petty Cash", url: "/admin/operations/petty-cash" },
          { title: "Issue Tracking", url: "/admin/operations/issues" },
        ],
      },
      {
        title: "Processing",
        icon: Icons.Calendar,
        items: [{ title: "Periods", url: "/admin/processing/periods" }],
      },
      {
        title: "Administration",
        icon: Icons.Alphabet,
        items: [
          { title: "SACCO Entities", url: "/admin/administration/entities" },
          { title: "Loan Configs", url: "/admin/administration/loan-configs" },
          { title: "Approvals", url: "/admin/administration/approvals" },
          { title: "Member Exit", url: "/admin/administration/member-exit" },
          { title: "Error Messages", url: "/admin/administration/errors" },
        ],
      },
      {
        title: "Configurations",
        icon: Icons.FourCircle,
        items: [
          { title: "Products", url: "/admin/configurations/products" },
          { title: "Commodities", url: "/admin/configurations/commodities" },
          { title: "SACCO Definitions", url: "/admin/configurations/definitions" },
          { title: "SMS / Emails / News", url: "/admin/configurations/communications" },
          { title: "Items", url: "/admin/configurations/items" },
          { title: "Chart of Accounts", url: "/admin/configurations/chart-of-accounts" },
          { title: "Workflows", url: "/admin/configurations/workflows" },
        ],
      },
      {
        title: "Reports",
        icon: Icons.PieChart,
        items: [
          { title: "SACCO Reports", url: "/admin/reports/sacco" },
          { title: "Operations Reports", url: "/admin/reports/operations" },
        ],
      },
    ],
  },
  {
    // Template demo pages kept as living component reference — remove before production
    label: "TEMPLATE REFERENCE",
    items: [
      {
        title: "Calendar",
        url: "/admin/calendar",
        icon: Icons.Calendar,
        items: [],
      },
      {
        title: "Profile",
        url: "/admin/profile",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Forms",
        icon: Icons.Alphabet,
        items: [
          { title: "Form Elements", url: "/admin/forms/form-elements" },
          { title: "Form Layout", url: "/admin/forms/form-layout" },
        ],
      },
      {
        title: "Tables",
        icon: Icons.Table,
        items: [{ title: "Tables", url: "/admin/tables" }],
      },
      {
        title: "Settings",
        icon: Icons.Alphabet,
        items: [{ title: "Settings", url: "/admin/pages/settings" }],
      },
      {
        title: "Charts",
        icon: Icons.PieChart,
        items: [{ title: "Basic Chart", url: "/admin/charts/basic-chart" }],
      },
      {
        title: "UI Elements",
        icon: Icons.FourCircle,
        items: [
          { title: "Alerts", url: "/admin/ui-elements/alerts" },
          { title: "Buttons", url: "/admin/ui-elements/buttons" },
        ],
      },
    ],
  },
];

export const MEMBER_NAV_DATA: NavSection[] = [
  {
    label: "MEMBER PORTAL",
    items: [
      {
        title: "Dashboard",
        url: "/member/dashboard",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "My Details",
        url: "/member/my-details",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Guarantee",
        icon: Icons.Authentication,
        items: [
          { title: "Guarantee Requests", url: "/member/guarantees/requests" },
          { title: "Active Guarantees", url: "/member/guarantees/active" },
          { title: "Closed Guarantees", url: "/member/guarantees/closed" },
        ],
      },
      {
        title: "Petty Cash Request",
        icon: Icons.Table,
        items: [
          { title: "Requests", url: "/member/petty-cash/requests" },
          { title: "Allocations", url: "/member/petty-cash/allocations" },
        ],
      },
      {
        title: "Service Desk",
        icon: Icons.FourCircle,
        items: [
          { title: "My Accounts", url: "/member/service-desk/accounts" },
          { title: "Loans", url: "/member/service-desk/loans" },
          { title: "My Commodities", url: "/member/service-desk/commodities" },
          { title: "Transfers", url: "/member/service-desk/transfers" },
          { title: "Issue Tracking", url: "/member/service-desk/issues" },
        ],
      },
      {
        title: "Account Statement",
        icon: Icons.PieChart,
        items: [
          { title: "Transactions A/C", url: "/member/account-statement/transactions" },
          { title: "Contributions", url: "/member/account-statement/contributions" },
        ],
      },
    ],
  },
];

// Default nav used when the Sidebar gets no navData prop (admin portal).
export const NAV_DATA = ADMIN_NAV_DATA;
