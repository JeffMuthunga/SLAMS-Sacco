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
    label: "CONFIGURATIONS",
    items: [
      {
        title: "Configurations",
        icon: Icons.FourCircle,
        items: [
          { title: "Org Profile", url: "/admin/configurations/org-profile" },
          { title: "SACCO Settings", url: "/admin/configurations/sacco-settings" },
          { title: "Currencies", url: "/admin/configurations/currencies" },
          { title: "Loan Products", url: "/admin/configurations/loan-products" },
          { title: "Saving Products", url: "/admin/configurations/saving-products" },
          { title: "Collateral Types", url: "/admin/configurations/collateral-types" },
          { title: "Activity Types", url: "/admin/configurations/activity-types" },
          { title: "Banks", url: "/admin/configurations/banks" },
          { title: "Bank Accounts", url: "/admin/configurations/bank-accounts" },
          { title: "Departments", url: "/admin/configurations/departments" },
          { title: "Fiscal Years", url: "/admin/configurations/fiscal-years" },
          { title: "Chart of Accounts", url: "/admin/chart-of-accounts" },
        ],
      },
    ],
  },
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
          { title: "All Loans", url: "/admin/loans" },
          { title: "New Application", url: "/admin/loans/create" },
        ],
      },
      {
        title: "Transactions",
        icon: Icons.PieChart,
        items: [
          { title: "Deposit Accounts", url: "/admin/accounts" },
          { title: "Contributions", url: "/admin/contributions" },
          { title: "SACCO Core Accounts", url: "/admin/transactions/core-accounts" },
          { title: "Other Accounts", url: "/admin/transactions/other" },
        ],
      },
      {
        title: "Operations",
        icon: Icons.FourCircle,
        items: [
          { title: "Journals", url: "/admin/journals" },
          { title: "Transactions Ledger", url: "/admin/ledger" },
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
