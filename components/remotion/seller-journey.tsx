'use client'

import { AbsoluteFill, Sequence, useVideoConfig, interpolate, spring } from 'remotion'
import React from 'react'

interface SellerJourneyProps {
  durationInFrames?: number
}

const SellerJourney: React.FC<SellerJourneyProps> = ({ durationInFrames = 300 }) => {
  const { fps } = useVideoConfig()

  const fadeIn = (frame: number, duration: number) =>
    interpolate(frame, [0, duration], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const fadeOut = (frame: number, startFrame: number, duration: number) =>
    interpolate(frame, [startFrame, startFrame + duration], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })

  const slideInFromLeft = (frame: number, duration: number) =>
    interpolate(frame, [0, duration], [-100, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ backgroundColor: '#0052CC' }}>
      {/* Scene 1: Login - Frames 0-50 */}
      <Sequence from={0} durationInFrames={60}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div
            style={{
              opacity: fadeIn(0, 30),
              transform: `translateX(${slideInFromLeft(0, 30)}px)`,
            }}
          >
            <div style={{ textAlign: 'center', color: 'white' }}>
              <h2 style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 20 }}>Welcome to Blaqora</h2>
              <div
                style={{
                  width: 200,
                  height: 200,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  fontSize: 80,
                }}
              >
                👤
              </div>
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Scene 2: Dashboard - Frames 60-130 */}
      <Sequence from={60} durationInFrames={70}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <div
            style={{
              opacity: fadeIn(0, 30),
              transform: `scale(${interpolate(0, [0, 30], [0.8, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })})`,
              width: '100%',
              maxWidth: 500,
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 24,
                boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
              }}
            >
              <h3 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#0052CC' }}>
                Your Dashboard
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0052CC' }}>1,240</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>Total Orders</div>
                </div>
                <div style={{ backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 'bold', color: '#0052CC' }}>₦2.4M</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>Revenue</div>
                </div>
              </div>
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Scene 3: Add Product - Frames 130-200 */}
      <Sequence from={130} durationInFrames={70}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <div
            style={{
              opacity: fadeIn(0, 30),
              transform: `translateX(${slideInFromLeft(0, 30)}px)`,
              width: '100%',
              maxWidth: 500,
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 24,
                boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
              }}
            >
              <h3 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#0052CC' }}>
                Add Your Service
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div
                  style={{
                    padding: 12,
                    border: '2px solid #0052CC',
                    borderRadius: 8,
                    color: '#0052CC',
                    fontSize: 14,
                    fontWeight: '500',
                  }}
                >
                  📝 Premium Web Design
                </div>
                <div
                  style={{
                    padding: 12,
                    border: '2px solid #0052CC',
                    borderRadius: 8,
                    color: '#0052CC',
                    fontSize: 14,
                    fontWeight: '500',
                  }}
                >
                  💰 ₦45,000
                </div>
                <button
                  style={{
                    backgroundColor: '#0052CC',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: 8,
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Publish Service →
                </button>
              </div>
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Scene 4: Order Received - Frames 200-260 */}
      <Sequence from={200} durationInFrames={60}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <div
            style={{
              opacity: fadeIn(0, 30),
              transform: `scale(${interpolate(0, [0, 30], [0.8, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })})`,
              width: '100%',
              maxWidth: 500,
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 24,
                boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
              }}
            >
              <h3 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#0052CC' }}>
                New Order! 🎉
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16 }}>
                  <div style={{ color: '#6B7280', fontSize: 12 }}>Order ID</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#0052CC', marginTop: 4 }}>
                    #ORD-2847
                  </div>
                </div>
                <div style={{ backgroundColor: '#ECFDF5', borderRadius: 12, padding: 16, borderLeft: '4px solid #10B981' }}>
                  <div style={{ color: '#6B7280', fontSize: 12 }}>Payment Status</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#10B981', marginTop: 4 }}>
                    ✓ Confirmed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Scene 5: Deliver & Analytics - Frames 260-300 */}
      <Sequence from={260} durationInFrames={40}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <div
            style={{
              opacity: fadeIn(0, 30),
              width: '100%',
              maxWidth: 500,
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 24,
                boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
                textAlign: 'center',
              }}
            >
              <h3 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#0052CC' }}>
                Service Delivered ✓
              </h3>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>😊</div>
                <div style={{ color: '#6B7280', fontSize: 14 }}>
                  Payment received, customer satisfied
                </div>
              </div>
              <div
                style={{
                  backgroundColor: '#FFEB3B',
                  color: '#000',
                  padding: '12px 24px',
                  borderRadius: 8,
                  fontWeight: 'bold',
                  fontSize: 14,
                }}
              >
                Ready to scale? Start earning today
              </div>
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  )
}

export default SellerJourney
