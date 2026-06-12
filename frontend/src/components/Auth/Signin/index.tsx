import { Suspense } from "react";
import SigninWithPassword from "../SigninWithPassword";

export default function Signin() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SigninWithPassword />
    </Suspense>
  );
}
