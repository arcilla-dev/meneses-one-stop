import { Suspense } from "react";
import ScholarshipProgramsContent from "./ScholarshipProgramsContent";

export default function Page() {
    return (
        <Suspense fallback={null}>
            <ScholarshipProgramsContent />
        </Suspense>
    );
}