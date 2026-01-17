import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

const SAVE_THE_CAT_BEATS = [
  { name: 'Opening Image', description: 'A visual that represents the struggle & tone of the story. A snapshot of the main character\'s problem before the adventure begins.' },
  { name: 'Theme Stated', description: 'What your story is about; the message, usually spoken to the main character or in their presence, but they don\'t understand it yet.' },
  { name: 'Set-up', description: 'Expand on the "before" world. Present the main character\'s life as it is now and what is missing.' },
  { name: 'Catalyst', description: 'The Inciting Incident. A life-changing event that disrupts the status quo.' },
  { name: 'Debate', description: 'The main character doubts the journey they must take. Can they face this challenge?' },
  { name: 'Break into Two', description: 'The main character makes a choice and the journey begins. We leave the "Ordinary World".' },
  { name: 'B Story', description: 'A discussion about the theme, usually involving a love interest or mentor/sidekick.' },
  { name: 'Fun and Games', description: 'The promise of the premise. We see the main character exploring the new world.' },
  { name: 'Midpoint', description: 'The stakes are raised. A moment of clarity where the main character realizes what they are up against.' },
  { name: 'Bad Guys Close In', description: 'Internal and external forces tighten their grip. The main character\'s plan fails.' },
  { name: 'All Is Lost', description: 'The lowest point. The main character loses everything they thought they needed.' },
  { name: 'Dark Night of the Soul', description: 'The main character hits bottom and wallows in hopelessness, but eventually finds the solution.' },
  { name: 'Break into Three', description: 'The main character realizes what they must do to fix not only the external problem, but the internal one as well.' },
  { name: 'Finale', description: 'The main character proves they have learned the theme and executes the plan.' },
  { name: 'Final Image', description: 'A mirror to the Opening Image, showing just how much the main character (and their world) has changed.' },
];

const BeatSheetForm = ({ initialBeats, universeId, projectId }) => {
  const navigate = useNavigate();
  const getBeatValue = (initial, beatName) => {
    if (!initial) return '';
    const snake = beatName.toLowerCase().replace(/ /g, '_').replace(/-/g, '_');
    const altSnake = snake === 'set_up' ? 'setup' : (snake === 'setup' ? 'set_up' : snake);
    return initial[beatName] || initial[snake] || initial[altSnake] || '';
  };

  const [beats, setBeats] = useState(
    SAVE_THE_CAT_BEATS.reduce((acc, beat) => ({
      ...acc,
      [beat.name]: getBeatValue(initialBeats, beat.name)
    }), {})
  );

  React.useEffect(() => {
    if (initialBeats) {
      setBeats(SAVE_THE_CAT_BEATS.reduce((acc, beat) => ({
        ...acc,
        [beat.name]: getBeatValue(initialBeats, beat.name)
      }), {}));
    }
  }, [initialBeats]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (beatName, value) => {
    setBeats(prev => ({ ...prev, [beatName]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    // Aggregate beats into a formatted string
    const content = SAVE_THE_CAT_BEATS.map((beat, index) => {
      return `${index + 1}. ${beat.name}\n${beats[beat.name] || '(No content)'}`;
    }).join('\n\n');

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Authentication required");

      const response = await fetch('/api/bible/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          universe_name: universeId,
          project_id: projectId,
          section_header: '## Beat Sheet (Save the Cat)',
          content: content
        }),
      });

      if (response.ok) {
        setMessage('Beat Sheet saved to Bible successfully!');
        setTimeout(() => {
          navigate('/editor', {
            state: {
              universe_id: universeId,
              project_id: projectId
            }
          });
        }, 1000);
      } else {
        const err = await response.json();
        console.error("Save failed:", err);
        setMessage(`Failed to save: ${err.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gray-900/40 backdrop-blur-md p-10 rounded-[2.5rem] border border-gray-800 shadow-2xl max-w-5xl mx-auto mb-20 animate-fade-in-delayed">
      <div className="flex justify-between items-center mb-10 border-b border-gray-800 pb-8">
        <h2 className="text-4xl font-black text-white tracking-tighter">
          Beat Sheet
        </h2>
        <span className="text-xs font-black uppercase tracking-[0.4em] text-arc-teal">Save the Cat Framework</span>
      </div>

      <div className="space-y-12">
        {SAVE_THE_CAT_BEATS.map((beat) => (
          <div key={beat.name} className="relative group">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-2 w-2 bg-arc-orange rounded-full group-hover:scale-150 transition-transform"></span>
              <label className="text-white font-bold text-xl tracking-tight">{beat.name}</label>
            </div>

            <textarea
              className="w-full bg-gray-800/30 border border-gray-700 rounded-2xl p-6 text-white font-courier text-lg focus:outline-none focus:border-arc-teal focus:ring-1 focus:ring-arc-teal transition-all min-h-[150px] shadow-inner leading-relaxed"
              placeholder={`Outline your ${beat.name}...`}
              value={beats[beat.name]}
              onChange={(e) => handleChange(beat.name, e.target.value)}
            />

            <p className="mt-3 text-gray-500 text-sm font-light italic px-2">
              {beat.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-16 pt-10 border-t border-gray-800 flex items-center justify-between">
        <span className="text-arc-teal font-black uppercase tracking-widest text-xs animate-pulse">{message}</span>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-10 py-4 rounded-xl font-black text-white transition-all transform active:scale-95 ${saving ? 'bg-gray-700 cursor-not-allowed' : 'bg-arc-teal hover:bg-opacity-90 shadow-xl shadow-arc-teal/20'}`}
        >
          {saving ? 'SYNCING...' : 'SAVE TO BIBLE'}
        </button>
      </div>
    </div>
  );
};

export default BeatSheetForm;
