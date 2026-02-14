import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import './Timeline.css'; // Assuming we'll create a CSS file for timeline

const Timeline = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await apiClient.get('/events');
        // Filter for GET and POST events
        const filteredEvents = response.data.filter(event => 
          event.method === 'GET' || event.method === 'POST'
        ).map((event, index) => ({
          id: `${event.timestamp}-${index}`, // Unique ID for key prop
          type: event.method,
          description: event.action,
          time: event.timestamp,
          user: event.user,
          url: event.url,
          responseStatus: event.responseStatus
        })).sort((a, b) => new Date(b.time) - new Date(a.time)); // Newest first
        setEvents(filteredEvents);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents(); // Initial fetch
    const interval = setInterval(fetchEvents, 3000); // Fetch every 3 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  if (loading) return <p>Loading events...</p>;
  if (error) return <p>Error loading events: {error.message}</p>;

  return (
    <div className="timeline-container">
      <h2>Event Timeline</h2>
      {events.length === 0 ? (
        <p>No GET or POST events recorded yet.</p>
      ) : (
        <div className="timeline-list">
          {events.map(event => (
            <div key={event.id} className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <span className="event-time">{new Date(event.time).toLocaleString()}</span>
                <h3 className="event-type">{event.type}: {event.url}</h3>
                <p className="event-description">User: {event.user}, Status: {event.responseStatus}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Timeline;
