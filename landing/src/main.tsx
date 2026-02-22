import React from 'react'
import ReactDOM from 'react-dom/client'
import { LandingPage } from './components/LandingPage.tsx'
import { LegalPage } from './components/LegalPage.tsx'
import { CheckoutStatusPage } from './components/CheckoutStatusPage.tsx'
import { MonoticketsComingSoonPage, NotFoundPage } from './components/MonoticketsComingSoonPage.tsx'
import { trackLandingEvent } from './lib/analytics.ts'
import { installMockBackend } from './lib/mockBackend.ts'
import { captureUtmFromUrl } from './lib/utm.ts'
import './landing.css'

installMockBackend()
captureUtmFromUrl()
trackLandingEvent(
    'landing_page_view',
    { path: window.location.pathname, search: window.location.search },
    { dedupeKey: `page:${window.location.pathname}${window.location.search}` },
)

function resolveAppNode() {
    const pathname = window.location.pathname.toLowerCase()
    if (pathname === '/' || pathname === '') {
        return <LandingPage />
    }
    if (pathname === '/legal/aviso-privacidad') {
        return <LegalPage type="privacy" />
    }
    if (pathname === '/legal/terminos') {
        return <LegalPage type="terms" />
    }
    if (pathname === '/checkout/success') {
        return <CheckoutStatusPage statusType="success" />
    }
    if (pathname === '/checkout/pending') {
        return <CheckoutStatusPage statusType="pending" />
    }
    if (pathname === '/checkout/failure') {
        return <CheckoutStatusPage statusType="failure" />
    }
    if (pathname === '/monotickets' || pathname === '/monotickets/') {
        return <MonoticketsComingSoonPage />
    }
    if (pathname === '/en-construccion' || pathname === '/en-construccion/') {
        return <MonoticketsComingSoonPage />
    }
    if (pathname === '/404' || pathname === '/404/') {
        return <NotFoundPage />
    }
    return <NotFoundPage />
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        {resolveAppNode()}
    </React.StrictMode>,
)
