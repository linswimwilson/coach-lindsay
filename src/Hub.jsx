import { useNavigate } from 'react-router-dom'

const conversations = [
  { path: '/conv1', title: 'Conversation 1', subtitle: 'Gas Exchange Foundations', available: true },
  { path: '/conv2', title: 'Conversation 2', subtitle: 'Compliance, Surfactant & Ventilation', available: true },
  { path: '/conv3', title: 'Conversation 3', subtitle: 'The Numbers', available: true },
  { path: '/conv4', title: 'Conversation 4', subtitle: 'Upper Respiratory', available: false },
  { path: '/conv5', title: 'Conversation 5', subtitle: 'Pneumonia', available: false },
  { path: '/conv6', title: 'Conversation 6', subtitle: 'Asthma', available: false },
  { path: '/conv7', title: 'Conversation 7', subtitle: 'Emphysema — Pink Puffer', available: true },
  { path: '/conv8', title: 'Conversation 8', subtitle: 'Chronic Bronchitis — Blue Bloater', available: true },
  { path: '/conv9', title: 'Conversation 9', subtitle: 'Restrictive Diseases', available: true },
  { path: '/conv10', title: 'Conversation 10', subtitle: 'Putting It All Together', available: false },
]

export default function Hub() {
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px', minHeight: '100vh', fontFamily: "'Source Serif 4', Georgia, serif" }}>
      <div style={{ textAlign: 'center', marginBottom: '32px', paddingTop: '20px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B7355 0%, #A08B6E 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '24px', fontWeight: 700, margin: '0 auto 16px' }}>CL</div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#2C2420', marginBottom: '8px' }}>Coach Lindsay</h1>
        <p style={{ fontSize: '15px', color: '#8B7355', lineHeight: 1.6 }}>Pulmonary Pathophysiology — Interactive Study Sessions</p>
        <p style={{ fontSize: '13px', color: '#A09080', marginTop: '8px', lineHeight: 1.5 }}>Each conversation builds on the last. Start with Conversation 1 and work your way through. You can use voice or text — tap the Voice button to talk your answers.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {conversations.map((conv) => (
          <button
            key={conv.path}
            onClick={() => conv.available && navigate(conv.path)}
            disabled={!conv.available}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderRadius: '12px',
              border: conv.available ? '1px solid #E8E0D6' : '1px solid #F0ECE6',
              backgroundColor: conv.available ? '#FFF' : '#FAFAF7',
              cursor: conv.available ? 'pointer' : 'default',
              opacity: conv.available ? 1 : 0.5,
              textAlign: 'left', fontFamily: "'Source Serif 4', Georgia, serif",
              transition: 'box-shadow 0.2s ease, transform 0.1s ease',
              boxShadow: conv.available ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
            }}
            onMouseEnter={(e) => { if (conv.available) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = conv.available ? '0 1px 3px rgba(0,0,0,0.04)' : 'none' }}
          >
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: conv.available ? '#2C2420' : '#A09080' }}>{conv.title}</div>
              <div style={{ fontSize: '14px', color: '#8B7355', marginTop: '2px' }}>{conv.subtitle}</div>
            </div>
            {conv.available ? (
              <div style={{ fontSize: '20px', color: '#8B7355' }}>{'\u2192'}</div>
            ) : (
              <div style={{ fontSize: '12px', color: '#A09080', backgroundColor: '#F0ECE6', padding: '4px 10px', borderRadius: '8px' }}>Coming soon</div>
            )}
          </button>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '32px', padding: '16px', fontSize: '12px', color: '#A09080' }}>
        Built with care by Coach Lindsay
      </div>
    </div>
  )
}
