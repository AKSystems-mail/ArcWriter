import React from 'react';

const ProjectHeader = ({ projectTitle, moodImageSrc }) => {
  return (
    <div className="relative w-full h-80 bg-obsidian-black rounded-lg overflow-hidden shadow-2xl mb-12">
      {/* Mood Image Placeholder - Cinematic Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-500" 
        style={{ backgroundImage: `url(${moodImageSrc || 'https://via.placeholder.com/1200x400?text=Cinematic+Mood+Image'})` }}
      >
        {/* Gradient Overlay for Cinematic Feel */}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-black via-transparent to-transparent opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian-black via-transparent to-transparent opacity-70"></div>
      </div>

      {/* Content - Title and Accents */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center p-6">
        <h1 className="text-6xl font-extrabold text-white leading-tight mb-4 tracking-wider">
          {projectTitle || "Untitled Project"}
        </h1>
        <div className="h-1 w-24 bg-arc-teal my-2 rounded-full"></div>
        <p className="text-xl text-gray-300 font-light italic">
          Crafting the Next Big Story
        </p>
        <div className="h-1 w-24 bg-arc-orange my-2 rounded-full"></div>
      </div>
    </div>
  );
};

export default ProjectHeader;
