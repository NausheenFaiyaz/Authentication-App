const API_BASE = "/api/auth";

const ui = {
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  logoutButton: document.getElementById("logoutButton"),
  refreshUserButton: document.getElementById("refreshUserButton"),
  loginButton: document.getElementById("loginButton"),
  registerButton: document.getElementById("registerButton"),
  messageBox: document.getElementById("messageBox"),
  userOutput: document.getElementById("userOutput"),
  heroTitle: document.getElementById("heroTitle"),
  statusText: document.getElementById("statusText"),
  tabButtons: document.querySelectorAll(".tab-button"),
  loginPanel: document.getElementById("loginPanel"),
  registerPanel: document.getElementById("registerPanel"),
};

function setMessage(text, type = "") {
  ui.messageBox.textContent = text;
  ui.messageBox.classList.remove("success", "error");
  if (type) ui.messageBox.classList.add(type);
}

function setStatus(text) {
  ui.statusText.textContent = text;
}

function setBusyState(isBusy, button) {
  button.disabled = isBusy;
  ui.logoutButton.disabled = isBusy;
  ui.refreshUserButton.disabled = isBusy;
  ui.tabButtons.forEach((tab) => {
    tab.disabled = isBusy;
  });
}

function isValidLowercaseUsername(username) {
  return /^[a-z0-9_]+$/.test(username);
}

async function request(endpoint, method = "GET", body) {
  const options = {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}/${endpoint}`, options);
  const data = await response.json();

  if (!response.ok || data.success === false) {
    const details =
      data?.errors?.map((item) => item?.message || item).filter(Boolean).join(" | ") || "";
    const message = details || data.message || "Something went wrong.";
    throw new Error(message);
  }

  return data;
}

function formatUserOutput(data) {
  if (!data) return "No active session yet.";
  return JSON.stringify(data, null, 2);
}

async function loadCurrentUser(showToast = false) {
  try {
    const data = await request("current-user");
    ui.userOutput.textContent = formatUserOutput(data.data || data);
    setStatus("Session is active.");
    if (showToast) setMessage("Current user fetched successfully.", "success");
  } catch (error) {
    ui.userOutput.textContent = "No active session yet.";
    setStatus("Not logged in.");
    if (showToast) setMessage(error.message, "error");
  }
}

function switchTab(tabName) {
  const isLogin = tabName === "login";
  ui.loginPanel.classList.toggle("hidden", !isLogin);
  ui.registerPanel.classList.toggle("hidden", isLogin);
  ui.heroTitle.innerHTML = isLogin
    ? "Welcome,<br />sign in to continue"
    : "Welcome,<br />sign up to continue";

  ui.tabButtons.forEach((tab) => {
    const active = tab.dataset.tab === tabName;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
}

ui.tabButtons.forEach((tab) => {
  tab.addEventListener("click", () => {
    switchTab(tab.dataset.tab);
    setMessage("");
  });
});

ui.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setBusyState(true, ui.registerButton);
  setMessage("Creating account...");
  setStatus("Registering...");

  const formData = new FormData(ui.registerForm);
  const payload = {
    email: formData.get("email")?.toString().trim(),
    username: formData.get("username")?.toString().trim(),
    password: formData.get("password")?.toString(),
    role: formData.get("role")?.toString(),
  };

  if (!payload.email || !payload.username || !payload.password || !payload.role) {
    setMessage("Please fill all register fields.", "error");
    setStatus("Registration failed.");
    setBusyState(false, ui.registerButton);
    return;
  }

  if (payload.username.includes(" ")) {
    setMessage("Username cannot contain spaces.", "error");
    setStatus("Registration failed.");
    setBusyState(false, ui.registerButton);
    return;
  }

  if (!isValidLowercaseUsername(payload.username)) {
    setMessage(
      "Username must be lowercase only (letters, numbers, underscore).",
      "error"
    );
    setStatus("Registration failed.");
    setBusyState(false, ui.registerButton);
    return;
  }

  try {
    const data = await request("register", "POST", payload);
    setMessage("Registration successful. You can login now.", "success");
    setStatus("Account created.");
    ui.registerForm.reset();
    if (data?.data?.accessToken || data?.data?.token) {
      await loadCurrentUser();
    } else {
      switchTab("login");
    }
  } catch (error) {
    setMessage(`Registration failed: ${error.message}`, "error");
    setStatus("Registration failed.");
  } finally {
    setBusyState(false, ui.registerButton);
  }
});

ui.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setBusyState(true, ui.loginButton);
  setMessage("Signing in...");
  setStatus("Logging in...");

  const formData = new FormData(ui.loginForm);
  const payload = {
    username: formData.get("username")?.toString().trim(),
    password: formData.get("password")?.toString(),
  };

  if (!payload.username || !payload.password) {
    setMessage("Please enter username and password.", "error");
    setStatus("Login failed.");
    setBusyState(false, ui.loginButton);
    return;
  }

  if (payload.username.includes(" ")) {
    setMessage("Username cannot contain spaces.", "error");
    setStatus("Login failed.");
    setBusyState(false, ui.loginButton);
    return;
  }

  if (!isValidLowercaseUsername(payload.username)) {
    setMessage(
      "Username must be lowercase only (letters, numbers, underscore).",
      "error"
    );
    setStatus("Login failed.");
    setBusyState(false, ui.loginButton);
    return;
  }

  try {
    await request("login", "POST", payload);
    setMessage("Login successful.", "success");
    setStatus("Login complete.");
    ui.loginForm.reset();
    await loadCurrentUser();
  } catch (error) {
    setMessage(`Login failed: ${error.message}`, "error");
    setStatus("Login failed.");
  } finally {
    setBusyState(false, ui.loginButton);
  }
});

ui.logoutButton.addEventListener("click", async () => {
  setBusyState(true, ui.logoutButton);
  setMessage("Logging out...");
  setStatus("Ending session...");

  try {
    await request("logout", "POST");
    ui.userOutput.textContent = "No active session yet.";
    setMessage("Logged out successfully.", "success");
    setStatus("Logged out.");
  } catch (error) {
    setMessage(error.message, "error");
    setStatus("Logout failed.");
  } finally {
    setBusyState(false, ui.logoutButton);
  }
});

ui.refreshUserButton.addEventListener("click", async () => {
  setBusyState(true, ui.refreshUserButton);
  setMessage("Refreshing user...");
  await loadCurrentUser(true);
  setBusyState(false, ui.refreshUserButton);
});

loadCurrentUser();
