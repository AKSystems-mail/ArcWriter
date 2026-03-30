import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { Target, Save, RefreshCw, ChevronRight } from 'lucide-react';
import ContextualHelp from './ContextualHelp';

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

const TV_ACT_STRUCTURE = [
  { name: 'Cold Open', description: 'Hook the audience immediately. Set the tone and introduce the primary conflict of the episode.' },
  { name: 'Act 1', description: 'The Set-up. Introduce the episode\'s goal and the obstacles standing in the way.' },
  { name: 'Act 2', description: 'Complications arise. The stakes are raised as the protagonist\'s initial plan fails.' },
  { name: 'Act 3', description: 'The Turning Point. A major shift in the story that leads to the climax.' },
  { name: 'Act 4', description: 'The Climax. The highest point of tension where the main conflict is addressed.' },
  { name: 'Act 5', description: 'The Resolution. The immediate aftermath of the climax.' },
  { name: 'Tag', description: 'A final beat that provides a button on the story or a hook for the next episode.' },
];

const BeatSheetForm = ({ initialBeats, universeId, projectId, format = 'movie' }) => {
  const navigate = useNavigate();
  const [framework, setFramework] = useState('Save the Cat');

  const getActiveFrameworkBeats = () => {
    if (format === 'tv_series') return TV_ACT_STRUCTURE;
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

  useEffect(() => {
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
        setMessage('SYNC SUCCESSFUL');
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
        setMessage(`SYNC ERROR: ${err.detail || 'Unknown'}`);
      }
    } catch (error) {
      setMessage(`ERROR: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const readiness = calculateReadiness();

  return (
    <div className="bg-[#080808] p-10 md:p-16 rounded-sm border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
            <Target className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16 border-b border-white/5 pb-12">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-arc-orange text-[10px] font-black uppercase tracking-[0.5em] italic">Section 02: Narrative Logic</span>
                        <ContextualHelp sectionId="BEAT_SHEET" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6">
                        Structural <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">Blueprint</span>
                    </h2>
                    {format !== 'tv_series' && (
                        <div className="relative w-64">
                            <select 
                                value={framework}
                                onChange={(e) => setFramework(e.target.value)}
                                className="w-full bg-black text-arc-teal text-[10px] font-black uppercase tracking-[0.3em] border border-white/10 rounded-sm p-4 focus:border-arc-teal outline-none appearance-none cursor-pointer"
                            >
                                <option>Save the Cat</option>
                                <option>Hero's Journey</option>
                                <option>Story Circle</option>
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-white/60 pointer-events-none" />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-8 bg-black/50 p-6 border border-white/5 rounded-sm">
                    <div className="text-right">
                        <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em] mb-2">Pitch Readiness</p>
                        <p className="text-3xl font-black text-white tracking-tighter">{readiness}%</p>
                    </div>
                    <div className="relative w-16 h-16">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="32"
                                cy="32"
                                r="30"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="transparent"
                                className="text-white/5"
                            />
                            <circle
                                cx="32"
                                cy="32"
                                r="30"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="transparent"
                                strokeDasharray={188.5}
                                strokeDashoffset={188.5 - (188.5 * readiness) / 100}
                                className="text-arc-teal transition-all duration-1000 ease-out shadow-glow"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-12 max-w-4xl">
                {getActiveFrameworkBeats().map((beat, idx) => (
                    <div key={beat.name} className="relative group">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-[10px] font-black text-white/40 w-6">{(idx + 1).toString().padStart(2, '0')}</span>
                            <div className="h-px flex-1 bg-white/5" />
                            <label className="text-white font-black text-xs uppercase tracking-[0.2em]">{beat.name}</label>
                        </div>

                        <div className="relative">
                            <textarea
                                className="w-full bg-black border border-white/10 rounded-sm p-8 text-white font-courier text-lg focus:outline-none focus:border-arc-teal transition-all min-h-[180px] leading-relaxed placeholder:text-gray-900"
                                placeholder={`DRAFTING: ${beat.name.toUpperCase()}...`}
                                value={beats[beat.name] || ''}
                                onChange={(e) => handleChange(beat.name, e.target.value)}
                            />
                            <div className="absolute top-0 left-0 w-[1px] h-0 bg-arc-orange group-focus-within:h-full transition-all duration-500" />
                        </div>

                        <p className="mt-4 text-[10px] text-white/60 font-bold uppercase tracking-widest pl-2">
                            {beat.description}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${message.includes('ERROR') ? 'bg-red-500' : 'bg-arc-teal'} animate-pulse`} />
                    <span className="text-white/70 font-black uppercase tracking-[0.2em] text-[9px]">{message || 'SYSTEM READY'}</span>
                </div>
                
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="group relative bg-white hover:bg-arc-teal text-black hover:text-white px-16 py-6 rounded-sm font-black text-[10px] uppercase tracking-[0.4em] transition-all disabled:opacity-50 shadow-2xl flex items-center gap-4"
                >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'SYNCHRONIZING...' : 'COMMIT TO BIBLE'}
                </button>
            </div>
        </div>
    </div>
  );
};

export default BeatSheetForm;

