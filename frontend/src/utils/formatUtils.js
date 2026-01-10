export const formatLine = (type, text) => {
  let formattedText = text;
  let className = "w-full outline-none resize-none bg-transparent font-courier text-[12pt] leading-normal placeholder-gray-300";

  switch (type) {
    case 'Scene Heading':
      // Force UPPERCASE and Bold
      formattedText = text.toUpperCase();
      className += " font-bold uppercase text-left mb-4 mt-6";
      break;

    case 'Action':
      // Standard formatting
      className += " text-left mb-4";
      break;

    case 'Character':
      // Center align (visual approx for script), UPPERCASE
      formattedText = text.toUpperCase();
      // Screenplay character names are usually ~3.5-4 inches from left.
      // We'll use specific margins to simulate centering relative to the page width.
      className += " uppercase text-center w-2/3 mx-auto mt-4 mb-0"; 
      break;

    case 'Dialogue':
      // Center align with narrower margins
      // Dialogue is ~2.5 inches from left, ~2.5 inches from right (approx 3-4 inches wide).
      className += " text-center w-3/4 mx-auto mb-4";
      break;

    case 'Parenthetical':
      // Narrower than dialogue, centered
      className += " text-center w-1/2 mx-auto mb-0 text-sm";
      break;

    default:
      className += " text-left mb-4";
  }

  return { text: formattedText, className };
};
