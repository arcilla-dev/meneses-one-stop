import { Suspense } from "react";
import DocumentRequestsContent from "./DocumentRequestsContent";

export default function Page() {
    return (
        <Suspense fallback={null}>
            <DocumentRequestsContent />
        </Suspense>
    );
}