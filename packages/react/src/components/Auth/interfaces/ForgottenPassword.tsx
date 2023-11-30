import { SupabaseClient } from '@supabase/supabase-js'
import React, {useEffect, useState} from 'react'
import { Appearance, I18nVariables, RedirectTo } from '../../../types'
import { VIEWS } from './../../../constants'
import { Anchor, Button, Container, Input, Label, Message } from './../../UI'
import HCaptcha from "@hcaptcha/react-hcaptcha";
import {toast, ToastItem} from "react-toastify";

function ForgottenPassword({
  setAuthView,
  supabaseClient,
  redirectTo,
  i18n,
  appearance,
  showLinks,
  hCaptchaKey,
}: {
  setAuthView: any
  supabaseClient: SupabaseClient
  redirectTo?: RedirectTo
  i18n: I18nVariables
  appearance?: Appearance
  showLinks?: boolean
  hCaptchaKey?: string
}) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [captchaKey, setCaptchaKey] = useState(hCaptchaKey)
  const [captchaToken, setCaptchaToken] = useState('')
  const resetSuccessMsg = 'Check your email for the password reset link';
  const captchaRef = React.useRef<HCaptcha>(null);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
    if (message) {
      toast.info(message);
    }
  },[error, message])

  useEffect(() => {
    toast.onChange((payload: ToastItem) => {
      if (payload.content == resetSuccessMsg && payload.status == "removed") {
        if (typeof window !== "undefined") {
          window.location.replace("/signin")
        }
      }
    });
  }, []);

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/newpw`, captchaToken
    })
    if (error) {
      setError(error.message);
    } else {
      setMessage(resetSuccessMsg);
    }
    setLoading(false)
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

  return (
    <form id="auth-forgot-password" onSubmit={handlePasswordReset}>
      <Container gap="large" direction="vertical" appearance={appearance}>
        <Container gap="large" direction="vertical" appearance={appearance}>
          <div>
            <Label htmlFor="email" appearance={appearance}>
              {i18n?.forgotten_password?.email_label}
            </Label>
            <Input
              name="email"
              type="email"
              placeholder={i18n?.forgotten_password?.email_input_placeholder}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              appearance={appearance}
            />
          </div>
          <div className={"justify-center"}>
            {captchaView()}
          </div>
          <Button
            type="submit"
            color="primary"
            loading={loading}
            appearance={appearance}
          >
            {i18n?.forgotten_password?.button_label}
          </Button>
        </Container>
        {showLinks && (
          <Anchor
            href="#auth-sign-in"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault()
              setAuthView(VIEWS.SIGN_IN)
            }}
            appearance={appearance}
          >
            {i18n?.sign_in?.link_text}
          </Anchor>
        )}
      </Container>
    </form>
  )
}

export { ForgottenPassword }
