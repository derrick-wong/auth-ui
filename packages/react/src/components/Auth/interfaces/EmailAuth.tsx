import {SupabaseClient} from '@supabase/supabase-js'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import React, {useEffect, useRef, useState} from 'react'
import {Appearance, I18nVariables, RedirectTo, ViewSignIn, ViewSignUp, ViewsMap, ViewType,} from './../../../types'
import {Anchor, Button, Container, Input, Label} from './../../UI'
import {toast, ToastItem} from "react-toastify";
import TermsModal from "../TermsModal";

export interface EmailAuthProps {
  authView: ViewSignIn | ViewSignUp
  defaultEmail: string
  defaultPassword: string
  setAuthView: any
  setDefaultEmail: (email: string) => void
  setDefaultPassword: (password: string) => void
  supabaseClient: SupabaseClient
  showLinks?: boolean
  redirectTo?: RedirectTo
  magicLink?: boolean
  i18n: I18nVariables
  appearance?: Appearance
  hCaptchaKey?: string
  tos?: string
}

const VIEWS: ViewsMap = {
  SIGN_IN: 'sign_in',
  SIGN_UP: 'sign_up',
  FORGOTTEN_PASSWORD: 'forgotten_password',
  MAGIC_LINK: 'magic_link',
  UPDATE_PASSWORD: 'update_password',
}

