"use client";

import { useState } from "react";
import FeaturedServices from "./FeaturedServices";
import PrintRequestForm from "./PrintRequestForm";

export default function ServicesTab({ printRequests, addPrintRequest }) {
  const [successMessage, setSuccessMessage] = useState("");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        {successMessage && (
          <p
            role="status"
            className="mb-4 rounded-md border border-green-300 bg-green-50 p-4 text-sm font-semibold text-green-900"
          >
            Your print request {successMessage} has been submitted. Wait for the
            update in My Requests.
          </p>
        )}
        <PrintRequestForm
          printRequests={printRequests}
          addPrintRequest={addPrintRequest}
          onRequestAdded={setSuccessMessage}
        />
      </div>
      <FeaturedServices />
    </div>
  );
}
