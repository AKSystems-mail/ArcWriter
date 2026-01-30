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

const HEROS_JOURNEY_BEATS = [
  { name: 'Ordinary World', description: 'The hero\'s starting point, where they feel out of place or incomplete.' },
  { name: 'Call to Adventure', description: 'A challenge or quest is presented.' },
  { name: 'Refusal of the Call', description: 'The hero hesitates or fears the journey ahead.' },
  { name: 'Meeting the Mentor', description: 'A wise figure provides guidance or equipment.' },
  { name: 'Crossing the Threshold', description: 'The hero commits to the adventure and leaves home.' },
  { name: 'Tests, Allies, Enemies', description: 'The hero learns the rules of the new world.' },
  { name: 'Approach to the Inmost Cave', description: 'The hero nears the center of the story and their greatest fear.' },
  { name: 'Ordeal', description: 'A life-or-death crisis where the hero faces their shadow.' },
  { name: 'Reward (Seizing the Sword)', description: 'The hero claims a prize after surviving the ordeal.' },
  { name: 'The Road Back', description: 'The hero heads home but faces new challenges.' },
  { name: 'Resurrection', description: 'A final test where the hero is transformed.' },
  { name: 'Return with the Elixir', description: 'The hero returns home changed, bringing a gift to their people.' },
];

const STORY_CIRCLE_BEATS = [
  { name: 'You', description: 'A character is in a zone of comfort.' },
  { name: 'Need', description: 'But they want something.' },
  { name: 'Go', description: 'They enter an unfamiliar situation.' },
  { name: 'Search', description: 'Adapt to it.' },
  { name: 'Find', description: 'Get what they wanted.' },
  { name: 'Take', description: 'Pay a heavy price for it.' },
  { name: 'Return', description: 'Then go back to their familiar situation.' },
  { name: 'Change', description: 'Having changed.' },
];

const BeatSheetForm = ({ initialBeats, universeId, projectId }) => {
  const navigate = useNavigate();
  const [framework, setFramework] = useState('Save the Cat');

  const getActiveFrameworkBeats = () => {
    if (framework === 'Hero\'s Journey') return HEROS_JOURNEY_BEATS;
    if (framework === 'Story Circle') return STORY_CIRCLE_BEATS;
    return SAVE_THE_CAT_BEATS;
  };

  const getBeatValue = (initial, beatName) => {
    if (!initial) return '';

    // Generate multiple possible key variations
    const snake = beatName.toLowerCase().replace(/ /g, '_').replace(/-/g, '_').replace(/[()]/g, '');

    // Special handling for common variations
    const variations = [
      beatName, // Original name
      snake,    // Snake case
      snake.replace('_of_the_', '_of_'),
      snake.replace('_the_', '_'),
      beatName.toLowerCase().replace(/-/g, ' '),
    ];

    // Special cases
    if (snake === 'set_up') variations.push('setup');
    if (snake === 'setup') variations.push('set_up');
    if (snake.includes('dark_night')) {
      variations.push('dark_night_of_the_soul', 'dark_night_of_soul', 'dark_night');
    }

    // Try each variation
    for (const variant of variations) {
      if (initial[variant] !== undefined && initial[variant] !== null) {
        return initial[variant];
      }
    }

    return '';
  };

  const [beats, setBeats] = useState({});

  React.useEffect(() => {
    const currentBeats = getActiveFrameworkBeats();
    setBeats(currentBeats.reduce((acc, beat) => ({
      ...acc,
      [beat.name]: getBeatValue(initialBeats, beat.name)
    }), {}));
  }, [initialBeats, framework]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (beatName, value) => {
    setBeats(prev => ({ ...prev, [beatName]: value }));
  };

  const calculateReadiness = () => {
    const currentBeats = getActiveFrameworkBeats();
    const filled = currentBeats.filter(b => beats[b.name]?.trim()).length;
    return Math.round((filled / currentBeats.length) * 100);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    const currentBeats = getActiveFrameworkBeats();
    // Aggregate beats into a formatted string
    const content = currentBeats.map((beat, index) => {
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
          section_header: `## Beat Sheet (${framework})`,
          content: content
        }),
      });

      if (response.ok) {
        setMessage('Beat Sheet saved to Bible successfully!');
        setTimeout(() => {
          navigate(`/project/${projectId}/editor`, {
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

  const readiness = calculateReadiness();

  return (
    <div className="bg-gray-900/40 backdrop-blur-md p-10 rounded-[2.5rem] border border-gray-800 shadow-2xl max-w-5xl mx-auto mb-20 animate-fade-in-delayed">
      <div className="flex justify-between items-center mb-10 border-b border-gray-800 pb-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-black text-white tracking-tighter">
            Beat Sheet
          </h2>
          <select 
            value={framework}
            onChange={(e) => setFramework(e.target.value)}
            className="bg-gray-800 text-arc-teal text-xs font-black uppercase tracking-widest border-none rounded-lg p-2 focus:ring-1 focus:ring-arc-teal outline-none"
          >
            <option>Save the Cat</option>
            <option>Hero's Journey</option>
            <option>Story Circle</option>
          </select>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Pitch Readiness</p>
            <p className="text-2xl font-black text-white">{readiness}%</p>
          </div>
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-gray-800"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={175.9}
                strokeDashoffset={175.9 - (175.9 * readiness) / 100}
                className="text-arc-teal transition-all duration-1000 ease-out"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {getActiveFrameworkBeats().map((beat) => (
          <div key={beat.name} className="relative group">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-2 w-2 bg-arc-orange rounded-full group-hover:scale-150 transition-transform"></span>
              <label className="text-white font-bold text-xl tracking-tight">{beat.name}</label>
            </div>

            <textarea
              className="w-full bg-gray-800/30 border border-gray-700 rounded-2xl p-6 text-white font-courier text-lg focus:outline-none focus:border-arc-teal focus:ring-1 focus:ring-arc-teal transition-all min-h-[150px] shadow-inner leading-relaxed"
              placeholder={`Outline your ${beat.name}...`}
              value={beats[beat.name] || ''}
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
