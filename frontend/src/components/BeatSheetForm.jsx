import React, { useState } from 'react';

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

const BeatSheetForm = () => {
  const [beats, setBeats] = useState(
    SAVE_THE_CAT_BEATS.reduce((acc, beat) => ({ ...acc, [beat.name]: '' }), {})
  );
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
      const response = await fetch('http://localhost:5000/api/bible/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_header: '## Beat Sheet (Save the Cat)',
          content: content
        }),
      });

      if (response.ok) {
        setMessage('Beat Sheet saved to Bible successfully!');
      } else {
        setMessage('Failed to save.');
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage('Error saving to backend.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gray-800 p-8 rounded-xl shadow-xl max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-6 border-b border-gray-700 pb-4">
        Beat Sheet <span className="text-arc-teal text-lg font-normal ml-2">(Save the Cat)</span>
      </h2>

      <div className="space-y-6">
        {SAVE_THE_CAT_BEATS.map((beat) => (
          <div key={beat.name} className="relative group">
            <div className="flex items-baseline justify-between mb-2">
              <label className="text-arc-orange font-semibold text-lg">{beat.name}</label>
              {/* Tooltip Icon/Text */}
              <span className="text-gray-500 text-xs cursor-help border border-gray-600 rounded-full w-5 h-5 flex items-center justify-center hover:bg-gray-700">?</span>
            </div>
            
            {/* Tooltip Content */}
            <div className="hidden group-hover:block absolute top-0 right-8 w-64 bg-black/90 text-white text-sm p-3 rounded shadow-lg z-10 border border-gray-600 pointer-events-none">
              {beat.description}
            </div>

            <textarea
              className="w-full bg-gray-900 border border-gray-700 rounded p-4 text-white focus:outline-none focus:border-arc-teal transition-colors min-h-[100px]"
              placeholder={`Describe the ${beat.name}...`}
              value={beats[beat.name]}
              onChange={(e) => handleChange(beat.name, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-700 flex items-center justify-between">
        <span className="text-green-400 font-medium">{message}</span>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-3 rounded-lg font-bold text-black transition-all transform hover:scale-105 ${saving ? 'bg-gray-500 cursor-not-allowed' : 'bg-arc-teal hover:bg-teal-400 shadow-[0_0_15px_rgba(0,206,201,0.5)]'}`}
        >
          {saving ? 'Saving...' : 'Save to Bible'}
        </button>
      </div>
    </div>
  );
};

export default BeatSheetForm;
