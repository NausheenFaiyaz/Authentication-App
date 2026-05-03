const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const USERS_BASE = "https://api.freeapi.app/api/v1/users";

app.use(express.json());
app.use(cookieParser());
app.use(express.static(__dirname));

function getAuthHeaders(req) {
  const headers = {
    accept: "application/json",
    "content-type": "application/json",
  };

  if (req.cookies.accessToken) {
    headers.authorization = `Bearer ${req.cookies.accessToken}`;
  }

  return headers;
}

function extractTokens(data) {
  return {
    accessToken: data?.data?.accessToken || data?.accessToken || "",
    refreshToken: data?.data?.refreshToken || data?.refreshToken || "",
  };
}

function setTokenCookies(res, tokens) {
  if (tokens.accessToken) {
    res.cookie("accessToken", tokens.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    });
  }

  if (tokens.refreshToken) {
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
  }
}

async function upstreamRequest(endpoint, method, body, req) {
  const response = await fetch(`${USERS_BASE}/${endpoint}`, {
    method,
    headers: getAuthHeaders(req),
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try {
    data = await response.json();
  } catch (_error) {
    data = { success: false, message: "Invalid JSON from upstream API." };
  }

  return { status: response.status, data };
}

async function loginWithFallbacks(req) {
  const payload = req.body || {};
  const endpoints = ["login", "login-user", "signin"];

  for (const endpoint of endpoints) {
    const result = await upstreamRequest(endpoint, "POST", payload, req);
    if (result.status !== 404) return result;
  }

  return {
    status: 404,
    data: {
      success: false,
      message: "No valid login endpoint found on upstream API.",
    },
  };
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const result = await upstreamRequest("register", "POST", req.body, req);
    setTokenCookies(res, extractTokens(result.data));
    res.status(result.status).json(result.data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const result = await loginWithFallbacks(req);
    setTokenCookies(res, extractTokens(result.data));
    res.status(result.status).json(result.data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    const result = await upstreamRequest("logout", "POST", null, req);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(result.status).json(result.data);
  } catch (error) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/auth/current-user", async (req, res) => {
  try {
    let result = await upstreamRequest("current-user", "GET", null, req);

    if (result.status === 401 && req.cookies.refreshToken) {
      const refreshResult = await fetch(`${USERS_BASE}/refresh-token`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({ refreshToken: req.cookies.refreshToken }),
      });

      const refreshData = await refreshResult.json();
      setTokenCookies(res, extractTokens(refreshData));

      if (refreshResult.ok) {
        result = await upstreamRequest("current-user", "GET", null, req);
      }
    }

    res.status(result.status).json(result.data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
