import { PlusCircle, CheckCircle, AlertCircle, UserPlus, Clock } from 'lucide-react';

interface ActivityItem {
  id: number;
  type: string;
  user: string;
  action: string;
  group?: string;
  detail?: string;
  amount?: string;
  time: string;
  icon: React.ReactNode;
}

interface ActivityGroup {
  day: string;
  items: ActivityItem[];
}

const ActivityLog = () => {
  const activities: ActivityGroup[] = [
    { 
      day: 'Today',
      items: [
        { id: 1, type: 'expense', user: 'Ali', action: 'added Lunch expense', group: 'Northern Areas Trip', amount: '4,500', time: '2:30 PM', icon: <PlusCircle size={18} color="#006666" /> },
        { id: 2, type: 'settle', user: 'Zainab', action: 'settled with Hamza', group: 'Apartment 4B', amount: '12,000', time: '11:15 AM', icon: <CheckCircle size={18} color="#1b5e20" /> },
      ]
    },
    {
      day: 'Yesterday',
      items: [
        { id: 3, type: 'dispute', user: 'Usman', action: 'raised a dispute for Rent-a-Car', group: 'Northern Areas Trip', time: '4:45 PM', icon: <AlertCircle size={18} color="#ba1a1a" /> },
        { id: 4, type: 'create', user: 'You', action: 'created group Northern Areas Trip', detail: 'Added 4 members', time: '9:00 AM', icon: <UserPlus size={18} color="var(--color-primary)" /> },
      ]
    }
  ];

  return (
    <div style={{ maxWidth: '800px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h2 className="text-headline-lg">Activity Log</h2>
        <p className="text-body-lg">A chronicle of shared experiences and financial harmony.</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {activities.map((group, idx) => (
          <div key={idx}>
            <h3 className="text-title-lg" style={{ marginBottom: '1.5rem', opacity: 0.6 }}>{group.day}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: 'var(--color-outline-variant)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--color-outline-variant)' }}>
              {group.items.map((item) => (
                <div key={item.id} className="surface-lowest" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                    <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '8px', 
                      backgroundColor: 'var(--color-surface-container-low)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <p style={{ fontSize: '1rem' }}>
                        <span style={{ fontWeight: '700' }}>{item.user}</span> {item.action}
                      </p>
                      <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', marginTop: '0.125rem' }}>
                        {item.group || item.detail}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {item.amount && (
                      <p style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.125rem' }}>Rs. {item.amount}</p>
                    )}
                    <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
                      <Clock size={12} /> {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog;
