
const API_BASE = "https://rentit-auth-kyc.onrender.com";

const form = document.getElementById("admin-login-form");

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = document.getElementById("login-message");
    const button = document.getElementById("login-button");

    message.textContent = "";
    button.disabled = true;
    button.textContent = "Signing in...";

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.value.trim(),
          password: form.password.value
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login failed.");
      }

      const token =
        result.token ||
        result.accessToken ||
        result.data?.token;

      if (!token) {
        throw new Error(
          "Login succeeded, but the token field was not found. Check the API response."
        );
      }

      // Verify the token and retrieve the actual user role.
      const meResponse = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const meResult = await meResponse.json();

      if (!meResponse.ok) {
        throw new Error("Could not verify your account.");
      }

      const user = meResult.user || meResult.data?.user || meResult;

      if (user.role !== "admin") {
        throw new Error("Access denied. An admin account is required.");
      }

      sessionStorage.setItem("renthubAdminToken", token);

      window.location.href = "renthub-admin-dashboard.html";

    } catch (error) {
      message.textContent = error.message;
    } finally {
      button.disabled = false;
      button.textContent = "Sign in";
    }
  });
}
