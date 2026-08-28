import API_BASE_URL from "../config/api";


const AUTH_TOKEN_KEY =
  "yovi_access_token";


// ============================================================
// TOKEN
// ============================================================

export function getAuthToken() {

  try {

    return localStorage.getItem(
      AUTH_TOKEN_KEY
    );

  } catch {

    return null;

  }

}


export function setAuthToken(
  token
) {

  try {

    if (!token) {

      localStorage.removeItem(
        AUTH_TOKEN_KEY
      );

      return;

    }


    localStorage.setItem(
      AUTH_TOKEN_KEY,
      token
    );

  } catch (error) {

    console.warn(
      "YOVI auth token storage failed:",
      error
    );

  }

}


export function clearAuthToken() {

  try {

    localStorage.removeItem(
      AUTH_TOKEN_KEY
    );

  } catch (error) {

    console.warn(
      "YOVI auth token removal failed:",
      error
    );

  }

}


// ============================================================
// REGISTER
// ============================================================

export async function registerUser({
  email,
  username,
  password,
  displayName,
}) {

  const response =
    await fetch(
      `${API_BASE_URL}/auth/register`,
      {

        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({

          email:
            email.trim(),

          username:
            username.trim(),

          password,

          display_name:
            displayName?.trim() ||
            null,

        }),

      }
    );


  const data =
    await response.json()
      .catch(
        () => ({})
      );


  if (!response.ok) {

    throw new Error(
      data?.detail ||
      "Unable to create account."
    );

  }


  return data;

}


// ============================================================
// LOGIN
// ============================================================

export async function loginUser({
  email,
  password,
}) {

  const response =
    await fetch(
      `${API_BASE_URL}/auth/login`,
      {

        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({

          email:
            email.trim(),

          password,

        }),

      }
    );


  const data =
    await response.json()
      .catch(
        () => ({})
      );


  if (!response.ok) {

    throw new Error(
      data?.detail ||
      "Invalid email or password."
    );

  }


  if (
    !data?.access_token
  ) {

    throw new Error(
      "Login succeeded but no access token was returned."
    );

  }


  setAuthToken(
    data.access_token
  );


  return data;

}


// ============================================================
// CURRENT USER
// ============================================================

export async function getCurrentUser() {

  const token =
    getAuthToken();


  if (!token) {

    return null;

  }


  const response =
    await fetch(
      `${API_BASE_URL}/auth/me`,
      {

        method: "GET",

        headers: {

          Authorization:
            `Bearer ${token}`,

        },

      }
    );


  if (
    response.status ===
    401
  ) {

    clearAuthToken();

    return null;

  }


  if (!response.ok) {

    throw new Error(
      "Unable to load user profile."
    );

  }


  return await response.json();

}


// ============================================================
// LOGOUT
// ============================================================

export function logoutUser() {

  clearAuthToken();

}


// ============================================================
// GOOGLE LOGIN
// ============================================================

export function loginWithGoogle() {

  window.location.href =
    `${API_BASE_URL}/auth/google`;

}


// ============================================================
// AUTHENTICATED FETCH
// ============================================================

export async function authFetch(
  url,
  options = {}
) {

  const token =
    getAuthToken();


  const headers = {

    ...(options.headers || {}),

  };


  if (token) {

    headers.Authorization =
      `Bearer ${token}`;

  }


  if (
    options.body &&
    !headers["Content-Type"]
  ) {

    headers["Content-Type"] =
      "application/json";

  }


  const response =
    await fetch(
      url,
      {
        ...options,
        headers,
      }
    );


  if (
    response.status ===
    401
  ) {

    clearAuthToken();

  }


  return response;

}