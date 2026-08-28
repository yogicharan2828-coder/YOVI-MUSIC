import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../services/authService";


const AuthContext =
  createContext(null);


// ============================================================
// PROVIDER
// ============================================================

export function AuthProvider({
  children,
}) {

  const [
    user,
    setUser,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  // ==========================================================
  // LOAD EXISTING SESSION
  // ==========================================================

  const loadUser =
    useCallback(
      async () => {

        try {

          const currentUser =
            await getCurrentUser();


          setUser(
            currentUser
          );

        } catch (error) {

          /*
           * No valid session is completely normal
           * for a logged-out user.
           */

          setUser(
            null
          );

        } finally {

          setLoading(
            false
          );

        }

      },
      []
    );


  useEffect(() => {

    loadUser();

  }, [
    loadUser,
  ]);


  // ==========================================================
  // LOGIN
  // ==========================================================

  const login =
    useCallback(
      async ({
        email,
        password,
      }) => {

        const data =
          await loginUser({

            email,

            password,

          });


        /*
         * loginUser already handles storing
         * the access token.
         *
         * The returned user becomes the
         * single source of truth for Navbar.
         */

        setUser(
          data.user
        );


        return data.user;

      },
      []
    );


  // ==========================================================
  // REGISTER
  // ==========================================================

  const register =
    useCallback(
      async ({
        email,
        username,
        password,
        displayName,
      }) => {

        const registeredUser =
          await registerUser({

            email,

            username,

            password,

            displayName,

          });


        /*
         * Registration currently does not
         * authenticate the user.
         */

        return registeredUser;

      },
      []
    );


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout =
    useCallback(
      () => {

        /*
         * Clear the stored authentication
         * token through authService.
         */

        logoutUser();


        /*
         * Immediately remove the user from
         * React state.
         *
         * Navbar therefore changes instantly
         * without requiring a refresh.
         */

        setUser(
          null
        );

      },
      []
    );


  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value =
    useMemo(
      () => ({

        user,

        loading,

        isAuthenticated:
          Boolean(user),

        login,

        register,

        logout,

        refreshUser:
          loadUser,

      }),
      [
        user,
        loading,
        login,
        register,
        logout,
        loadUser,
      ]
    );


  return (

    <AuthContext.Provider
      value={
        value
      }
    >

      {children}

    </AuthContext.Provider>

  );

}


// ============================================================
// HOOK
// ============================================================

export function useAuth() {

  const context =
    useContext(
      AuthContext
    );


  if (!context) {

    throw new Error(
      "useAuth must be used inside AuthProvider"
    );

  }


  return context;

}