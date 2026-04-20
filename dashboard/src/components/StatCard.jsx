// dashboard/src/components/StatCard.jsx

const StatCard = ({ title, value, subtitle, color = '#6366f1' }) => {
  return (
    <div style={{
      background: '#1e293b',
      borderRadius: '12px',
      padding: '24px',
      border: `1px solid #334155`,
      borderTop: `3px solid ${color}`,
    }}>
      <p style={{
        fontSize: '13px',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '8px',
      }}>
        {title}
      </p>
      <p style={{
        fontSize: '36px',
        fontWeight: '700',
        color: '#f1f5f9',
        marginBottom: '4px',
      }}>
        {value}
      </p>
      {subtitle && (
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;