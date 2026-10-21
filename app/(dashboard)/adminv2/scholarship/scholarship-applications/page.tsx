import { Suspense } from "react";
import ScholarshipApplicationsContent from "./ScholarshipApplicationsContent";

export default function Page() {
    return (
        <Suspense fallback={null}>
            <ScholarshipApplicationsContent />
        </Suspense>
    );
}