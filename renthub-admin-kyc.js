
const KYC_API = "https://rentit-auth-kyc.onrender.com/api/kyc";

async function loadKYCApplications() {
  const tableBody = document.getElementById("kyc-table-body");
  const token = sessionStorage.getItem("renthubAdminToken");

  if (!tableBody) return;

  if (!token) {
    tableBody.innerHTML = `
      <tr><td colspan="5">Please log in as an admin first.</td></tr>
    `;
    return;
  }

  tableBody.innerHTML = `
    <tr><td colspan="5">Loading KYC applications...</td></tr>
  `;

  try {
    const response = await fetch(KYC_API, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Unable to load KYC applications.");
    }

    // The API response we've tested contains a "kyc" array.
    const applications = result.kyc;

    if (!Array.isArray(applications)) {
      throw new Error("Unexpected API response: KYC list not found.");
    }

    if (applications.length === 0) {
      tableBody.innerHTML = `
        <tr><td colspan="5">No KYC applications found.</td></tr>
      `;
      return;
    }

    tableBody.innerHTML = applications.map((application) => {
      const user = application.user || {};
      const name = user.name || "Unknown user";
      const initials = name
        .split(/\s+/)
        .map(part => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      const submitted = application.createdAt
        ? new Date(application.createdAt).toLocaleDateString()
        : "—";

      const status = application.status || "under_review";
      const documentType = (application.documentType || "unknown")
        .replaceAll("_", " ");

      const badgeClass = {
        under_review: "yellow",
        verified: "green",
        rejected: "red"
      }[status] || "yellow";

      return `
        <tr data-row data-role="${user.role || ""}">
          <td>
            <div class="user-cell">
              <span class="initial">${initials}</span>
              <span>${escapeHTML(name)}</span>
            </div>
          </td>
          <td>${escapeHTML(documentType)}</td>
          <td>${escapeHTML(submitted)}</td>
          <td>
            <span class="badge ${badgeClass}">
              ${escapeHTML(status.replaceAll("_", " "))}
            </span>
          </td>
          <td>
            <button type="button"
              onclick="verifyKYC('${application._id}')"
              ${status !== "under_review" ? "disabled" : ""}>
              Verify
            </button>

            <button type="button"
              onclick="rejectKYC('${application._id}')"
              ${status !== "under_review" ? "disabled" : ""}>
              Reject
            </button>
          </td>
        </tr>
      `;
    }).join("");

  } catch (error) {
    console.error("KYC loading error:", error);
    tableBody.innerHTML = `
      <tr><td colspan="5">${escapeHTML(error.message)}</td></tr>
    `;
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

async function updateKYC(applicationId, action, body = {}) {
  const token = sessionStorage.getItem("renthubAdminToken");

  if (!token) {
    alert("Please log in again.");
    return;
  }

  try {
    const response = await fetch(
      `${KYC_API}/${encodeURIComponent(applicationId)}/${action}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "KYC update failed.");
    }

    alert(result.message || "KYC application updated.");
    await loadKYCApplications();

  } catch (error) {
    alert(error.message);
  }
}

function verifyKYC(id) {
  if (confirm("Verify this KYC application?")) {
    updateKYC(id, "verify");
  }
}

function rejectKYC(id) {
  const reason = prompt("Enter the reason for rejecting this application:");

  if (reason && reason.trim()) {
    updateKYC(id, "reject", { reason: reason.trim() });
  }
}

document.addEventListener("DOMContentLoaded", loadKYCApplications);
