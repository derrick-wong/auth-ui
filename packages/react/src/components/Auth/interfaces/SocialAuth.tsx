import {Provider, SupabaseClient} from '@supabase/supabase-js'
import React, {useEffect, useState} from 'react'
import { Appearance, I18nVariables, SocialLayout } from '../../../types'
import { Button, Container, Divider } from './../../UI'
import * as SocialIcons from './../Icons'
import {toast} from "react-toastify";
import TermsModal from "../TermsModal";

interface SocialAuthProps {
  supabaseClient: SupabaseClient
  socialLayout: SocialLayout
  providers?: Provider[]
  redirectTo: RedirectTo
  onlyThirdPartyProviders: boolean
  view: 'sign_in' | 'sign_up'
  i18n: I18nVariables
  appearance?: Appearance
  tos?: string
}

type RedirectTo = undefined | string

function SocialAuth({
  supabaseClient,
  socialLayout = 'vertical',
  providers,
  redirectTo,
  onlyThirdPartyProviders,
  view,
  i18n,
  appearance,
  tos,
}: SocialAuthProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadedProvider, setLoadProvider] = useState<Provider>();
  const [modalOpen, setModalOpen] = useState(false);

  const verticalSocialLayout = socialLayout === 'vertical'

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  },[error])

  const handleAccept = async () => {
    setModalOpen(false);

    if (loadedProvider) {
      const {error} = await supabaseClient.auth.signInWithOAuth({
        provider: loadedProvider,
        options: {redirectTo},
      })
      if (error) setError(error.message)
    } else {
      setError("ERROR - No provider found.");
    }
  };

  const handleDecline = () => {
    setModalOpen(false);
    setError("Must Accept Terms to Sign Up");
  };


  const tosModalView = () => {
    if (modalOpen && tos) {
      return <TermsModal isOpen={modalOpen} tos={tos} handleAccept={handleAccept} handleDecline={handleDecline}/>
    }
  }

  const handleProviderSignIn = async (provider: Provider) => {
    setLoading(true)
    if (view == 'sign_in') {
      const {error} = await supabaseClient.auth.signInWithOAuth({
        provider,
        options: {redirectTo},
      })
      if (error) setError(error.message)
    } else if (view == 'sign_up') {
      setModalOpen(true);
      setLoadProvider(provider);
    }
    setLoading(false)
  }

  function capitalize(word: string) {
    const lower = word.toLowerCase()
    return word.charAt(0).toUpperCase() + lower.slice(1)
  }

  function customProviderText(provider: Provider) {
    let providerText = view == 'sign_up' ?
      i18n[view]?.social_provider_text?.replace('in', 'up') : i18n[view]?.social_provider_text;
    return providerText + ' ' + capitalize(provider);
  }

  return modalOpen ?
    (<>
      <div>
        {tosModalView()}
      </div>
      <div className="modal-backdrop"/>
    </>) : (
    <>
      {providers && providers.length > 0 && (
        <>
          <Container gap="large" direction="vertical" appearance={appearance}>
            <Container
              direction={verticalSocialLayout ? 'vertical' : 'horizontal'}
              gap={verticalSocialLayout ? 'small' : 'medium'}
              appearance={appearance}
            >
              {providers.map((provider: Provider) => {
                // @ts-ignore
                const AuthIcon = SocialIcons[provider]
                return (
                  <Button
                    key={provider}
                    color="default"
                    icon={AuthIcon ? <AuthIcon /> : ''}
                    loading={loading}
                    onClick={() => handleProviderSignIn(provider)}
                    appearance={appearance}
                  >
                    {verticalSocialLayout && customProviderText(provider)}
                  </Button>
                )
              })}
            </Container>
          </Container>
          {!onlyThirdPartyProviders && <Divider appearance={appearance} />}
        </>
      )}
    </>
  )
}

export { SocialAuth }
