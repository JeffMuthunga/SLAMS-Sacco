import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Statement",
};

export default function AccountStatementPage() {
  return (
    <div>
      <h1 className="text-heading-5 font-bold text-dark dark:text-white">
        Account Statement
      </h1>
      <p className="mt-2 text-dark-4 dark:text-dark-6">
        Transactions A/C and Contributions statements will appear here.
      </p>
    </div>
  );
}
