// src/styles/Hole8Styles.js

export const modernStyles = {
    container: {
      display: 'flex',
      width: '100%',
      height: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#f5f9f7'
    },
    leftPanel: {
      width: '400px',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#ffffff',
      boxShadow: '2px 0 20px rgba(0,0,0,0.05)',
      zIndex: 1
    },
    card: {
      margin: '16px',
      padding: '24px',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
    },
    header: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#1a1a1a',
      marginBottom: '16px'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      fontSize: '16px',
      border: '1.5px solid #e6e6e6',
      borderRadius: '12px',
      marginBottom: '12px',
      transition: 'border-color 0.2s ease',
      outline: 'none'
    },
    select: {
      width: '100%',
      padding: '12px 16px',
      fontSize: '16px',
      border: '1.5px solid #e6e6e6',
      borderRadius: '12px',
      backgroundColor: '#ffffff',
      cursor: 'pointer',
      outline: 'none'
    },
    button: {
      width: '100%',
      padding: '14px 24px',
      fontSize: '16px',
      fontWeight: '600',
      color: '#ffffff',
      backgroundColor: '#34d399',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'transform 0.2s ease, background-color 0.2s ease'
    },
    chatContainer: {
      flex: 1,
      margin: '16px',
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      overflowY: 'auto',
      marginBottom: 0
    },
    message: {
      padding: '12px 16px',
      marginBottom: '12px',
      borderRadius: '12px',
      fontSize: '15px',
      lineHeight: '1.5'
    },
    announcerMessage: {
      backgroundColor: '#f0fdf4',
      borderLeft: '4px solid #34d399'
    },
    userMessage: {
      backgroundColor: '#f0f9ff',
      borderLeft: '4px solid #38bdf8'
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#4b5563',
      marginBottom: '6px'
    },
    mapContainer: {
      flex: 1,
      position: 'relative'
    },
    ballMarker: {
        width: '20px',
        height: '20px',
        backgroundColor: '#ffffff',
        border: '3px solid #34d399',
        borderRadius: '50%',
        boxShadow: '0 0 10px rgba(52, 211, 153, 0.4), 0 0 20px rgba(255,255,255,0.4)',
        animation: 'pulse 2s infinite',
        transition: 'transform 0.05s ease-out'
      },
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      pointerEvents: 'none'
    },
    overlayContent: {
      pointerEvents: 'auto',
      backgroundColor: '#fff',
      padding: '32px',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      textAlign: 'center',
      maxWidth: '400px'
    },
    overlayTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1a1a1a',
      marginBottom: '16px'
    },
    overlayButton: {
      width: '100%',
      padding: '14px 24px',
      fontSize: '16px',
      fontWeight: '600',
      color: '#ffffff',
      backgroundColor: '#34d399',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'transform 0.2s ease, background-color 0.2s ease'
    },
    windOverlay: {
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '80px',
        height: '60px',
        zIndex: 10,
        pointerEvents: 'none'
      }
  };
  