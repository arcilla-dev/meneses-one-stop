import { Suspense } from "react";
import AddRemoveSubjectsContent from "./AddRemoveSubjectsContent";

export default function Page() {
    return (
        <Suspense fallback={null}>
            <AddRemoveSubjectsContent />
        </Suspense>
    );
}