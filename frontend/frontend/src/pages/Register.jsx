import {
  ArrowLeft,
  Mail,
  User,
  Lock,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";
import {
  loginWithGoogle,
} from "../services/authService";


function Register() {

  const navigate =
    useNavigate();


  const {
    register,
  } = useAuth();


  const [
    email,
    setEmail,
  ] = useState("");


  const [
    username,
    setUsername,
  ] = useState("");


  const [
    displayName,
    setDisplayName,
  ] = useState("");


  const [
    password,
    setPassword,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  // ==========================================================
  // REGISTER
  // ==========================================================

  const handleSubmit =
    async (event) => {

      event.preventDefault();


      setError("");


      const cleanEmail =
        email.trim();


      const cleanUsername =
        username.trim();


      const cleanDisplayName =
        displayName.trim();


      // ------------------------------------------------------
      // BASIC VALIDATION
      // ------------------------------------------------------

      if (!cleanEmail) {

        setError(
          "Please enter your email."
        );

        return;

      }


      if (!cleanUsername) {

        setError(
          "Please choose a username."
        );

        return;

      }


      if (cleanUsername.length < 3) {

        setError(
          "Username must be at least 3 characters."
        );

        return;

      }


      if (!password) {

        setError(
          "Please create a password."
        );

        return;

      }


      if (password.length < 8) {

        setError(
          "Password must be at least 8 characters."
        );

        return;

      }


      setLoading(true);


      try {

        await register({

          email:
            cleanEmail,

          username:
            cleanUsername,

          password,

          displayName:
            cleanDisplayName,

        });


        /*
         * The current backend registration
         * endpoint creates the account but
         * does not return an access token.
         *
         * Send the new user to Login.
         */

        navigate(
          "/login",
          {
            state: {
              registered: true,
              email: cleanEmail,
            },
          }
        );

      } catch (registerError) {

        setError(
          registerError?.message ||
          "Unable to create your account."
        );

      } finally {

        setLoading(false);

      }

    };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <main className="auth-page">

      <div className="auth-card">


        {/* ====================================================
            BACK
        ==================================================== */}

        <Link
          to="/"
          className="auth-back"
        >

          <ArrowLeft
            size={16}
            strokeWidth={1.5}
          />

          <span>
            BACK TO YOVI
          </span>

        </Link>


        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="auth-header">

          <span className="auth-eyebrow">
            JOIN YOVI
          </span>

          <h1>
            Create your account.
          </h1>

          <p>
            Build your own personalized music experience.
          </p>

        </div>


        {/* ====================================================
            FORM
        ==================================================== */}

        <form
          className="auth-form"
          onSubmit={
            handleSubmit
          }
        >

          {/* EMAIL */}

          <label className="auth-field">

            <span>
              EMAIL
            </span>


            <div className="auth-input-wrapper">

              <Mail
                size={17}
                strokeWidth={1.5}
              />


              <input
                type="email"
                placeholder="you@example.com"
                value={
                  email
                }
                onChange={(
                  event
                ) =>
                  setEmail(
                    event.target.value
                  )
                }
                autoComplete="email"
                disabled={
                  loading
                }
              />

            </div>

          </label>


          {/* USERNAME */}

          <label className="auth-field">

            <span>
              USERNAME
            </span>


            <div className="auth-input-wrapper">

              <User
                size={17}
                strokeWidth={1.5}
              />


              <input
                type="text"
                placeholder="Choose a username"
                value={
                  username
                }
                onChange={(
                  event
                ) =>
                  setUsername(
                    event.target.value
                  )
                }
                autoComplete="username"
                maxLength={50}
                disabled={
                  loading
                }
              />

            </div>

          </label>


          {/* DISPLAY NAME */}

          <label className="auth-field">

            <span>
              DISPLAY NAME
              <small>
                OPTIONAL
              </small>
            </span>


            <div className="auth-input-wrapper">

              <User
                size={17}
                strokeWidth={1.5}
              />


              <input
                type="text"
                placeholder="How should YOVI call you?"
                value={
                  displayName
                }
                onChange={(
                  event
                ) =>
                  setDisplayName(
                    event.target.value
                  )
                }
                autoComplete="name"
                maxLength={100}
                disabled={
                  loading
                }
              />

            </div>

          </label>


          {/* PASSWORD */}

          <label className="auth-field">

            <span>
              PASSWORD
            </span>


            <div className="auth-input-wrapper">

              <Lock
                size={17}
                strokeWidth={1.5}
              />


              <input
                type="password"
                placeholder="At least 8 characters"
                value={
                  password
                }
                onChange={(
                  event
                ) =>
                  setPassword(
                    event.target.value
                  )
                }
                autoComplete="new-password"
                maxLength={128}
                disabled={
                  loading
                }
              />

            </div>

          </label>


          {/* ERROR */}

          {error && (

            <div className="auth-error">
              {error}
            </div>

          )}


          {/* CREATE ACCOUNT */}

          <button
            type="submit"
            className="auth-submit"
            disabled={
              loading
            }
          >

            {loading
              ? "CREATING ACCOUNT..."
              : "CREATE ACCOUNT"}

          </button>

        </form>


        {/* ====================================================
            DIVIDER
        ==================================================== */}

        <div className="auth-divider">

          <span />

          <small>
            OR
          </small>

          <span />

        </div>


        {/* ====================================================
            GOOGLE
        ==================================================== */}

        <button
          type="button"
          className="auth-google"
       onClick={
  loginWithGoogle
}
          disabled={
            loading
          }
        >

          <span className="auth-google-icon">
            G
          </span>

          <span>
            CONTINUE WITH GOOGLE
          </span>

        </button>


        {/* ====================================================
            LOGIN
        ==================================================== */}

        <div className="auth-switch">

          <span>
            Already have an account?
          </span>


          <Link
            to="/login"
          >
            SIGN IN
          </Link>

        </div>

      </div>

    </main>

  );

}


export default Register;