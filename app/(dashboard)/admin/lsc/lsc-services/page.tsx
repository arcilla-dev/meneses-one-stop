import { Suspense } from "react";
import LscServicesContent from "./LscServicesContent";

export default function Page() {
    return (
        <Suspense fallback={null}>
            <LscServicesContent />
        </Suspense>
    );
}