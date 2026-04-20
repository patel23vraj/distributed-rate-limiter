import { useEffect, useState } from 'react';

const ServiceBadge = ({ name, status }) => {
  const connected = status === 'connected';
  return (
    <div style={{display:'flex',alignItems:'center',gap:'6px',background:'#0f172a',padding:'4px 10px',borderRadius:'20px',fontSize:'12px'}}>
      <div style={{width:'6px',height:'6px',borderRadius:'50%',background:connected?'#22c55e':'#ef4444'}} />
      {name}
    </div>
  );
};

const Header = () => {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/health');
        const data = await res.json();
        setHealth(data);
      } catch {
        setHealth(null);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={{background:'#1e293b',borderBottom:'1px solid #334155',padding:'16px 32px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
        <div style={{width:'32px',height:'32px',background:'linear-gradient(135deg, #6366f1, #8b5cf6)',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>
          🛡️
        </div>
        <div>
          <h1 style={{fontSize:'18px',fontWeight:'700'}}>Rate Limiter Dashboard</h1>
          <p style={{fontSize:'12px',color:'#64748b'}}>Distributed Rate Limiter API</p>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
        {health && (
          <div style={{display:'flex',gap:'8px'}}>
            <ServiceBadge name="Database" status={health.services?.database} />
            <ServiceBadge name="Redis" status={health.services?.redis} />
          </div>
        )}
        <a href="http://localhost:3000/api-docs" target="_blank" rel="noreferrer" style={{background:'#6366f1',color:'white',padding:'8px 16px',borderRadius:'8px',fontSize:'13px',fontWeight:'500'}}>
          API Docs
        </a>
      </div>
    </header>
  );
};

export default Header;
