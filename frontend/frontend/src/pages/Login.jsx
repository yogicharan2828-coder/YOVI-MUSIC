import {
  ArrowLeft,
  Mail,
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

function Login() {

  const navigate =
    useNavigate();


  const {
    login,
  } = useAuth();


  const [
    email,
    setEmail,
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
  // LOGIN
  // ==========================================================

  const handleSubmit =
    async (event) => {

      event.preventDefault();


      setError("");


      const cleanEmail =
        email.trim();


      if (!cleanEmail) {

        setError(
          "Please enter your email."
        );

        return;

      }


      if (!password) {

        setError(
          "Please enter your password."
        );

        return;

      }


      setLoading(true);


      try {

        await login({

          email:
            cleanEmail,

          password,

        });


        navigate(
          "/"
        );

      } catch (loginError) {

        setError(
          loginError?.message ||
          "Unable to sign in."
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
            WELCOME BACK
          </span>

          <h1>
            Sign in to YOVI.
          </h1>

          <p>
            Continue your music experience.
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
                placeholder="Your password"
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
                autoComplete="current-password"
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


          {/* LOGIN */}

          <button
            type="submit"
            className="auth-submit"
            disabled={
              loading
            }
          >

            {loading
              ? "SIGNING IN..."
              : "SIGN IN"}

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
            REGISTER
        ==================================================== */}

        <div className="auth-switch">

          <span>
            New to YOVI?
          </span>


          <Link
            to="/register"
          >
            CREATE ACCOUNT
          </Link>

        </div>

      </div>

    </main>

  );

}


export default Login;