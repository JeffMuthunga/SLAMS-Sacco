"use client";

import { Sidebar } from ".";
import { MEMBER_NAV_DATA } from "./data";

// Client wrapper so server layouts don't have to pass nav data
// (icons are functions and can't cross the server→client boundary).
export function MemberSidebar() {
  return <Sidebar navData={MEMBER_NAV_DATA} />;
}
