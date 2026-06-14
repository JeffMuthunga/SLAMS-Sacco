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
          { title: "Eligible Employers", url: "/admin/configurations/eligible-employers" },
          { title: "Fiscal Years", url: "/admin/configurations/fiscal-years" },
          { title: "Chart of Accounts", url: "/admin/chart-of-accounts" },
          { title: "Share Products", url: "/admin/configurations/share-products" },
          { title: "Petty Cash Categories", url: "/admin/configurations/petty-cash-categories" },
          { title: "Issue Categories", url: "/admin/configurations/issue-categories" },
          { title: "Commodity Types", url: "/admin/configurations/commodity-types" },
          { title: "Commodities", url: "/admin/configurations/commodities" },
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
          { title: "Member Shares", url: "/admin/shares" },
          { title: "Dividends", url: "/admin/dividends" },
        ],
      },
      {
        title: "Operations",
        icon: Icons.FourCircle,
        items: [
          { title: "Journals", url: "/admin/journals" },
          { title: "Transactions Ledger", url: "/admin/ledger" },
          { title: "Petty Cash", url: "/admin/petty-cash" },
          { title: "Commodity Requests", url: "/admin/commodity-requests" },
          { title: "Issue Tracking", url: "/admin/issues" },
        ],
      },
      {
        title: "Administration",
        icon: Icons.Alphabet,
        items: [
          { title: "Member Exit", url: "/admin/member-exit" },
          { title: "Import Data", url: "/admin/import" },
          { title: "Profile Settings", url: "/admin/profile" },
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
        title: "Profile Settings",
        url: "/member/profile",
        icon: Icons.Authentication,
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
          { title: "Commodities", url: "/member/service-desk/commodities" },
          { title: "Commodity Requests", url: "/member/service-desk/commodity-requests" },
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
          { title: "Dividends", url: "/member/account-statement/dividends" },
        ],
      },
      {
        title: "My Shares",
        url: "/member/shares",
        icon: Icons.Table,
        items: [],
      },
    ],
  },
];

// Default nav used when the Sidebar gets no navData prop (admin portal).
export const NAV_DATA = ADMIN_NAV_DATA;
