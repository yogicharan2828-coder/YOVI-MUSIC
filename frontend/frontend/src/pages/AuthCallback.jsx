import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  setAuthToken,
} from "../services/authService";

import {
  useAuth,
} from "../context/AuthContext";


function AuthCallback() {

  const navigate =
    useNavigate();


  const {
    refreshUser,
  } = useAuth();


  const [
    error,
    setError,
  ] = useState("");


  const [
    processing,
    setProcessing,
  ] = useState(true);


  useEffect(() => {

    let cancelled = false;


    async function completeGoogleLogin() {

      try {

        // ====================================================
        // READ TOKEN
        // ====================================================

        const hash =
          window.location.hash;


        const params =
          new URLSearchParams(
            hash.startsWith("#")
              ? hash.substring(1)
              : hash
          );


        const token =
          params.get("token");


        if (!token) {

          throw new Error(
            "Google authentication failed."
          );

        }


        // ====================================================
        // SAVE TOKEN
        // ====================================================

        setAuthToken(
          token
        );


        // ====================================================
        // REMOVE TOKEN FROM URL
        // ====================================================

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );


        // ====================================================
        // LOAD AUTHENTICATED USER
        // ====================================================

        await refreshUser();


        if (cancelled) {

          return;

        }


        // ====================================================
        // SUCCESS
        // ====================================================

        setProcessing(
          false
        );


        navigate(
          "/",
          {
            replace: true,
          }
        );

      } catch (err) {

        console.warn(
          "YOVI Google callback failed:",
          err
        );


        if (cancelled) {

          return;

        }


        /*
         * Give the auth state a moment to settle before
         * declaring the Google login unsuccessful.
         */

        setTimeout(
          async () => {

            try {

              await refreshUser();


              if (cancelled) {

                return;

              }


              setProcessing(
                false
              );


              navigate(
                "/",
                {
                  replace: true,
                }
              );

            } catch {

              if (cancelled) {

                return;

              }


              setProcessing(
                false
              );


              setError(
                "Unable to complete Google authentication."
              );

            }

          },
          300
        );

      }

    }


    completeGoogleLogin();


    return () => {

      cancelled = true;

    };

  }, [
    navigate,
    refreshUser,
  ]);


  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    !processing &&
    error
  ) {

    return (

      <main className="auth-page">

        <div className="auth-card">

          <div className="auth-header">

            <span className="auth-eyebrow">
              GOOGLE AUTHENTICATION
            </span>


            <h1>
              Something went wrong.
            </h1>


            <p>
              {error}
            </p>

          </div>


          <button
            type="button"
            className="auth-submit"
            onClick={() =>
              navigate(
                "/login"
              )
            }
          >
            RETURN TO LOGIN
          </button>

        </div>

      </main>

    );

  }


  // ==========================================================
  // PROCESSING
  // ==========================================================

  return (

    <main className="auth-page">

      <div className="auth-card">

        <div className="auth-header">

          <span className="auth-eyebrow">
            YOVI
          </span>


          <h1>
            Signing you in.
          </h1>


          <p>
            Connecting your Google account...
          </p>

        </div>

      </div>

    </main>

  );

}


export default AuthCallback;