function EmailAuth({
                     authView = 'sign_in',
                     defaultEmail,
                     defaultPassword,
                     setAuthView,
                     setDefaultEmail,
                     setDefaultPassword,
                     supabaseClient,
                     showLinks = true,
                     redirectTo,
                     magicLink,
                     i18n,
                     appearance,
                     hCaptchaKey,
                     tos
                   }: EmailAuthProps) {

  const isMounted = useRef<boolean>(true)
  const [name, setName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState(defaultPassword)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [captchaKey] = useState(hCaptchaKey)
  const [captchaToken, setCaptchaToken] = useState('')
  const [modalOpen, setModalOpen] = useState(false);
  const signUpSuccessMsg = 'Check your email for the confirmation link.';

  const captchaRef = React.useRef<HCaptcha>(null);

  useEffect(() => {
    setEmail(defaultEmail)
    setPassword(defaultPassword)

    return () => {
      isMounted.current = false
    }
  }, [authView]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
    if (message) {
      toast.info(message);
    }
  }, [error, message]);

  useEffect(() => {
    toast.onChange((payload: ToastItem) => {
      if (payload.content == signUpSuccessMsg && payload.status == "removed") {
        if (typeof window !== "undefined") {
          window.location.replace("/signin")
        }
      }
    });
  }, []);

  const handleAccept = async () => {
    setModalOpen(false);

    const {
      data: {user: signUpUser, session: signUpSession},
      error: signUpError,
    } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          first_name: firstName,
          last_name: lastName,
          accepted_tos: true,
          accepted_date: new Date()
        },
        captchaToken: captchaToken
      },
    });

    captchaRef?.current?.resetCaptcha();


    if (signUpError) {
      setError(signUpError.message)
    }
    // Check if session is null -> email confirmation setting is turned on
    else if (signUpUser && !signUpSession) {
      clearFields();
      setMessage(signUpSuccessMsg);
    }
  };

  const clearFields = () => {
    setName('')
    setLastName('')
    setFirstName('')
    setEmail(defaultEmail)
    setPassword(defaultPassword)

    if (document) {
      const inputs = document.getElementsByTagName('input');
      for (let i = 0; i < inputs.length; i++) {
        inputs[i].value = "";
      }
    }
  }

  const handleDecline = () => {
    setModalOpen(false);
    clearFields();
    setError("Must Accept Terms to Sign Up");
  };

  const validSignUp = () => {
    const errors: string[] = [];

    if (name.length == 0 || name == '') {
      errors.push("Invalid Username");
    }
    if (lastName == '') {
      errors.push("Invalid Last Name");
    }
    if (firstName == '') {
      errors.push("Invalid First Name");
    }
    if (email == '' || !email.match("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")) {
      errors.push("Invalid Email");
    }
    if (password == '' || password.length < 8) {
      errors.push("Invalid Password");
    }

    if (errors.length == 0) {
      return true;
    } else {
      errors.map((msg) => {
        toast.error(msg);
      });
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    switch (authView) {
      case 'sign_in':
        const {error: signInError} =
          await supabaseClient.auth.signInWithPassword({
            email,
            password,
            options: {captchaToken},
          })
        captchaRef?.current?.resetCaptcha();
        if (signInError) setError(signInError.message)
        break
      case 'sign_up':
        if (validSignUp()) {
          setModalOpen(true);
        }
        break
    }

    /*
     * it is possible the auth component may have been unmounted at this point
     * check if component is mounted before setting a useState
     */
    if (isMounted.current) setLoading(false)
  }

  const handleViewChange = (newView: ViewType) => {
    setDefaultEmail(email)
    setDefaultPassword(password)
    setAuthView(newView)
  }

  const captchaView = () => {
    if (captchaKey) {
      return <HCaptcha ref={captchaRef}
                       sitekey={captchaKey}
                       theme={"dark"}
                       onVerify={(token: string) => {
                         setCaptchaToken(token)
                       }}/>;
    }
    return <></>;
  }

  const tosModalView = () => {
    if (modalOpen && tos) {
      return <TermsModal isOpen={modalOpen} tos={tos} handleAccept={handleAccept} handleDecline={handleDecline}/>
    }
  }

  // @ts-ignore
  return modalOpen ?
    (<>
      <div>
        {tosModalView()}
      </div>
      <div className="modal-backdrop"/>
    </>) : (
      <form
        id={authView === 'sign_in' ? `auth-sign-in` : `auth-sign-up`}
        onSubmit={handleSubmit}
        autoComplete={'on'}
        style={{width: '100%'}}
      >
        <Container direction="vertical" gap="large" appearance={appearance}>
          <Container direction="vertical" gap="large" appearance={appearance}>
            {authView === 'sign_up' ?
              <>
                <div>
                  <Label htmlFor="name" appearance={appearance}>
                    {i18n?.[authView]?.name_label}
                  </Label>
                  <Input
                    type="name"
                    name="name"
                    placeholder={i18n?.[authView]?.name_input_placeholder}
                    defaultValue={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setName(e.target.value)
                    }
                    autoComplete="name"
                    appearance={appearance}
                  />
                  <Label htmlFor="name" appearance={appearance}>
                    {i18n?.[authView]?.firstname_label}
                  </Label>
                  <Input
                    type="name"
                    name="firstName"
                    placeholder={i18n?.[authView]?.firstname_input_placeholder}
                    defaultValue={firstName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFirstName(e.target.value)
                    }
                    autoComplete="firstName"
                    appearance={appearance}
                  />
                  <Label htmlFor="name" appearance={appearance}>
                    {i18n?.[authView]?.lastname_label}
                  </Label>
                  <Input
                    type="name"
                    name="lastName"
                    placeholder={i18n?.[authView]?.lastname_input_placeholder}
                    defaultValue={lastName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLastName(e.target.value)
                    }
                    autoComplete="lastName"
                    appearance={appearance}
                  />
                </div>
              </> : <></>
            }
            <div>
              <Label htmlFor="email" appearance={appearance}>
                {i18n?.[authView]?.email_label}
              </Label>
              <Input
                type="email"
                name="email"
                placeholder={i18n?.[authView]?.email_input_placeholder}
                defaultValue={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
                autoComplete="email"
                appearance={appearance}
              />
            </div>
            <div>
              <Label htmlFor="password" appearance={appearance}>
                {i18n?.[authView]?.password_label}
              </Label>
              <Input
                type="password"
                name="password"
                placeholder={i18n?.[authView]?.password_input_placeholder}
                defaultValue={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                autoComplete={
                  authView === 'sign_in' ? 'current-password' : 'new-password'
                }
                appearance={appearance}
              />
            </div>
            <div>
              {captchaView()}
            </div>
          </Container>

          <Button
            type="submit"
            color="primary"
            loading={loading}
            appearance={appearance}
          >
            {i18n?.[authView]?.button_label}
          </Button>

          {showLinks && (
            <Container direction="vertical" gap="small" appearance={appearance}>
              {authView === VIEWS.SIGN_IN && magicLink && (
                <Anchor
                  href="#auth-magic-link"
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault()
                    setAuthView(VIEWS.MAGIC_LINK)
                  }}
                  appearance={appearance}
                >
                  {i18n?.magic_link?.link_text}
                </Anchor>
              )}
              {authView === VIEWS.SIGN_IN && (
                <Anchor
                  href="#auth-forgot-password"
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault()
                    setAuthView(VIEWS.FORGOTTEN_PASSWORD)
                  }}
                  appearance={appearance}
                >
                  {i18n?.forgotten_password?.link_text}
                </Anchor>
              )}
              {authView === VIEWS.SIGN_IN ? (
                <Anchor
                  href="#auth-sign-up"
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault()
                    handleViewChange(VIEWS.SIGN_UP)
                  }}
                  appearance={appearance}
                >
                  {i18n?.sign_up?.link_text}
                </Anchor>
              ) : (
                <Anchor
                  href="#auth-sign-in"
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault()
                    handleViewChange(VIEWS.SIGN_IN)
                  }}
                  appearance={appearance}
                >
                  {i18n?.sign_in?.link_text}
                </Anchor>
              )}
            </Container>
          )}
        </Container>
      </form>
    )
}

export {EmailAuth}
