import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Detect device type from user agent
function detectDevice(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile'
  }
  return 'desktop'
}

// Detect browser
function detectBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  if (ua.includes('firefox')) return 'Firefox'
  if (ua.includes('chrome')) return 'Chrome'
  if (ua.includes('safari')) return 'Safari'
  if (ua.includes('edge')) return 'Edge'
  return 'unknown'
}

// Detect OS
function detectOS(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  if (ua.includes('windows')) return 'Windows'
  if (ua.includes('mac')) return 'macOS'
  if (ua.includes('linux')) return 'Linux'
  if (ua.includes('android')) return 'Android'
  if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS'
  return 'unknown'
}

// Classify origin type and confidence
function classifyOrigin(referer: string | null, urlParams: any): {
  originType: string
  originConfidence: string
} {
  // Check for explicit Meta Ads parameter
  if (urlParams.fbclid) {
    return {
      originType: 'meta_ad',
      originConfidence: 'confirmed',
    }
  }

  // Check referer
  if (referer) {
    const ref = referer.toLowerCase()

    if (ref.includes('facebook.com') || ref.includes('instagram.com')) {
      return {
        originType: 'organic_social',
        originConfidence: 'inferred',
      }
    }

    if (ref.includes('google.com') || ref.includes('bing.com')) {
      return {
        originType: 'search',
        originConfidence: 'inferred',
      }
    }

    if (ref.includes('t.co') || ref.includes('twitter.com')) {
      return {
        originType: 'organic_social',
        originConfidence: 'inferred',
      }
    }
  }

  // Direct access or unknown
  return {
    originType: 'unknown',
    originConfidence: 'unknown',
  }
}

// Simple bot detection
function isLikelyBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase()
  const botSignatures = ['bot', 'crawler', 'spider', 'crawling', 'meta-externalagent', 'whatsapp']
  return botSignatures.some(sig => ua.includes(sig))
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params

    // Find link
    const link = await prisma.trackingLink.findUnique({
      where: { shortCode },
    })

    if (!link) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Capture tracking data (non-blocking)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referer = request.headers.get('referer')
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')

    // Parse URL parameters
    const url = new URL(request.url)
    const urlParams: any = {}
    url.searchParams.forEach((value, key) => {
      urlParams[key] = value
    })

    // Detect device and origin
    const device = detectDevice(userAgent)
    const browser = detectBrowser(userAgent)
    const os = detectOS(userAgent)
    const { originType, originConfidence } = classifyOrigin(referer, urlParams)
    const isBot = isLikelyBot(userAgent)

    // Save click event asynchronously (don't block redirect)
    prisma.clickEvent.create({
      data: {
        workspaceId: link.workspaceId,
        linkId: link.id,
        ip: ip || null,
        userAgent,
        referer,
        urlParams,
        device,
        browser,
        os,
        originType,
        originConfidence,
        fbclid: urlParams.fbclid || null,
        isBot,
      },
    }).catch(err => console.error('Error saving click event:', err))

    // Update last access timestamp
    prisma.trackingLink.update({
      where: { id: link.id },
      data: { lastAccessAt: new Date() },
    }).catch(err => console.error('Error updating lastAccessAt:', err))

    // Redirect to original destination immediately
    return NextResponse.redirect(link.destination)
  } catch (error) {
    console.error('Redirect error:', error)
    return NextResponse.redirect(new URL('/', request.url))
  }
}
