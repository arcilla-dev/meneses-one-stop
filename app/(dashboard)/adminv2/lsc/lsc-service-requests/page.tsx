import { Suspense } from "react";
import ServiceRequestsContent from "./ServiceRequestsContent";

export default function Page() {
    return (
        <Suspense fallback={<div>Loading service requests...</div>}>
            <ServiceRequestsContent />
        </Suspense>
    );
}