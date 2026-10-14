"use client";

import { useState } from "react";
import type { PrintRequest, PrintRequestDraft } from "../../../lib/lscData";
import FeaturedServices from "./FeaturedService";
import PrintRequestForm from "./PrintRequestForm";

interface ServicesTabProps {
  printRequests: PrintRequest[];
  onSubmit: (draft: PrintRequestDraft) => Promise<PrintRequest>;
}

export default function ServicesTab({ printRequests, onSubmit }: ServicesTabProps) {
  const [successNumber, setSuccessNumber] = useState("");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        {successNumber && (
          <p
            role="status"
            className="mb-4 rounded-md border border-green-300 bg-green-50 p-4 text-sm font-semibold text-green-900"
          >
            Your print request {successNumber} has been submitted. Wait for the
            update in My Requests.
          </p>
        )}
        <PrintRequestForm
          printRequests={printRequests}
          onSubmit={onSubmit}
          onRequestAdded={setSuccessNumber}
        />
      </div>
      <FeaturedServices />
    </div>
  );
}