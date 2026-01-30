export const formatLine = (type, text) => {
  let formattedText = text;
  let className = "outline-none resize-none bg-transparent font-courier text-[12pt] leading-normal placeholder-gray-300 ";

  switch (type) {
    case 'Scene Heading':
      formattedText = text.toUpperCase();
      className += "slug";
      break;

    case 'Action':
      className += "action";
      break;

    case 'Character':
      formattedText = text.toUpperCase();
      className += "character"; 
      break;

    case 'Dialogue':
      className += "dialogue";
      break;

    case 'Parenthetical':
      className += "parenthetical";
      break;

    default:
      className += "action";
  }

  return { text: formattedText, className };
};
