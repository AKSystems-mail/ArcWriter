import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../firebase';
// import ConfettiExplosion from 'react-confetti-explosion'; // If using a library

const COMPLETENESS_CRITERIA = {
  logline: 10,
  synopsis: 10,
  script_pages_gt_10: 30, // Script > 10 pages
  character_anchor: 20,
  poster: 15,
  teaser: 15,
};

const ProjectHeader = ({ universeName, projectId, projectTitle, moodImageSrc }) => {
  const [projectData, setProjectData] = useState(null);
  const [completenessPercentage, setCompletenessPercentage] = useState(0);
  const [isConfettiExploding, setIsConfettiExploding] = useState(false);

  const fetchProjectData = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`http://localhost:5000/api/project/${universeName}/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch project data');
      }
      const data = await response.json();
      setProjectData(data);
    } catch (error) {
      console.error("Error fetching project data:", error);
    }
  };

  useEffect(() => {
    if (universeName && projectId) {
      fetchProjectData();
    }
  }, [universeName, projectId]);

  useEffect(() => {
    if (projectData) {
      const calculateCompleteness = () => {
        let score = 0;
        let totalPossible = 0;

        // Logline
        if (projectData.logline && projectData.logline.trim().length > 0) {
          score += COMPLETENESS_CRITERIA.logline;
        }
        totalPossible += COMPLETENESS_CRITERIA.logline;

        // Synopsis (assuming it's part of project_bible_content and needs parsing)
        // For simplicity, checking if project_bible_content exists and has some length
        // A more robust check would parse the actual synopsis section.
        // For now, project_bible_content isn't directly in projectData, but can be fetched
        // or inferred. Assuming a separate API call for full bible content if needed.
        // For the meter, we'll use a simple placeholder check.
        if (projectData.logline && projectData.logline.trim().length > 5) { // Placeholder: If logline exists, assume some synopsis
          score += COMPLETENESS_CRITERIA.synopsis;
        }
        totalPossible += COMPLETENESS_CRITERIA.synopsis;

        // Script > 10 pages
        if (projectData.script_page_count && projectData.script_page_count > 10) {
          score += COMPLETENESS_CRITERIA.script_pages_gt_10;
        }
        totalPossible += COMPLETENESS_CRITERIA.script_pages_gt_10;

        // Character Anchor
        if (projectData.character_anchor_url) {
          score += COMPLETENESS_CRITERIA.character_anchor;
        }
        totalPossible += COMPLETENESS_CRITERIA.character_anchor;

        // Poster
        if (projectData.poster_url) {
          score += COMPLETENESS_CRITERIA.poster;
        }
        totalPossible += COMPLETENESS_CRITERIA.poster;

        // Teaser
        if (projectData.teaser_url) {
          score += COMPLETENESS_CRITERIA.teaser;
        }
        totalPossible += COMPLETENESS_CRITERIA.teaser;

        return totalPossible > 0 ? (score / totalPossible) * 100 : 0;
      };

      const percentage = calculateCompleteness();
      setCompletenessPercentage(percentage);

      if (percentage === 100 && !isConfettiExploding) {
        setIsConfettiExploding(true);
        console.log("Confetti time! Pitch Deck is 100% complete!");
        // Trigger confetti animation here
        // If using a library: <ConfettiExplosion />
      } else if (percentage < 100) {
        setIsConfettiExploding(false); // Reset if it drops below 100
      }
    }
  }, [projectData, isConfettiExploding]);

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completenessPercentage / 100) * circumference;

  const handleExportFinalPitchDeck = () => {
    // This button would trigger the PDF download
    const downloadUrl = `http://localhost:5000/api/pitchdeck/download/${universeName}/${projectId}`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="relative w-full h-96 bg-obsidian-black rounded-[2rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] mb-16 border border-gray-900 group">
      {/* Mood Image Placeholder - Cinematic Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
        style={{ backgroundImage: `url(${moodImageSrc || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=2000&q=80'})` }}
      >
        {/* Gradient Overlay for Cinematic Feel */}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-black via-obsidian-black/40 to-transparent opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian-black/80 via-transparent to-transparent opacity-80"></div>
      </div>

      {/* Content - Title and Accents */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center p-12">
        <h1 className="text-7xl font-black text-white leading-tight mb-6 tracking-tighter animate-fade-in drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
          {projectData?.title || projectTitle || "Untitled Project"}
        </h1>
        <div className="flex items-center gap-4 mb-6">
          <div className="h-0.5 w-16 bg-arc-teal rounded-full"></div>
          <p className="text-2xl text-gray-200 font-light tracking-wide animate-fade-in-delayed">
            {projectData?.logline || "Crafting the Next Big Story"}
          </p>
          <div className="h-0.5 w-16 bg-arc-orange rounded-full"></div>
        </div>

        {/* Pitch Deck Completeness Meter */}
        <div className="absolute top-10 right-10 flex items-center space-x-6 animate-fade-in">
          <div className="relative w-28 h-28 transform hover:scale-110 transition-transform cursor-help group/meter">
            <svg className="w-full h-full" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#1f2937"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={completenessPercentage >= 100 ? "#008080" : "#ff8c00"}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                className="transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(255,140,0,0.3)]"
              />
              <text
                x="60"
                y="68"
                textAnchor="middle"
                fontSize="22"
                fill="#FFFFFF"
                className="font-black tracking-tighter"
              >
                {Math.round(completenessPercentage)}%
              </text>
            </svg>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover/meter:opacity-100 transition-opacity text-[10px] font-black uppercase tracking-widest text-gray-400">
              Producer Readiness
            </div>
          </div>
          {completenessPercentage >= 100 && (
            <button
              onClick={handleExportFinalPitchDeck}
              className="bg-white text-black font-black uppercase tracking-widest py-3 px-8 rounded-full hover:bg-arc-teal hover:text-white transition-all duration-500 shadow-2xl animate-fade-in flex items-center gap-2"
            >
              <span>Download Pitch PDF</span>
              <span className="text-xl">⤓</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;